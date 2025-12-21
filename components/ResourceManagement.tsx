
import React, { useState, useMemo } from 'react';
import { TopologyNode, TopologyLayer } from '../types';

// Layer options for the dropdown
const LAYER_OPTIONS: { value: TopologyLayer; label: string }[] = [
  { value: 'scenario', label: 'Business Scenario' },
  { value: 'flow', label: 'Business Flow' },
  { value: 'application', label: 'Business Application' },
  { value: 'middleware', label: 'Middleware' },
  { value: 'infrastructure', label: 'Infrastructure' },
];
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Server, 
  Database, 
  Activity, 
  Shield,
  Settings,
  AlertTriangle,
  LayoutList,
  LayoutGrid,
  Globe,
  ArrowUpRight,
  Box,
  Cpu,
  Zap,
  Sparkles
} from 'lucide-react';

interface ResourceManagementProps {
  nodes: TopologyNode[];
  onAdd: (node: TopologyNode) => void;
  onUpdate: (node: TopologyNode) => void;
  onDelete: (id: string) => void;
  onViewDetail: (node: TopologyNode) => void;
}

const ITEMS_PER_PAGE = 8;

const ResourceManagement: React.FC<ResourceManagementProps> = ({ nodes, onAdd, onUpdate, onDelete, onViewDetail }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<TopologyNode | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<TopologyNode | null>(null);

  const filteredNodes = useMemo(() => {
    return nodes.filter(node => 
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      node.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [nodes, searchTerm]);

  const totalPages = Math.ceil(filteredNodes.length / ITEMS_PER_PAGE);
  const paginatedNodes = filteredNodes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'Database': return { color: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-500/20', accent: 'bg-purple-600', icon: Database };
      case 'Gateway': return { color: 'text-pink-400', bg: 'bg-pink-950/30', border: 'border-pink-500/20', accent: 'bg-pink-600', icon: Shield };
      case 'Service': return { color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/20', accent: 'bg-blue-600', icon: Server };
      case 'Cache': return { color: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-500/20', accent: 'bg-orange-600', icon: Activity };
      case 'Infrastructure': return { color: 'text-slate-400', bg: 'bg-slate-800/30', border: 'border-slate-700/20', accent: 'bg-slate-500', icon: Cpu };
      default: return { color: 'text-slate-400', bg: 'bg-slate-900', border: 'border-slate-800', accent: 'bg-slate-700', icon: Box };
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
             <Box className="text-cyan-400" /> Infrastructure Registry
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Manage and provision logical resource units across the cluster.</p>
        </div>
        <button
          onClick={() => { setEditingNode(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-cyan-900/20 font-bold text-xs tracking-widest"
        >
          <Plus size={14} /> Add resource
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 shrink-0 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search resources by ID or label..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutList size={16} /></button>
                <button onClick={() => setViewMode('card')} className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={16} /></button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {paginatedNodes.length > 0 ? (
          viewMode === 'list' ? (
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 sticky top-0 z-10">
                    <tr>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Resource</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Status</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">System ID</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                    {paginatedNodes.map((node) => {
                        const style = getTypeStyle(node.type);
                        return (
                          <tr key={node.id} className="hover:bg-slate-800/40 transition-colors group cursor-pointer" onClick={() => onViewDetail(node)}>
                            <td className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg border ${style.bg} ${style.border} ${style.color}`}>
                                        <style.icon size={18} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{node.label}</div>
                                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest">{node.type}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                                    Operational
                                </span>
                            </td>
                            <td className="p-4 font-mono text-xs text-slate-500 opacity-60">{node.id}</td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={(e) => { e.stopPropagation(); onViewDetail(node); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400"><Eye size={16} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingNode(node); setIsModalOpen(true); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400"><Settings size={16} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setNodeToDelete(node); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
                                </div>
                            </td>
                          </tr>
                        );
                    })}
                </tbody>
                </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
                {paginatedNodes.map((node) => {
                    const style = getTypeStyle(node.type);
                    return (
                        <div 
                            key={node.id} 
                            className="relative bg-slate-900 border border-slate-800/80 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all group flex flex-col min-h-[220px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-950/10 cursor-pointer"
                            onClick={() => onViewDetail(node)}
                        >
                            {/* Decorative Top Line */}
                            <div className={`h-1 w-full ${style.accent} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
                            
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg ${style.bg} ${style.border} ${style.color}`}>
                                        <style.icon size={20} />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-green-500 uppercase tracking-wider bg-green-950/20 px-2 py-0.5 rounded border border-green-900/30">
                                        <span className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>
                                        Online
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-base font-bold text-white mb-0.5 truncate group-hover:text-cyan-400 transition-colors leading-tight">{node.label}</h3>
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] opacity-80">{node.type}</div>
                                </div>

                                <div className="space-y-2.5 flex-1">
                                    {node.properties ? (
                                        Object.entries(node.properties).slice(0, 2).map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                                                    {key.toLowerCase().includes('region') ? <Globe size={12} className="text-slate-500" /> : 
                                                     key.toLowerCase().includes('replicas') ? <Box size={12} className="text-slate-500" /> : 
                                                     <Zap size={12} className="text-slate-500" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[10px] text-slate-500 leading-none mb-1 capitalize">{key}</div>
                                                    <div className="text-xs text-slate-200 font-bold truncate">{value}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center gap-3 opacity-40">
                                            <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                                                <Activity size={12} className="text-slate-600" />
                                            </div>
                                            <div className="text-[10px] text-slate-600 italic">No metrics defined</div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 pt-4 border-t border-slate-800/40 flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); onViewDetail(node); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all"><Eye size={15} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingNode(node); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all"><Settings size={15} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setNodeToDelete(node); setIsDeleteModalOpen(true); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-red-400 transition-all"><Trash2 size={15} /></button>
                                    </div>
                                    <button className="px-2.5 py-1 rounded bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold transition-all flex items-center gap-1.5">
                                        Analyze <ArrowUpRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
              <Server size={48} className="opacity-10 mb-4" />
              <p className="text-sm font-bold tracking-wide">No active resources detected in this segment.</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"><ChevronLeft size={14} /> Prev</button>
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest">Inventory segment</span>
            <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{currentPage}</span>
            <span className="text-[10px] text-slate-500 font-bold">/</span>
            <span className="text-xs text-slate-400 font-mono font-bold">{Math.max(1, totalPages)}</span>
        </div>
        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs">Next <ChevronRight size={14} /></button>
      </div>

      {isModalOpen && <ResourceFormModal node={editingNode} onClose={() => setIsModalOpen(false)} onSave={(n) => { if (editingNode) onUpdate(n); else onAdd(n); setIsModalOpen(false); }} />}
      {isDeleteModalOpen && nodeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="flex justify-center mb-4 text-red-500">
               <div className="p-4 bg-red-950/20 rounded-full border border-red-900/30">
                  <AlertTriangle size={32} />
               </div>
            </div>
            <h3 className="font-bold text-xl text-white mb-2 tracking-tight">Decommission Resource?</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">Are you sure you want to remove <span className="text-white font-black underline decoration-red-500/50">{nodeToDelete.label}</span>? This will disrupt any active topological flows.</p>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors">Abort</button>
               <button onClick={() => { onDelete(nodeToDelete.id); setIsDeleteModalOpen(false); }} className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black tracking-widest shadow-lg shadow-red-900/20">Confirm purge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ResourceFormModal: React.FC<{
  node: TopologyNode | null,
  onClose: () => void,
  onSave: (node: TopologyNode) => void
}> = ({ node, onClose, onSave }) => {
  const [formData, setFormData] = useState<TopologyNode>(node || { id: `node-${Math.random().toString(36).substr(2, 5)}`, label: '', type: 'Service', layer: 'application' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-t-cyan-600">
        <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
            <Sparkles size={16} className="text-cyan-400" /> {node ? 'Modify resource record' : 'Register new resource'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 space-y-5">
          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Display Label</label>
              <input
                type="text"
                required
                value={formData.label}
                onChange={e => setFormData({...formData, label: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                placeholder="e.g. Core API Gateway"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Resource Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
              >
                <option value="Service">Service</option>
                <option value="Database">Database</option>
                <option value="Gateway">Gateway</option>
                <option value="Cache">Cache</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Layer</label>
              <select
                value={formData.layer || 'application'}
                onChange={e => setFormData({...formData, layer: e.target.value as TopologyLayer})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
              >
                {LAYER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all">Cancel</button>
            <button type="submit" className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black tracking-widest shadow-lg shadow-cyan-900/20 flex items-center gap-2 transition-all">
              <Save size={16} /> Save record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceManagement;
