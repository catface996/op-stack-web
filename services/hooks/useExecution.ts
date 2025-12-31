/**
 * useExecution Hook
 *
 * Trigger multi-agent execution and receive SSE stream events
 * Feature: Multi-Agent Execution Integration
 * Updated: 016-diagnosis-sse-refactor - New structured SSE event format
 */

import { useState, useCallback, useRef } from 'react';
import type {
  ExecutorEvent,
  TriggerExecutionRequest,
  CancelExecutionResponse,
  ParsedAgentInfo,
  ExecutionEventType,
} from '../api/types';

// API endpoints
const EXECUTION_TRIGGER_URL = '/api/service/v1/executions/trigger';
const EXECUTION_CANCEL_URL = '/api/service/v1/executions/cancel';

/**
 * Parse agent info from event content
 * Note: Uses regex matching to handle content that may have leading whitespace/newlines
 * or where the agent prefix appears anywhere in the content (SSE token streaming)
 */
export function parseAgentInfo(content: string | null): ParsedAgentInfo | null {
  if (!content) return null;

  // Trim content and check for agent prefixes
  const trimmed = content.trim();

  // Global Supervisor: [Global Supervisor] ...
  // Use regex to match anywhere in content (SSE may stream tokens that append to previous content)
  if (trimmed.startsWith('[Global Supervisor]') || content.includes('[Global Supervisor]')) {
    return { role: 'global_supervisor', name: 'Global Supervisor' };
  }

  // Team Supervisor: [Team: TeamName | Supervisor] ...
  const teamSupervisorMatch = content.match(/\[Team: (.+?) \| Supervisor\]/);
  if (teamSupervisorMatch) {
    return { role: 'team_supervisor', team: teamSupervisorMatch[1] };
  }

  // Worker: [Team: TeamName | Worker: WorkerName] ...
  const workerMatch = content.match(/\[Team: (.+?) \| Worker: (.+?)\]/);
  if (workerMatch) {
    return { role: 'worker', team: workerMatch[1], name: workerMatch[2] };
  }

  return null;
}

/**
 * Classify event type from content
 */
export function getEventType(content: string | null, eventType: string | null): ExecutionEventType {
  if (eventType === 'error') return 'error';
  if (!content) return 'unknown';

  if (content.includes('🎯 开始分析任务') || content.includes('开始分析任务')) return 'task_start';
  if (content.includes('💭 思考中') || content.includes('思考中')) return 'thinking';
  if (content.includes('SELECT:')) return 'team_selection';
  if (content.includes('👔 开始协调') || content.includes('开始协调')) return 'coordination';
  if (content.includes('🔬 开始工作') || content.includes('开始工作')) return 'work_start';
  if (content.includes('THINKING:')) return 'agent_thinking';

  return 'output';
}

export interface UseExecutionOptions {
  /** Callback for each event */
  onEvent?: (event: ExecutorEvent) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Callback when execution completes */
  onComplete?: () => void;
}

export interface UseExecutionResult {
  /** Trigger execution */
  trigger: (topologyId: number, userMessage: string) => Promise<void>;
  /** Cancel current execution (calls cancel API + aborts SSE connection) */
  cancel: () => Promise<boolean>;
  /** Whether execution is in progress */
  isExecuting: boolean;
  /** All received events (new ExecutorEvent format) */
  events: ExecutorEvent[];
  /** Current error (if any) */
  error: Error | null;
  /** Current run ID (from 'lifecycle.started' event, used for cancellation) */
  runId: string | null;
  /** Clear events */
  clearEvents: () => void;
}

/**
 * Backend SSE event format (actual format from backend)
 * Different from the spec's ExecutorEvent format
 */
interface BackendSseEvent {
  type: string;  // e.g., "llm.stream", "lifecycle.started"
  runId: string;
  agentId?: string;
  agentName?: string;
  agentType?: string;  // "global_supervisor", "team_supervisor", "worker"
  teamName?: string | null;
  content?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  agentRole?: string | null;
}

/**
 * Validate that an object is a valid backend SSE event
 */
function isValidBackendEvent(obj: unknown): obj is BackendSseEvent {
  if (!obj || typeof obj !== 'object') return false;
  const event = obj as Record<string, unknown>;

  // Required fields check
  if (typeof event.type !== 'string') return false;
  if (typeof event.timestamp !== 'string') return false;

  return true;
}

/**
 * Transform backend SSE event to ExecutorEvent format
 * This normalizes the actual backend format to our internal format
 */
function transformToExecutorEvent(backend: BackendSseEvent): ExecutorEvent {
  // Parse type like "llm.stream" into category and action
  const [category, action] = backend.type.includes('.')
    ? backend.type.split('.', 2)
    : [backend.type, 'unknown'];

  return {
    run_id: backend.runId || '',
    timestamp: backend.timestamp,
    sequence: 0, // Backend doesn't provide sequence
    source: backend.agentType ? {
      agent_id: backend.agentId || '',
      agent_type: backend.agentType as 'global_supervisor' | 'team_supervisor' | 'worker',
      agent_name: backend.agentName || '',
      team_name: backend.teamName || null,
    } : null,
    event: {
      category: category as 'lifecycle' | 'llm' | 'dispatch' | 'system',
      action: action,
    },
    data: {
      content: backend.content || '',
      ...backend.metadata,
    },
  };
}

/**
 * Hook for triggering multi-agent execution with SSE streaming
 * Updated for new ExecutorEvent format (016-diagnosis-sse-refactor)
 */
export function useExecution(options: UseExecutionOptions = {}): UseExecutionResult {
  const [isExecuting, setIsExecuting] = useState(false);
  const [events, setEvents] = useState<ExecutorEvent[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const trigger = useCallback(async (topologyId: number, userMessage: string) => {
    // Abort any existing execution
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsExecuting(true);
    setEvents([]);
    setError(null);
    setRunId(null);

    const request: TriggerExecutionRequest = { topologyId, userMessage };

    try {
      console.log('[useExecution] Triggering execution:', request);

      const response = await fetch(EXECUTION_TRIGGER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(request),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[useExecution] Stream completed');
          options.onComplete?.();
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          // Skip empty lines and event type lines
          if (!line || line.startsWith('event:')) continue;

          if (line.startsWith('data:')) {
            const jsonStr = line.slice(5); // Remove 'data:' prefix
            if (!jsonStr.trim()) continue;

            try {
              const parsed = JSON.parse(jsonStr);

              // Validate backend event structure (FR-010: graceful error handling)
              if (!isValidBackendEvent(parsed)) {
                console.warn('[useExecution] Malformed event structure, skipping:', parsed);
                continue;
              }

              // Transform backend format to ExecutorEvent format
              const event: ExecutorEvent = transformToExecutorEvent(parsed);
              const eventKey = `${event.event.category}.${event.event.action}`;

              // Capture runId from first event
              if (event.run_id && !runId) {
                console.log('[useExecution] Run started, run_id:', event.run_id);
                setRunId(event.run_id);
              }

              setEvents((prev) => [...prev, event]);
              options.onEvent?.(event);

              // Check for error events (system.error or lifecycle.failed)
              if (eventKey === 'system.error' || eventKey === 'lifecycle.failed') {
                const data = event.data as { error?: string; message?: string };
                const errorMsg = data.error || data.message || 'Unknown execution error';
                console.error('[useExecution] Error event:', errorMsg);
              }

              // Log warning for unrecognized event categories
              const validCategories = ['lifecycle', 'llm', 'dispatch', 'system'];
              if (!validCategories.includes(event.event.category)) {
                console.warn('[useExecution] Unrecognized event category:', event.event.category);
              }
            } catch (e) {
              // FR-010: Graceful error handling - continue processing stream
              console.warn('[useExecution] Failed to parse event JSON, skipping:', jsonStr, e);
            }
          }
        }
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[useExecution] Execution aborted');
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[useExecution] Error:', error);
      setError(error);
      options.onError?.(error);
    } finally {
      setIsExecuting(false);
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [options]);

  const cancel = useCallback(async (): Promise<boolean> => {
    console.log('[useExecution] Cancelling execution, runId:', runId);

    // Step 1: Abort SSE connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Step 2: Call cancel API if we have a runId
    if (!runId) {
      console.warn('[useExecution] No runId available for cancellation');
      setIsExecuting(false);
      return false;
    }

    try {
      const response = await fetch(EXECUTION_CANCEL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      });

      const result: CancelExecutionResponse = await response.json();
      console.log('[useExecution] Cancel result:', result);

      if (result.code === 'SUCCESS') {
        console.log('[useExecution] Execution cancelled successfully');
        setIsExecuting(false);
        return true;
      } else {
        console.warn('[useExecution] Cancel failed:', result.message);
        setIsExecuting(false);
        return false;
      }
    } catch (err) {
      console.error('[useExecution] Cancel API error:', err);
      setIsExecuting(false);
      return false;
    }
  }, [runId]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setError(null);
    setRunId(null);
  }, []);

  return {
    trigger,
    cancel,
    isExecuting,
    events,
    error,
    runId,
    clearEvents,
  };
}
