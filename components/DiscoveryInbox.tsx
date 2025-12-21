
import React, { useState, useMemo } from 'react';
import { TopologyNode, TopologyLink } from '../types';
import {
  Inbox,
  Check,
  X,
  Plus,
  Network,
  Zap,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  BrainCircuit,
  Search,
  LayoutList,
  LayoutGrid,
  Database,
  Server,
  Shield,
  Activity,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

interface DiscoveryInboxProps {
  discoveredNodes: TopologyNode[];
  discoveredLinks: TopologyLink[];
  onApproveNode: (node: TopologyNode) => void;
  onRejectNode: (id: string) => void;
  onClear: () => void;
}

const DiscoveryInbox: React.FC<DiscoveryInboxProps> = ({ discoveredNodes, discoveredLinks, onApproveNode, onRejectNode, onClear }) => {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredNodes = useMemo(() => discoveredNodes.filter(n =>
    n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.type.toLowerCase().includes(searchTerm.toLowerCase())
  ), [discoveredNodes, searchTerm]);

  const filteredLinks = useMemo(() => discoveredLinks.filter(l => {
    const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
    const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
    return sourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           targetId.toLowerCase().includes(searchTerm.toLowerCase());
  }), [discoveredLinks, searchTerm]);

  // Combined pagination for nodes and links
  const totalItems = filteredNodes.length + filteredLinks.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Calculate which items to show on current page
  const paginatedNodes = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    if (startIdx >= filteredNodes.length) return [];
    return filteredNodes.slice(startIdx, Math.min(endIdx, filteredNodes.length));
  }, [filteredNodes, currentPage]);

  const paginatedLinks = useMemo(() => {
    const nodesOnPrevPages = Math.min(filteredNodes.length, (currentPage - 1) * ITEMS_PER_PAGE);
    const nodesOnCurrentPage = paginatedNodes.length;
    const linksStartIdx = Math.max(0, (currentPage - 1) * ITEMS_PER_PAGE - filteredNodes.length);
    const remainingSlots = ITEMS_PER_PAGE - nodesOnCurrentPage;
    if (remainingSlots <= 0) return [];
    return filteredLinks.slice(linksStartIdx, linksStartIdx + remainingSlots);
  }, [filteredLinks, filteredNodes.length, paginatedNodes.length, currentPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Database': return <Database size={20} className="text-purple-400" />;
      case 'Gateway': return <Shield size={20} className="text-pink-400" />;
      case 'Service': return <Server size={20} className="text-blue-400" />;
      case 'Cache': return <Activity size={20} className="text-orange-400" />;
      default: return <Server size={20} className="text-slate-400" />;
    }
  };

  if (discoveredNodes.length === 0 && discoveredLinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-700">
        <Inbox size={48} className="opacity-10 mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Discovery queue is empty</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <BrainCircuit className="text-purple-400" /> Discovery Inbox
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Awaiting human validation of AI-inferred architectural changes.</p>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-2 text-slate-500 hover:text-red-400 px-4 py-2 rounded-lg transition-all font-bold text-xs tracking-widest hover:bg-slate-900"
        >
          <Trash2 size={14} /> Clear queue
        </button>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 shrink-0 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search discovered items..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-purple-500/50 text-slate-200 transition-all"
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {filteredNodes.length} Nodes • {filteredLinks.length} Links
          </div>
          <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {viewMode === 'card' ? (
          <div className="space-y-6">
            {/* Discovered Nodes - Card View */}
            {paginatedNodes.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Plus size={12} /> Discovered Nodes ({filteredNodes.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {paginatedNodes.map(node => (
                    <div
                      key={node.id}
                      className="relative bg-slate-900 border border-purple-500/30 rounded-xl transition-all flex flex-col min-h-[180px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-950/10 hover:border-purple-500/50"
                    >
                      <div className="h-1 w-full bg-purple-500 opacity-30"></div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-purple-950/30 border border-purple-500/20 rounded-lg">
                            {getNodeIcon(node.type)}
                          </div>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300 font-black uppercase border border-purple-500/30">
                            New
                          </span>
                        </div>

                        <div className="mb-4 flex-1">
                          <h3 className="text-base font-bold text-white mb-0.5 truncate leading-tight">{node.label}</h3>
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] opacity-80">TYPE: {node.type}</div>
                          <div className="text-[9px] text-slate-600 font-mono mt-1 truncate">ID: {node.id}</div>
                        </div>

                        <div className="pt-4 border-t border-slate-800/40 flex items-center justify-between shrink-0">
                          <button
                            onClick={() => onRejectNode(node.id)}
                            className="p-1.5 hover:bg-red-950/50 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                            title="Reject"
                          >
                            <X size={18} />
                          </button>
                          <button
                            onClick={() => onApproveNode(node)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-purple-900/20 flex items-center gap-1.5"
                          >
                            <Check size={12} /> Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discovered Links - Card View */}
            {paginatedLinks.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Network size={12} /> Inferred Links ({filteredLinks.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {paginatedLinks.map((link, idx) => {
                    const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
                    const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
                    return (
                      <div
                        key={idx}
                        className="relative bg-slate-900 border border-purple-500/30 rounded-xl transition-all flex flex-col min-h-[180px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-950/10 hover:border-purple-500/50"
                      >
                        <div className="h-1 w-full bg-purple-500 opacity-30"></div>
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-950/30 border border-purple-500/20 rounded-lg">
                              <Network size={20} className="text-purple-400" />
                            </div>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300 font-black uppercase border border-purple-500/30">
                              New
                            </span>
                          </div>

                          <div className="mb-4 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base font-bold text-white truncate">{sourceId}</span>
                              <ArrowRight size={14} className="text-purple-400 shrink-0" />
                              <span className="text-base font-bold text-white truncate">{targetId}</span>
                            </div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] opacity-80">CONFIDENCE: {(link.confidence! * 100).toFixed(0)}%</div>
                            <div className="text-[9px] text-slate-600 font-mono mt-1">Inferred Traffic</div>
                          </div>

                          <div className="pt-4 border-t border-slate-800/40 flex items-center justify-between shrink-0">
                            <button className="p-1.5 hover:bg-red-950/50 rounded-lg text-slate-500 hover:text-red-400 transition-all" title="Reject">
                              <X size={18} />
                            </button>
                            <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-purple-900/20 flex items-center gap-1.5">
                              <Check size={12} /> Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Discovered Nodes - List View */}
            {paginatedNodes.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Plus size={12} /> Discovered Nodes ({filteredNodes.length})
                </h3>
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Node</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Type</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">ID</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                      {paginatedNodes.map(node => (
                        <tr key={node.id} className="hover:bg-slate-800/40 transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-purple-950/30 border border-purple-500/20 rounded-lg">
                                {getNodeIcon(node.type)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{node.label}</div>
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300 font-black uppercase border border-purple-500/30">
                                  New Discovery
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">{node.type}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs text-slate-400 font-mono">{node.id}</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => onRejectNode(node.id)}
                                className="p-2 hover:bg-red-950/50 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                              >
                                <X size={16} />
                              </button>
                              <button
                                onClick={() => onApproveNode(node)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black tracking-widest rounded-lg transition-all flex items-center gap-1.5"
                              >
                                <Check size={12} /> Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Discovered Links - List View */}
            {paginatedLinks.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Network size={12} /> Inferred Links ({filteredLinks.length})
                </h3>
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Source</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800"></th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Target</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-center">Confidence</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                      {paginatedLinks.map((link, idx) => {
                        const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
                        const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
                        return (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                            <td className="p-4">
                              <span className="text-sm font-bold text-slate-300">{sourceId}</span>
                            </td>
                            <td className="p-4">
                              <ArrowRight size={16} className="text-purple-400" />
                            </td>
                            <td className="p-4">
                              <span className="text-sm font-bold text-slate-300">{targetId}</span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">
                                {(link.confidence! * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button className="p-2 hover:bg-red-950/50 rounded-lg text-slate-500 hover:text-red-400 transition-all">
                                  <X size={16} />
                                </button>
                                <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5">
                                  <Check size={12} /> Approve
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest">Queue segment</span>
          <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{currentPage}</span>
          <span className="text-[10px] text-slate-500 font-bold">/</span>
          <span className="text-xs text-slate-400 font-mono font-bold">{Math.max(1, totalPages)}</span>
        </div>
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default DiscoveryInbox;
