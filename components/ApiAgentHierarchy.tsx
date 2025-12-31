/**
 * ApiAgentHierarchy Component
 *
 * Renders hierarchical agent team structure from API data
 * Used in Diagnosis page to display teams fetched from backend
 * Feature: Diagnosis Page Integration
 */

import React from 'react';
import type { HierarchicalTeamDTO, HierarchicalAgentDTO, HierarchicalTeamNodeDTO } from '../services/api/types';
import { Network, Server, Activity, AlertTriangle, AlertOctagon, Loader2, AlertCircle, Users } from 'lucide-react';

interface ApiAgentHierarchyProps {
  /** Full team data from API */
  team: HierarchicalTeamDTO | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Set of active team IDs (for highlighting) */
  activeTeamIds?: Set<number>;
  /** Currently active agent ID (for highlighting during execution) */
  activeAgentId?: number | null;
  /** Currently active agent name (fallback if ID not matched) */
  activeAgentName?: string | null;
  /** Callback when agent is clicked */
  onAgentClick?: (agentId: number) => void;
}

// Color scheme for different hierarchy levels
const getHierarchyStyle = (hierarchyLevel?: string, isTeamSup?: boolean) => {
  // Team Supervisor - purple theme
  if (isTeamSup || hierarchyLevel === 'TEAM_SUPERVISOR') {
    return {
      bg: 'bg-purple-950/40',
      border: 'border-purple-500/30',
      hoverBg: 'hover:bg-purple-900/50',
      hoverBorder: 'hover:border-purple-500/50',
      iconColor: 'text-purple-400',
    };
  }
  // Team Worker - cyan/teal theme
  return {
    bg: 'bg-cyan-950/30',
    border: 'border-cyan-500/20',
    hoverBg: 'hover:bg-cyan-900/40',
    hoverBorder: 'hover:border-cyan-500/40',
    iconColor: 'text-cyan-400',
  };
};

// Highlight style for active agent
const getActiveStyle = (isActive: boolean, isTeamSup?: boolean) => {
  if (!isActive) return '';
  if (isTeamSup) {
    return 'ring-2 ring-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] bg-purple-900/60';
  }
  return 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] bg-cyan-900/50';
};

// Agent card component with hierarchy-based colors
const AgentCard: React.FC<{
  agent: HierarchicalAgentDTO;
  isTeamSup?: boolean;
  isActive?: boolean;
  onClick?: (id: number) => void;
}> = ({ agent, isTeamSup, isActive, onClick }) => {
  const style = getHierarchyStyle(agent.hierarchyLevel, isTeamSup);
  const activeStyle = getActiveStyle(!!isActive, isTeamSup);

  return (
    <div
      onClick={() => onClick?.(agent.id)}
      className={`
        flex items-center gap-1.5 px-1.5 py-1 rounded border transition-all duration-200 cursor-pointer
        ${style.bg} ${style.border} ${style.hoverBg} ${style.hoverBorder}
        ${activeStyle}
        ${isTeamSup ? 'ml-0' : 'ml-4'}
      `}
    >
      {isTeamSup ? (
        <Server size={12} className={`${style.iconColor} shrink-0`} />
      ) : (
        <Activity size={12} className={`${style.iconColor} shrink-0`} />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-slate-200 truncate">{agent.name}</div>
        {/* Show model name */}
        {agent.model && (
          <div className="text-[9px] text-slate-500 truncate">{agent.model}</div>
        )}
        {/* Show warnings/critical badges if present */}
        {((agent.warnings && agent.warnings > 0) || (agent.critical && agent.critical > 0)) && (
          <div className="flex items-center gap-1">
            {agent.warnings && agent.warnings > 0 && (
              <span className="flex items-center gap-0.5 px-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-[8px] text-yellow-500">
                <AlertTriangle size={7} />{agent.warnings}
              </span>
            )}
            {agent.critical && agent.critical > 0 && (
              <span className="flex items-center gap-0.5 px-0.5 rounded bg-red-500/10 border border-red-500/20 text-[8px] text-red-500">
                <AlertOctagon size={7} />{agent.critical}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const NodeTeam: React.FC<{
  nodeTeam: HierarchicalTeamNodeDTO;
  isLast: boolean;
  isActive?: boolean;
  activeAgentId?: number | null;
  activeAgentName?: string | null;
  onAgentClick?: (id: number) => void;
}> = ({ nodeTeam, isLast, isActive, activeAgentId, activeAgentName, onAgentClick }) => {
  // Check if team supervisor is active
  // Priority: boundId match > name match > pattern match
  const isTeamSupervisorActive = () => {
    if (!nodeTeam.supervisor) return false;
    // Primary: Match by boundId (from SSE agentId)
    if (activeAgentId != null && nodeTeam.supervisor.boundId === activeAgentId) return true;
    // Fallback: Match by name
    if (activeAgentName && nodeTeam.supervisor.name === activeAgentName) return true;
    // Fallback pattern: "[nodeName] Supervisor" matches node name
    if (activeAgentName?.endsWith(' Supervisor')) {
      const teamName = activeAgentName.replace(' Supervisor', '');
      if (teamName === nodeTeam.nodeName) return true;
    }
    return false;
  };

  // Check if a worker agent is active
  // Priority: boundId match > name match
  const isWorkerActive = (agent: HierarchicalAgentDTO) => {
    // Primary: Match by boundId (from SSE agentId)
    if (activeAgentId != null && agent.boundId === activeAgentId) return true;
    // Fallback: Match by name
    if (activeAgentName && agent.name === activeAgentName) return true;
    return false;
  };
  return (
    <div className="flex">
      {/* Left connection line area */}
      <div className="w-4 flex flex-col items-center shrink-0">
        <div className="w-px h-2 bg-slate-600" />
        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
        <div className={`w-px flex-1 ${isLast ? 'bg-transparent' : 'bg-slate-600'}`} />
      </div>

      {/* Right content area */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
          <Users size={10} />
          {nodeTeam.nodeName}
        </div>

        {/* Team Supervisor */}
        {nodeTeam.supervisor ? (
          <AgentCard
            agent={nodeTeam.supervisor}
            isTeamSup={true}
            isActive={isTeamSupervisorActive()}
            onClick={onAgentClick}
          />
        ) : (
          <div className="px-1.5 py-1 rounded border border-dashed border-slate-700 bg-slate-900/30 text-[10px] text-slate-600 italic">
            No supervisor assigned
          </div>
        )}

        {/* Workers */}
        {nodeTeam.workers.map((worker, workerIdx) => {
          const isLastWorker = workerIdx === nodeTeam.workers.length - 1;
          return (
            <div key={worker.id} className="flex mt-0.5">
              <div className="w-2.5 flex flex-col items-center shrink-0">
                <div className="w-px h-1.5 bg-slate-700" />
                <div className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
                <div className={`w-px flex-1 ${isLastWorker ? 'bg-transparent' : 'bg-slate-700'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <AgentCard
                  agent={worker}
                  isActive={isWorkerActive(worker)}
                  onClick={onAgentClick}
                />
              </div>
            </div>
          );
        })}

        {/* No workers message */}
        {nodeTeam.workers.length === 0 && nodeTeam.supervisor && (
          <div className="flex mt-0.5">
            <div className="w-2.5 flex flex-col items-center shrink-0">
              <div className="w-px h-1.5 bg-slate-700" />
              <div className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
            </div>
            <div className="flex-1 min-w-0 px-1.5 py-0.5 text-[9px] text-slate-600 italic">
              No workers
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ApiAgentHierarchy: React.FC<ApiAgentHierarchyProps> = ({
  team,
  loading,
  error,
  activeTeamIds = new Set(),
  activeAgentId,
  activeAgentName,
  onAgentClick,
}) => {
  // Check if global supervisor is active
  // Priority: boundId match > name match > pattern match
  const isGlobalSupervisorActive = () => {
    if (!team?.globalSupervisor) return false;
    // Primary: Match by boundId (from SSE agentId)
    if (activeAgentId != null && team.globalSupervisor.boundId === activeAgentId) return true;
    // Fallback: Match by name
    if (activeAgentName && team.globalSupervisor.name === activeAgentName) return true;
    // Fallback pattern: "Global Supervisor" name from log messages
    if (activeAgentName === 'Global Supervisor') return true;
    return false;
  };
  // Loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4">
        <Loader2 size={24} className="animate-spin mb-2" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Loading team...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 p-4">
        <AlertCircle size={24} className="mb-2" />
        <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Error</span>
        <span className="text-[9px] text-slate-500 text-center">{error}</span>
      </div>
    );
  }

  // No data state
  if (!team) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4">
        <Network size={24} className="opacity-30 mb-2" />
        <span className="text-[10px] font-bold uppercase tracking-widest">No topology selected</span>
        <span className="text-[9px] text-slate-600 text-center mt-1">
          Select a topology to view agent team
        </span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-1 pl-1 custom-scrollbar">
      {/* Topology Name */}
      <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">
        {team.topologyName}
      </div>

      {/* Global Supervisor - indigo theme */}
      {team.globalSupervisor ? (
        <div
          onClick={() => onAgentClick?.(team.globalSupervisor!.id)}
          className={`flex items-center gap-1.5 p-2 bg-indigo-950/40 border border-indigo-500/30 rounded cursor-pointer hover:bg-indigo-900/50 hover:border-indigo-500/50 transition-all mb-1 ${
            isGlobalSupervisorActive()
              ? 'ring-2 ring-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)] bg-indigo-900/60'
              : ''
          }`}
        >
          <Network size={14} className="text-indigo-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-indigo-100 truncate">
              {team.globalSupervisor.name}
            </div>
            {team.globalSupervisor.model && (
              <div className="text-[9px] text-indigo-300/60 truncate">{team.globalSupervisor.model}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-2 bg-slate-900/30 border border-dashed border-slate-700 rounded mb-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Network size={14} className="opacity-50" />
            <span className="text-[10px] italic">No global supervisor assigned</span>
          </div>
        </div>
      )}

      {/* Node Teams */}
      {team.teams.length > 0 ? (
        team.teams.map((nodeTeam, idx) => (
          <NodeTeam
            key={nodeTeam.nodeId}
            nodeTeam={nodeTeam}
            isLast={idx === team.teams.length - 1}
            isActive={activeTeamIds.has(nodeTeam.nodeId)}
            activeAgentId={activeAgentId}
            activeAgentName={activeAgentName}
            onAgentClick={onAgentClick}
          />
        ))
      ) : (
        <div className="flex items-center justify-center p-4 text-slate-600">
          <span className="text-[10px] italic">No node teams</span>
        </div>
      )}
    </div>
  );
};

export default ApiAgentHierarchy;
