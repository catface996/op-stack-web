import React, { useEffect, useRef, useMemo, useState } from 'react';
import { LogMessage } from '../types';
import { Terminal, ArrowRight, Brain, CheckCircle2, ChevronDown, ChevronRight, Wrench } from 'lucide-react';

interface LogStreamProps {
  logs: LogMessage[];
  focusTarget: { agentId: string; ts: number } | null;
}

/**
 * LogItem component - renders a single log message with optional collapsible reasoning
 * Feature: 016-diagnosis-sse-refactor (FR-007a)
 */
interface LogItemProps {
  log: LogMessage;
  setRef: (el: HTMLDivElement | null) => void;
  getStyle: (type: string) => string;
  getIcon: (type: string) => React.ReactNode;
}

const LogItem: React.FC<LogItemProps> = ({ log, setRef, getStyle, getIcon }) => {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [isToolCallsExpanded, setIsToolCallsExpanded] = useState(false);

  return (
    <div
      ref={setRef}
      className={`p-4 rounded-lg border transition-all duration-500 ${getStyle(log.type)} animate-in fade-in slide-in-from-bottom-2`}
    >
      <div className="flex items-center gap-3 mb-2">
        {getIcon(log.type)}
        <span className="text-sm font-bold text-slate-200">{log.fromAgentName}</span>
        {log.toAgentId && <span className="text-xs text-slate-500">→</span>}
        {log.toAgentId && (
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Target
          </span>
        )}
        <span className="text-[10px] text-slate-600 ml-auto font-mono tracking-tighter opacity-60">
          {new Date(log.timestamp).toISOString().split('T')[1].slice(0, 12)}
        </span>
      </div>

      {/* Collapsible Reasoning Section (FR-007a) */}
      {log.reasoning && (
        <div className="ml-8 mb-2">
          <button
            onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
            className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            {isReasoningExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Brain size={14} />
            <span>Thinking...</span>
          </button>
          {isReasoningExpanded && (
            <div className="mt-2 pl-6 text-sm text-purple-300/80 italic whitespace-pre-wrap border-l-2 border-purple-500/30">
              {log.reasoning}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="text-slate-300 pl-8 text-sm leading-relaxed whitespace-pre-wrap font-sans relative">
        {log.content}
        {log.isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 align-middle bg-cyan-500 animate-pulse" />
        )}
      </div>

      {/* Collapsible Tool Calls Section */}
      {log.toolCalls && log.toolCalls.length > 0 && (
        <div className="ml-8 mt-2">
          <button
            onClick={() => setIsToolCallsExpanded(!isToolCallsExpanded)}
            className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isToolCallsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Wrench size={14} />
            <span>Tool Calls ({log.toolCalls.length})</span>
          </button>
          {isToolCallsExpanded && (
            <div className="mt-2 pl-6 space-y-2">
              {log.toolCalls.map((tc, idx) => (
                <div key={idx} className="text-xs border-l-2 border-blue-500/30 pl-3">
                  <div className="text-blue-300 font-medium">{tc.tool}</div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    Args: {JSON.stringify(tc.args, null, 2)}
                  </div>
                  {tc.result !== undefined && (
                    <div className="text-green-400 font-mono text-[10px]">
                      Result: {typeof tc.result === 'object' ? JSON.stringify(tc.result, null, 2) : String(tc.result)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LogStream: React.FC<LogStreamProps> = ({ logs, focusTarget }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Compute a scroll trigger based on logs content (not just length)
  // This ensures we scroll when streaming content updates the last message
  const scrollTrigger = useMemo(() => {
    if (logs.length === 0) return '';
    const lastLog = logs[logs.length - 1];
    return `${logs.length}-${lastLog.content.length}`;
  }, [logs]);

  // Auto-scroll to bottom only if NOT focusing on a specific agent
  useEffect(() => {
    if (!focusTarget && containerRef.current) {
      // Use scrollTop instead of scrollIntoView for smoother experience
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [scrollTrigger, focusTarget]); // Depend on scrollTrigger so it scrolls on content changes

  // Scroll to focused agent
  useEffect(() => {
    if (focusTarget && logs.length > 0) {
       // Find the first occurrence of this agent in the logs
       // Alternatively, we could find the last one. Let's try finding the last one as it's likely the most relevant 'current' action.
       // Actually, locating to the *start* of their block is usually better for reading.
       // Let's find the FIRST log entry for this agent ID.
       const targetLog = logs.find(l => l.fromAgentId === focusTarget.agentId);
       
       if (targetLog) {
         const el = logRefs.current.get(targetLog.id);
         if (el) {
           el.scrollIntoView({ behavior: 'smooth', block: 'center' });
           
           // Visual highlight effect
           el.classList.add('bg-cyan-900/40', 'ring-1', 'ring-cyan-500/50');
           setTimeout(() => {
             el.classList.remove('bg-cyan-900/40', 'ring-1', 'ring-cyan-500/50');
           }, 1500);
         }
       }
    }
  }, [focusTarget]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'instruction': return <ArrowRight size={16} className="text-blue-400" />;
      case 'thought': return <Brain size={16} className="text-purple-400" />;
      case 'report': return <CheckCircle2 size={16} className="text-green-400" />;
      case 'system': return <Terminal size={16} className="text-slate-500" />;
      default: return <Terminal size={16} className="text-slate-500" />;
    }
  };

  const getStyle = (type: string) => {
    switch (type) {
      case 'instruction': return 'border-blue-500/10 bg-blue-950/5';
      case 'thought': return 'border-purple-500/10 bg-purple-950/5';
      case 'report': return 'border-green-500/10 bg-green-950/5';
      default: return 'border-transparent hover:bg-slate-900/30';
    }
  };

  return (
    <div className="flex flex-col h-full font-mono text-sm relative">
      <div ref={containerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-700 space-y-4">
             <Brain size={48} className="opacity-20 animate-pulse" />
             <p className="italic">Waiting for mission protocol...</p>
          </div>
        )}
        
        {logs.map((log) => (
          <LogItem
            key={log.id}
            log={log}
            setRef={(el) => {
              if (el) logRefs.current.set(log.id, el);
              else logRefs.current.delete(log.id);
            }}
            getStyle={getStyle}
            getIcon={getIcon}
          />
        ))}
        <div ref={endRef} className="h-4" />
      </div>
    </div>
  );
};

export default LogStream;