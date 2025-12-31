/**
 * DiagnosisView Component
 *
 * Main diagnosis page with agent hierarchy (left), log stream (center), and topology graph (right)
 * Extracted as separate component to prevent unnecessary re-renders of API panels
 * Feature: Diagnosis Page Integration
 * Feature: Multi-Agent Execution Integration
 * Updated: 016-diagnosis-sse-refactor - New structured SSE event format
 */

import React, { useMemo, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Sparkles, FileSearch, Square, Play } from 'lucide-react';
import TopologyGraph from './TopologyGraph';
import AgentHierarchy from './AgentHierarchy';
import ApiAgentHierarchy from './ApiAgentHierarchy';
import LogStream from './LogStream';
import { useHierarchicalTeam, useExecution } from '../services/hooks';
import type { ExecutorEvent, LlmStreamData, LlmReasoningData, LlmToolCallData, LlmToolResultData } from '../services/api/types';
import type { Agent, Team, TopologyGroup, TopologyNode, TopologyLink, LogMessage, LogToolCallInfo } from '../types';

/**
 * Extract agent identifier from an ExecutorEvent
 *
 * New SSE event format (016-diagnosis-sse-refactor):
 * Uses source.agent_type field: 'global_supervisor', 'team_supervisor', 'worker'
 *
 * Display format per FR-002, FR-003, FR-004:
 * - global_supervisor → "Global Supervisor"
 * - team_supervisor → "[team_name] Supervisor"
 * - worker → source.agent_name
 *
 * Fallback: Return 'System' if source is missing (FR-010 edge case handling)
 */
function getAgentIdentifier(event: ExecutorEvent): { id: string; name: string } {
  const { source } = event;

  // Edge case: source is null (e.g., lifecycle.started event)
  if (!source) {
    // Log warning for non-lifecycle events without source
    if (event.event.category !== 'lifecycle' || event.event.action !== 'started') {
      console.warn('[DiagnosisView] Event missing source object:', event);
    }
    return { id: 'system', name: 'System' };
  }

  // FR-002: Identify agents using source.agent_type
  switch (source.agent_type) {
    case 'global_supervisor':
      // FR-003: Display agent name from source.agent_name
      return { id: 'global-supervisor', name: source.agent_name || 'Global Supervisor' };

    case 'team_supervisor':
      // FR-004: Display team context from source.team_name
      if (source.team_name) {
        return {
          id: `team-supervisor-${source.team_name}`,
          name: `${source.team_name} Supervisor`
        };
      }
      return { id: `team-supervisor-${source.agent_id}`, name: source.agent_name };

    case 'worker':
      // FR-003: Display agent_name for workers
      const teamName = source.team_name || 'unknown';
      return {
        id: `worker-${teamName}-${source.agent_name}`,
        name: source.agent_name
      };

    default:
      // Edge case: Unrecognized agent_type - display with agent_name only
      console.warn('[DiagnosisView] Unrecognized agent_type:', source.agent_type);
      return { id: `unknown-${source.agent_id}`, name: source.agent_name || 'Unknown' };
  }
}

/**
 * Get log message type from ExecutorEvent
 * Maps event category/action to visual styling type
 */
function getLogType(event: ExecutorEvent): LogMessage['type'] {
  const { category, action } = event.event;
  const eventKey = `${category}.${action}`;

  // Map event types to log message types for styling
  switch (eventKey) {
    // LLM events
    case 'llm.reasoning':
      return 'thought';
    case 'llm.stream':
    case 'llm.tool_result':
      return 'report';
    case 'llm.tool_call':
      return 'instruction';

    // Lifecycle events (US2) - will be styled as system messages
    case 'lifecycle.started':
    case 'lifecycle.completed':
    case 'lifecycle.failed':
    case 'lifecycle.cancelled':
      return 'system';

    // Dispatch events (US3) - styled as instructions
    case 'dispatch.team':
    case 'dispatch.worker':
      return 'instruction';

    // System events
    case 'system.warning':
    case 'system.error':
    case 'system.topology':
      return 'system';

    default:
      return 'report';
  }
}

/**
 * Extract content from event based on category/action
 * Returns the appropriate text content from event.data
 */
function getEventContent(event: ExecutorEvent): string {
  const { category, action } = event.event;
  const eventKey = `${category}.${action}`;

  switch (eventKey) {
    case 'llm.stream':
      return (event.data as LlmStreamData).content || '';
    case 'llm.reasoning':
      return (event.data as LlmReasoningData).thought || '';
    case 'llm.tool_call': {
      const toolData = event.data as LlmToolCallData;
      return `🔧 Calling tool: ${toolData.tool}`;
    }
    case 'llm.tool_result': {
      const resultData = event.data as LlmToolResultData;
      return `✅ Tool result: ${resultData.tool}`;
    }
    case 'lifecycle.started':
      return '🚀 Execution started';
    case 'lifecycle.completed':
      return `✅ Execution completed: ${(event.data as { summary?: string }).summary || ''}`;
    case 'lifecycle.failed':
      return `❌ Execution failed: ${(event.data as { error?: string }).error || ''}`;
    case 'lifecycle.cancelled':
      return '⏹️ Execution cancelled';
    case 'dispatch.team':
      return `📋 Dispatching to team: ${(event.data as { team_name?: string; task?: string }).team_name} - ${(event.data as { task?: string }).task || ''}`;
    case 'dispatch.worker':
      return `👷 Dispatching to worker: ${(event.data as { worker_name?: string; task?: string }).worker_name} - ${(event.data as { task?: string }).task || ''}`;
    case 'system.warning':
      return `⚠️ ${(event.data as { message?: string }).message || ''}`;
    case 'system.error':
      return `❌ ${(event.data as { message?: string }).message || ''}`;
    default:
      return '';
  }
}

/**
 * Aggregate consecutive ExecutorEvents from the same agent into single LogMessages
 *
 * FR-005: Aggregate llm.stream events from the same agent into a single chat bubble
 * FR-007a: Accumulate llm.reasoning events into the reasoning field
 *
 * Logic:
 * - Group consecutive events from the same agent
 * - llm.stream content appends to main content
 * - llm.reasoning thought appends to reasoning field
 * - llm.tool_call/tool_result tracked in toolCalls array
 */
function aggregateEventsToLogs(events: ExecutorEvent[], isExecuting: boolean): LogMessage[] {
  if (events.length === 0) return [];

  const logs: LogMessage[] = [];
  let currentLog: LogMessage | null = null;
  let currentAgentId: string | null = null;
  let lastKnownAgent: { id: string; name: string } | null = null;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    let agent = getAgentIdentifier(event);
    const eventKey = `${event.event.category}.${event.event.action}`;

    // If agent is 'system' (fallback) and we have a last known agent, use that instead
    // This handles events where source is null but should continue with previous agent
    if (agent.id === 'system' && lastKnownAgent && event.event.category !== 'lifecycle') {
      agent = lastKnownAgent;
    } else if (agent.id !== 'system') {
      // Update last known agent when we successfully identify one
      lastKnownAgent = agent;
    }

    // Check if we should start a new log message
    const shouldStartNewLog = currentAgentId !== agent.id || !currentLog;

    if (shouldStartNewLog) {
      // Finalize current log
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
        content: '',
        type: getLogType(event),
        isStreaming: false,
        reasoning: undefined,
        toolCalls: undefined,
      };
    }

    // Handle different event types
    if (currentLog) {
      switch (eventKey) {
        case 'llm.stream': {
          // FR-005: Aggregate stream content
          const streamData = event.data as LlmStreamData;
          currentLog.content += streamData.content || '';
          break;
        }

        case 'llm.reasoning': {
          // FR-007a: Accumulate reasoning into separate field
          const reasoningData = event.data as LlmReasoningData;
          if (reasoningData.thought) {
            currentLog.reasoning = (currentLog.reasoning || '') + reasoningData.thought;
          }
          break;
        }

        case 'llm.tool_call': {
          // Track tool calls
          const toolData = event.data as LlmToolCallData;
          if (!currentLog.toolCalls) currentLog.toolCalls = [];
          currentLog.toolCalls.push({
            tool: toolData.tool,
            args: toolData.args,
          });
          break;
        }

        case 'llm.tool_result': {
          // Match tool result to existing tool call
          const resultData = event.data as LlmToolResultData;
          if (currentLog.toolCalls) {
            const toolCall = currentLog.toolCalls.find(tc => tc.tool === resultData.tool && tc.result === undefined);
            if (toolCall) {
              toolCall.result = resultData.result;
            }
          }
          break;
        }

        // Lifecycle and other events - use formatted content
        default: {
          const content = getEventContent(event);
          if (content) {
            currentLog.content += content;
          }
          break;
        }
      }
    }
  }

  // Add the last log
  if (currentLog) {
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
  activeAgentId?: number | null;
  activeAgentName?: string | null;
}>(({ topologyId, globalAgent, activeTeams, diagnosisScope, setDiagnosisScope, setFocusTarget, width, setIsResizing, activeAgentId, activeAgentName }) => {
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
            activeAgentId={activeAgentId}
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
  const [userQuery, setUserQuery] = useState('');

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

  // Track currently active agent from the last execution event (only during execution)
  // Uses agentId (boundId) from SSE events for accurate matching
  const activeAgentInfo = useMemo(() => {
    if (!isExecuting || executionEvents.length === 0) {
      return { agentId: null, agentName: null, nodeName: null };
    }

    // Find the last event with a valid source
    let lastEventWithSource = null;
    for (let i = executionEvents.length - 1; i >= 0; i--) {
      if (executionEvents[i].source) {
        lastEventWithSource = executionEvents[i];
        break;
      }
    }

    if (!lastEventWithSource || !lastEventWithSource.source) {
      return { agentId: null, agentName: null, nodeName: null };
    }

    const source = lastEventWithSource.source;
    // agent_id from SSE is the boundId (agent bound relationship id)
    // Parse as integer if it's a numeric string, otherwise keep as null
    let agentId: number | null = null;
    if (source.agent_id) {
      const parsed = parseInt(source.agent_id, 10);
      agentId = isNaN(parsed) ? null : parsed;
    }
    const agentName = source.agent_name || null;
    const nodeName = source.team_name || null;

    return { agentId, agentName, nodeName };
  }, [isExecuting, executionEvents]);

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
        activeAgentId={activeAgentInfo.agentId}
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
