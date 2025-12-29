/**
 * DiagnosisView Component
 *
 * Main diagnosis page with agent hierarchy (left), log stream (center), and topology graph (right)
 * Extracted as separate component to prevent unnecessary re-renders of API panels
 * Feature: Diagnosis Page Integration
 */

import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Sparkles, FileSearch, Square, Play } from 'lucide-react';
import TopologyGraph from './TopologyGraph';
import AgentHierarchy from './AgentHierarchy';
import ApiAgentHierarchy from './ApiAgentHierarchy';
import LogStream from './LogStream';
import { useHierarchicalTeam } from '../services/hooks';
import type { Agent, Team, TopologyGroup, TopologyNode, TopologyLink, LogMessage } from '../types';

interface DiagnosisViewProps {
  // Layout state
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  setIsResizingLeft: (val: boolean) => void;
  setIsResizingRight: (val: boolean) => void;
  // Mock data fallback (when no topologyId)
  globalAgent: Agent;
  activeTeams: Team[];
  dashboardTopology: { nodes: TopologyNode[]; links: TopologyLink[] };
  activeNodeIds: Set<string>;
  // Diagnosis state
  diagnosisScope: TopologyGroup | null;
  setDiagnosisScope: (scope: TopologyGroup | null) => void;
  logs: LogMessage[];
  focusTarget: { agentId: string; ts: number } | null;
  setFocusTarget: (target: { agentId: string; ts: number } | null) => void;
  userQuery: string;
  setUserQuery: (query: string) => void;
  isSimulating: boolean;
  // Actions
  handleAbortDiagnosis: () => void;
  handleExecuteDiagnosis: () => void;
  handleCreateLink: (link: { source: string; target: string; type: string }) => void;
  setIsGeneratingReport: (val: boolean) => void;
}

// Memoized left panel to prevent re-renders when logs change
const LeftPanel = React.memo<{
  topologyId: number | null;
  globalAgent: Agent;
  activeTeams: Team[];
  diagnosisScope: TopologyGroup | null;
  setDiagnosisScope: (scope: TopologyGroup | null) => void;
  setFocusTarget: (target: { agentId: string; ts: number } | null) => void;
  width: number;
  setIsResizing: (val: boolean) => void;
}>(({ topologyId, globalAgent, activeTeams, diagnosisScope, setDiagnosisScope, setFocusTarget, width, setIsResizing }) => {
  // Fetch hierarchical team data - only re-fetches when topologyId changes
  const {
    team: hierarchicalTeam,
    loading: teamLoading,
    error: teamError,
  } = useHierarchicalTeam(topologyId);

  return (
    <>
      <aside style={{ width }} className="bg-slate-900/20 p-2 overflow-y-auto custom-scrollbar text-xs shrink-0">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-2 flex justify-between items-center">
          <span>Hierarchy Stack</span>
          {diagnosisScope && (
            <button onClick={() => setDiagnosisScope(null)} className="text-cyan-400 hover:text-white transition-colors">
              Global View
            </button>
          )}
        </div>
        {/* Use API-based hierarchy when topologyId is available, otherwise use mock data */}
        {topologyId ? (
          <ApiAgentHierarchy
            team={hierarchicalTeam}
            loading={teamLoading}
            error={teamError}
            onAgentClick={(agentId) => setFocusTarget({ agentId: String(agentId), ts: Date.now() })}
          />
        ) : (
          <AgentHierarchy
            globalAgent={globalAgent}
            teams={activeTeams}
            activeTeamIds={new Set()}
            onAgentClick={(agentId) => setFocusTarget({ agentId, ts: Date.now() })}
          />
        )}
      </aside>
      {/* Left resize handle */}
      <div
        className="w-1 bg-slate-800 hover:bg-cyan-500 cursor-col-resize transition-colors shrink-0"
        onMouseDown={() => setIsResizing(true)}
      />
    </>
  );
});

LeftPanel.displayName = 'LeftPanel';

// Memoized right panel to prevent re-renders when logs change
const RightPanel = React.memo<{
  topologyId: number | null;
  dashboardTopology: { nodes: TopologyNode[]; links: TopologyLink[] };
  activeNodeIds: Set<string>;
  handleCreateLink: (link: { source: string; target: string; type: string }) => void;
  width: number;
  setIsResizing: (val: boolean) => void;
}>(({ topologyId, dashboardTopology, activeNodeIds, handleCreateLink, width, setIsResizing }) => {
  return (
    <>
      {/* Right resize handle */}
      <div
        className="w-1 bg-slate-800 hover:bg-cyan-500 cursor-col-resize transition-colors shrink-0"
        onMouseDown={() => setIsResizing(true)}
      />
      <aside style={{ width }} className="bg-slate-900/20 relative shrink-0">
        <div className="absolute top-0 left-0 w-full h-10 border-b border-slate-800 bg-slate-900/40 z-10 flex items-center px-4 font-bold text-[10px] text-slate-400 uppercase tracking-widest">
          Topology Monitor
        </div>
        {/* Use resourceId for API-based data when topologyId is provided, otherwise use mock data */}
        <TopologyGraph
          resourceId={topologyId ?? undefined}
          data={topologyId ? undefined : dashboardTopology}
          activeNodeIds={activeNodeIds}
          onNodeClick={() => {}}
          onCreateLink={handleCreateLink}
          showLegend={false}
        />
      </aside>
    </>
  );
});

RightPanel.displayName = 'RightPanel';

const DiagnosisView: React.FC<DiagnosisViewProps> = ({
  leftSidebarWidth,
  rightSidebarWidth,
  setIsResizingLeft,
  setIsResizingRight,
  globalAgent,
  activeTeams,
  dashboardTopology,
  activeNodeIds,
  diagnosisScope,
  setDiagnosisScope,
  logs,
  focusTarget,
  setFocusTarget,
  userQuery,
  setUserQuery,
  isSimulating,
  handleAbortDiagnosis,
  handleExecuteDiagnosis,
  handleCreateLink,
  setIsGeneratingReport,
}) => {
  const [searchParams] = useSearchParams();
  const topologyIdParam = searchParams.get('topologyId');
  const topologyId = useMemo(
    () => (topologyIdParam ? parseInt(topologyIdParam, 10) : null),
    [topologyIdParam]
  );

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Left Panel - Agent Hierarchy (memoized) */}
      <LeftPanel
        topologyId={topologyId}
        globalAgent={globalAgent}
        activeTeams={activeTeams}
        diagnosisScope={diagnosisScope}
        setDiagnosisScope={setDiagnosisScope}
        setFocusTarget={setFocusTarget}
        width={leftSidebarWidth}
        setIsResizing={setIsResizingLeft}
      />

      {/* Center Panel - Log Stream */}
      <section className="flex-1 flex flex-col bg-slate-950 min-w-0">
        <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-cyan-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Real-time collaboration stream
            </span>
          </div>
          {diagnosisScope && (
            <div className="text-[9px] px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-bold uppercase">
              Focus: {diagnosisScope.name}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <LogStream logs={logs} focusTarget={focusTarget} />
        </div>
        <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 bg-slate-950 border border-slate-700 rounded-xl px-4">
            <Sparkles size={16} className="text-cyan-500" />
            <input
              className="flex-1 h-12 bg-transparent text-sm text-slate-200 focus:outline-none"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Submit directive for hierarchical execution..."
            />
          </div>

          <div className="flex gap-2">
            {logs.length > 0 && !isSimulating && diagnosisScope && (
              <button
                onClick={() => setIsGeneratingReport(true)}
                className="h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <FileSearch size={14} /> GENERATE REPORT
              </button>
            )}
            {isSimulating ? (
              <button
                onClick={handleAbortDiagnosis}
                className="h-12 px-8 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 animate-pulse"
              >
                <Square size={14} fill="currentColor" /> ABORT
              </button>
            ) : (
              <button
                onClick={handleExecuteDiagnosis}
                className="h-12 px-8 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <Play size={14} fill="currentColor" /> EXECUTE
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Right Panel - Topology Graph (memoized) */}
      <RightPanel
        topologyId={topologyId}
        dashboardTopology={dashboardTopology}
        activeNodeIds={activeNodeIds}
        handleCreateLink={handleCreateLink}
        width={rightSidebarWidth}
        setIsResizing={setIsResizingRight}
      />
    </div>
  );
};

export default DiagnosisView;
