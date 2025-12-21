
import React, { useState, useRef, useEffect } from 'react';
import { TopologyNode, TopologyLink, DiscoverySource, LogMessage } from '../types';
import TopologyGraph from './TopologyGraph';
import { Radar, Send, ArrowLeft, Zap, CheckCircle, XCircle, Database, Server, Shield, Activity, Sparkles } from 'lucide-react';

interface ScannerViewProps {
  source: DiscoverySource;
  managedNodes: TopologyNode[];
  managedLinks: TopologyLink[];
  discoveredNodes: TopologyNode[];
  discoveredLinks: TopologyLink[];
  logs: LogMessage[];
  isScanning: boolean;
  onBack: () => void;
  onSendMessage: (message: string) => void;
  onApproveNode: (node: TopologyNode) => void;
  onRejectNode: (nodeId: string) => void;
}

const ScannerView: React.FC<ScannerViewProps> = ({
  source,
  managedNodes,
  managedLinks,
  discoveredNodes,
  discoveredLinks,
  logs,
  isScanning,
  onBack,
  onSendMessage,
  onApproveNode,
  onRejectNode
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [rightPanelWidth, setRightPanelWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Handle resize drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(300, Math.min(700, window.innerWidth - e.clientX));
      setRightPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Combine managed and discovered nodes for topology display
  const combinedTopology = {
    nodes: [
      ...managedNodes,
      ...discoveredNodes.map(n => ({ ...n, isShadow: true }))
    ],
    links: [
      ...managedLinks,
      ...discoveredLinks.map(l => ({ ...l, type: 'inferred' as any }))
    ]
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isScanning) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Database': return <Database size={14} className="text-purple-400" />;
      case 'Gateway': return <Shield size={14} className="text-pink-400" />;
      case 'Service': return <Server size={14} className="text-blue-400" />;
      case 'Cache': return <Activity size={14} className="text-orange-400" />;
      default: return <Server size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/40 border border-cyan-500/30 rounded-lg">
              <Radar size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400">Scanner:</span> {source.name}
              </h2>
              <div className="text-[10px] text-slate-500 font-mono">{source.endpoint}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isScanning && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded animate-pulse">
              <Zap size={12} className="text-cyan-400" />
              <span className="text-[10px] font-bold text-cyan-400">Scanning...</span>
            </div>
          )}
          <div className={`text-[10px] font-bold px-2 py-1 rounded border ${source.status === 'Connected' ? 'text-green-400 border-green-900 bg-green-950/20' : 'text-red-400 border-red-900 bg-red-950/20'}`}>
            {source.status}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Interface */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="h-10 border-b border-slate-800 flex items-center px-4 shrink-0 bg-slate-900/40">
            <Sparkles size={12} className="text-cyan-400 mr-2" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scouter Agent Chat</span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                <Radar size={48} className="opacity-20 mb-4" />
                <p className="text-sm">Start a conversation with the Scouter agent</p>
                <p className="text-xs text-slate-700 mt-1">Ask about infrastructure discovery or scan results</p>
              </div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className={`flex ${log.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    log.type === 'user'
                      ? 'bg-cyan-600 text-white'
                      : log.type === 'system'
                        ? 'bg-slate-800 border border-slate-700 text-slate-300'
                        : log.type === 'discovery'
                          ? 'bg-purple-950/40 border border-purple-500/30 text-purple-200'
                          : 'bg-slate-900 border border-slate-800 text-slate-300'
                  }`}>
                    {log.type !== 'user' && (
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {log.fromAgentName}
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">{log.content}</div>
                    {log.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-slate-900/50 border-t border-slate-800">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 bg-slate-950 border border-slate-700 rounded-xl px-4">
                <Sparkles size={16} className="text-cyan-500 shrink-0" />
                <input
                  className="flex-1 h-12 bg-transparent text-sm text-slate-200 focus:outline-none"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  placeholder="Ask the Scouter agent..."
                  disabled={isScanning}
                />
              </div>
              <button
                type="submit"
                disabled={isScanning || !inputMessage.trim()}
                className="h-12 px-6 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
              >
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </div>

        {/* Draggable Divider */}
        <div
          className="w-1 bg-slate-800 hover:bg-cyan-500 cursor-col-resize transition-colors shrink-0"
          onMouseDown={() => setIsResizing(true)}
        />

        {/* Right: Topology + Discovered Nodes Panel */}
        <div style={{ width: rightPanelWidth }} className="flex flex-col shrink-0">
          {/* Topology Graph */}
          <div className="flex-1 relative bg-slate-950">
            <div className="absolute top-0 left-0 w-full h-10 border-b border-slate-800 bg-slate-900/40 z-10 flex items-center px-4 font-bold text-[10px] text-slate-400 uppercase tracking-widest">
              Infrastructure Map
            </div>
            <TopologyGraph
              data={combinedTopology}
              activeNodeIds={new Set(discoveredNodes.map(n => n.id))}
              onNodeClick={() => {}}
              showLegend={false}
            />
          </div>

          {/* Discovered Nodes List */}
          {discoveredNodes.length > 0 && (
            <div className="h-64 border-t border-slate-800 bg-slate-900/50 flex flex-col">
              <div className="p-3 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  Pending Approval ({discoveredNodes.length})
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {discoveredNodes.map(node => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-purple-500/20 hover:border-purple-500/40 group transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {getNodeIcon(node.type)}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-200 truncate">{node.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate">{node.id}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onApproveNode(node)}
                        className="p-1.5 rounded hover:bg-green-950/50 text-slate-500 hover:text-green-400 transition-all"
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => onRejectNode(node.id)}
                        className="p-1.5 rounded hover:bg-red-950/50 text-slate-500 hover:text-red-400 transition-all"
                        title="Reject"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScannerView;
