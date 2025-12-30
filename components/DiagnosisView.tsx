/**
 * DiagnosisView Component
 *
 * Main diagnosis page with agent hierarchy (left), log stream (center), and topology graph (right)
 * Extracted as separate component to prevent unnecessary re-renders of API panels
 * Feature: Diagnosis Page Integration
 * Feature: Multi-Agent Execution Integration
 */

import React, { useMemo, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Sparkles, FileSearch, Square, Play } from 'lucide-react';
import TopologyGraph from './TopologyGraph';
import AgentHierarchy from './AgentHierarchy';
import ApiAgentHierarchy from './ApiAgentHierarchy';
import LogStream from './LogStream';
import { useHierarchicalTeam, useExecution, parseAgentInfo, getEventType } from '../services/hooks';
import type { ExecutionEvent } from '../services/api/types';
import type { Agent, Team, TopologyGroup, TopologyNode, TopologyLink, LogMessage } from '../types';

/**
 * Extract agent identifier from an ExecutionEvent
 * Priority:
 * 1. Use SSE stream fields (_is_global_supervisor, _team_name, _is_team_supervisor, _worker_name)
 * 2. Parse from content (contains [Agent] prefix)
 * 3. Fallback to 'System'
 */
function getAgentIdentifier(event: ExecutionEvent): { id: string; name: string } {
  // Priority 1: Use SSE stream agent identification fields (most reliable for llm_stream events)
  if (event._is_global_supervisor) {
    return { id: 'global-supervisor', name: 'Global Supervisor' };
  }

  if (event._team_name) {
    if (event._is_team_supervisor) {
      return { id: `team-supervisor-${event._team_name}`, name: `${event._team_name} Supervisor` };
    }
    if (event._worker_name) {
      return { id: `worker-${event._team_name}-${event._worker_name}`, name: event._worker_name };
    }
  }

  // Priority 2: Parse from content (handles events with [Agent] prefix in content)
  const agentInfo = parseAgentInfo(event.content);

  if (agentInfo) {
    if (agentInfo.role === 'global_supervisor') {
      return { id: 'global-supervisor', name: agentInfo.name || 'Global Supervisor' };
    } else if (agentInfo.role === 'team_supervisor') {
      return { id: `team-supervisor-${agentInfo.team}`, name: `${agentInfo.team} Supervisor` };
    } else if (agentInfo.role === 'worker') {
      return { id: `worker-${agentInfo.team}-${agentInfo.name}`, name: agentInfo.name || 'Worker' };
    }
  }

  // Fallback to agentName if available (legacy)
  if (event.agentName) {
    return { id: event.agentName.toLowerCase().replace(/\s+/g, '-'), name: event.agentName };
  }

  return { id: 'system', name: 'System' };
}

/**
 * Get log message type from event
 */
function getLogType(event: ExecutionEvent): LogMessage['type'] {
  const eventType = getEventType(event.content, event.type);

  if (eventType === 'thinking' || eventType === 'agent_thinking') {
    return 'thought';
  } else if (eventType === 'task_start' || eventType === 'coordination' || eventType === 'team_selection') {
    return 'instruction';
  } else if (eventType === 'output' || eventType === 'work_start') {
    return 'report';
  } else if (eventType === 'error') {
    return 'system';
  }
  return 'system';
}

/**
 * Aggregate consecutive events from the same agent into single log messages
 * This ensures all output from one agent appears in a single chat bubble
 *
 * Note: SSE events are token-level streaming where:
 * - Agent prefix like "[Global Supervisor]" comes as one event
 * - Following content like " THINKING: I" comes as separate events WITHOUT prefix
 *
 * Solution: Track "last known agent" and use it when current event can't identify agent
 * (i.e., when getAgentIdentifier returns 'system' as fallback)
 */
function aggregateEventsToLogs(events: ExecutionEvent[], isExecuting: boolean): LogMessage[] {
  if (events.length === 0) return [];

  const logs: LogMessage[] = [];
  let currentLog: LogMessage | null = null;
  let currentAgentId: string | null = null;
  let lastKnownAgent: { id: string; name: string } | null = null;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    let agent = getAgentIdentifier(event);
    const content = event.content || '';

    // If agent is 'system' (fallback) and we have a last known agent, use that instead
    // This handles SSE token streaming where "[Global Supervisor]" and "THINKING:" are separate events
    if (agent.id === 'system' && lastKnownAgent) {
      agent = lastKnownAgent;
    } else if (agent.id !== 'system') {
      // Update last known agent when we successfully identify one
      lastKnownAgent = agent;
    }

    // If same agent as current log, append content directly (no newline - SSE is token-level)
    if (currentAgentId === agent.id && currentLog) {
      currentLog.content += content;
    } else {
      // Different agent - finalize current log and start new one
      if (currentLog) {
        currentLog.isStreaming = false;
        logs.push(currentLog);
      }

      currentAgentId = agent.id;
      currentLog = {
        id: `exec-${event.timestamp}-${i}`,
        timestamp: new Date(event.timestamp).getTime(),
        fromAgentId: agent.id,
        fromAgentName: agent.name,
        content: content,
        type: getLogType(event),
        isStreaming: false,
      };
    }
  }

  // Add the last log
  if (currentLog) {
    // Mark as streaming if execution is still in progress and this is the last message
    currentLog.isStreaming = isExecuting;
    logs.push(currentLog);
  }

  return logs;
}

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
  focusTarget: { agentId: string; ts: number } | null;
  setFocusTarget: (target: { agentId: string; ts: number } | null) => void;
  // Actions
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
  activeAgentName?: string | null;
}>(({ topologyId, globalAgent, activeTeams, diagnosisScope, setDiagnosisScope, setFocusTarget, width, setIsResizing, activeAgentName }) => {
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
            activeAgentName={activeAgentName}
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
  activeNodeName?: string | null;
}>(({ topologyId, dashboardTopology, activeNodeIds, handleCreateLink, width, setIsResizing, activeNodeName }) => {
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
          activeNodeName={activeNodeName}
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
  focusTarget,
  setFocusTarget,
  handleCreateLink,
  setIsGeneratingReport,
}) => {
  const [searchParams] = useSearchParams();
  const topologyIdParam = searchParams.get('topologyId');
  const topologyId = useMemo(
    () => (topologyIdParam ? parseInt(topologyIdParam, 10) : null),
    [topologyIdParam]
  );

  // User query input state
  const [userQuery, setUserQuery] = useState('Analyze system state and health status.');

  // Multi-agent execution with SSE streaming
  const {
    trigger: triggerExecution,
    cancel: cancelExecution,
    isExecuting,
    events: executionEvents,
    error: executionError,
    runId,
    clearEvents,
  } = useExecution({
    onEvent: (event) => {
      console.log('[DiagnosisView] Execution event:', event);
    },
    onError: (err) => {
      console.error('[DiagnosisView] Execution error:', err);
    },
    onComplete: () => {
      console.log('[DiagnosisView] Execution completed');
    },
  });

  // Convert execution events to log messages, aggregating consecutive events from same agent
  const logs = useMemo<LogMessage[]>(() => {
    return aggregateEventsToLogs(executionEvents, isExecuting);
  }, [executionEvents, isExecuting]);

  // Track currently active agent from the last log message (only during execution)
  const activeAgentInfo = useMemo(() => {
    if (!isExecuting || logs.length === 0) {
      return { agentName: null, nodeName: null };
    }

    const lastLog = logs[logs.length - 1];
    const agentName = lastLog.fromAgentName;

    // Extract node/team name from agent info
    // e.g., "Firestone Supervisor" -> "Firestone", "WorkerName" in team "Firestone" -> "Firestone"
    let nodeName: string | null = null;

    // Check if it's a team supervisor (e.g., "TeamName Supervisor")
    if (agentName?.endsWith(' Supervisor') && agentName !== 'Global Supervisor') {
      nodeName = agentName.replace(' Supervisor', '');
    } else if (lastLog.fromAgentId?.startsWith('team-supervisor-')) {
      nodeName = lastLog.fromAgentId.replace('team-supervisor-', '');
    } else if (lastLog.fromAgentId?.startsWith('worker-')) {
      // worker-TeamName-WorkerName -> extract TeamName
      const parts = lastLog.fromAgentId.split('-');
      if (parts.length >= 2) {
        nodeName = parts[1]; // TeamName
      }
    }

    return { agentName, nodeName };
  }, [isExecuting, logs]);

  // Handle execute button click
  const handleExecuteDiagnosis = useCallback(() => {
    if (isExecuting || !userQuery.trim()) return;

    if (!topologyId) {
      console.warn('[DiagnosisView] No topologyId provided, cannot execute');
      return;
    }

    // Clear previous events and trigger new execution
    clearEvents();
    triggerExecution(topologyId, userQuery.trim());
  }, [isExecuting, userQuery, topologyId, clearEvents, triggerExecution]);

  // Handle cancel button click
  const handleCancelDiagnosis = useCallback(async () => {
    const success = await cancelExecution();
    if (success) {
      console.log('[DiagnosisView] Execution cancelled successfully');
    } else {
      console.warn('[DiagnosisView] Failed to cancel execution');
    }
  }, [cancelExecution]);

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
        activeAgentName={activeAgentInfo.agentName}
      />

      {/* Center Panel - Log Stream */}
      <section className="flex-1 flex flex-col bg-slate-950 min-w-0">
        <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Activity size={12} className={isExecuting ? 'text-cyan-400 animate-pulse' : 'text-cyan-400'} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Real-time collaboration stream
            </span>
            {isExecuting && (
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-bold uppercase animate-pulse">
                Executing...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {executionError && (
              <div className="text-[9px] px-2 py-0.5 rounded bg-red-950/40 border border-red-500/30 text-red-300 font-bold uppercase">
                Error: {executionError.message}
              </div>
            )}
            {diagnosisScope && (
              <div className="text-[9px] px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-bold uppercase">
                Focus: {diagnosisScope.name}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {!topologyId && logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              <div className="text-center">
                <p className="mb-2">Select a topology from the Topologies page to start diagnosis.</p>
                <p className="text-xs text-slate-600">Navigate to Topologies → Click "Diagnose" on a topology</p>
              </div>
            </div>
          ) : (
            <LogStream logs={logs} focusTarget={focusTarget} />
          )}
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
            {logs.length > 0 && !isExecuting && diagnosisScope && (
              <button
                onClick={() => setIsGeneratingReport(true)}
                className="h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <FileSearch size={14} /> GENERATE REPORT
              </button>
            )}
            {isExecuting ? (
              <button
                onClick={handleCancelDiagnosis}
                className="h-12 px-8 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 animate-pulse"
              >
                <Square size={14} fill="currentColor" /> CANCEL
              </button>
            ) : (
              <button
                onClick={handleExecuteDiagnosis}
                disabled={!topologyId}
                className={`h-12 px-8 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
                  topologyId
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
                title={!topologyId ? 'Please select a topology first' : undefined}
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
        activeNodeName={activeAgentInfo.nodeName}
      />
    </div>
  );
};

export default DiagnosisView;
