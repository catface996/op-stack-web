
import React, { useState, useMemo } from 'react';
import { TopologyNode } from '../types';
import { 
  Search, 
  Plus, 
  Edit2, 
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
  MapPin,
  Box,
  Cpu,
  Zap,
  Globe,
  ArrowUpRight
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
      case 'Database': return { color: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-800', icon: Database };
      case 'Gateway': return { color: 'text-pink-400', bg: 'bg-pink-950/30', border: 'border-pink-800', icon: Shield };
      case 'Service': return { color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-800', icon: Server };
      case 'Cache': return { color: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-800', icon: Activity };
      case 'Infrastructure': return { color: 'text-slate-400', bg: 'bg-slate-800/30', border: 'border-slate-700', icon: Cpu };
      default: return { color: 'text-slate-400', bg: 'bg-slate-900', border: 'border-slate-800', icon: Box };
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Resources Management</h2>
          <p className="text-slate-400 text-sm mt-1">Deploy and monitor hardware clusters and software services.</p>
        </div>
        <button 
          onClick={() => { setEditingNode(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-cyan-900/20 font-medium text-sm"
        >
          <Plus size={16} /> Add Resource
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 shrink-0 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-slate-200"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutList size={16} /></button>
                <button onClick={() => setViewMode('card')} className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={16} /></button>
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap">
              <span className="text-white font-bold">{paginatedNodes.length}</span> / <span className="text-white font-bold">{filteredNodes.length}</span> items
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative">
        {paginatedNodes.length > 0 ? (
          viewMode === 'list' ? (
            <div className="bg-slate-900/30 border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                    <tr>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Resource</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">ID</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900">
                    {paginatedNodes.map((node) => {
                        const style = getTypeStyle(node.type);
                        return (
                          <tr key={node.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => onViewDetail(node)}>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${style.bg} ${style.color}`}>
                                        <style.icon size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{node.label}</div>
                                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">{node.type}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    Online
                                </span>
                            </td>
                            <td className="p-4 font-mono text-xs text-slate-500">{node.id}</td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); onViewDetail(node); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-cyan-400"><Eye size={16} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingNode(node); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400"><Settings size={16} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setNodeToDelete(node); setIsDeleteModalOpen(true); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
                                </div>
                            </td>
                          </tr>
                        );
                    })}
                </tbody>
                </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {paginatedNodes.map((node) => {
                    const style = getTypeStyle(node.type);
                    return (
                        <div 
                            key={node.id} 
                            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all group flex flex-col h-[240px] cursor-pointer relative overflow-hidden shadow-sm"
                            onClick={() => onViewDetail(node)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 ${style.bg} ${style.border} ${style.color}`}>
                                    <style.icon size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{node.type}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-bold text-green-500 uppercase tracking-widest bg-green-950/20 px-2 py-0.5 rounded border border-green-900/30">
                                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                                    Online
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-base font-bold text-white mb-0.5 truncate group-hover:text-cyan-400 transition-colors">{node.label}</h3>
                                <div className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter">ID: {node.id}</div>
                            </div>

                            <div className="space-y-2 flex-1">
                                {node.properties ? (
                                    Object.entries(node.properties).slice(0, 2).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-2 text-xs">
                                            {key.toLowerCase().includes('region') && <Globe size={12} className="text-slate-600" />}
                                            {key.toLowerCase().includes('replicas') && <Box size={12} className="text-slate-600" />}
                                            {key.toLowerCase().includes('provider') && <Zap size={12} className="text-slate-600" />}
                                            <span className="text-slate-500 capitalize">{key}:</span>
                                            <span className="text-slate-300 font-medium truncate">{value}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[10px] text-slate-700 italic">No operational metrics.</div>
                                )}
                            </div>

                            {/* Unified Action Footer */}
                            <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onViewDetail(node); }} 
                                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-cyan-400 transition-all"
                                        title="View Details"
                                    >
                                        <Eye size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setEditingNode(node); setIsModalOpen(true); }} 
                                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-cyan-400 transition-all"
                                        title="Configure Resource"
                                    >
                                        <Settings size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setNodeToDelete(node); setIsDeleteModalOpen(true); }} 
                                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                                        title="Delete Resource"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <button className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 group-hover:text-cyan-400 transition-colors uppercase tracking-widest">
                                    Analyze <ArrowUpRight size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl"><Server size={48} className="opacity-20 mb-4" /><p>No resources found.</p></div>
        )}
      </div>

      <div className="mt-4 flex justify-center items-center gap-4 pt-2 border-t border-slate-900 shrink-0">
        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"><ChevronLeft size={16} /></button>
        <span className="text-sm text-slate-400">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{Math.max(1, totalPages)}</span></span>
        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"><ChevronRight size={16} /></button>
      </div>

      {isModalOpen && <ResourceFormModal node={editingNode} onClose={() => setIsModalOpen(false)} onSave={(n) => { if (editingNode) onUpdate(n); else onAdd(n); setIsModalOpen(false); }} />}
      {isDeleteModalOpen && nodeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4 text-red-500">
               <AlertTriangle size={24} />
               <h3 className="font-bold text-lg text-white">Decommission?</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to remove <span className="text-white font-bold">{nodeToDelete.label}</span> from the infrastructure registry?</p>
            <div className="flex justify-end gap-3">
               <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded text-slate-300 hover:bg-slate-800 text-sm">Cancel</button>
               <button onClick={() => { onDelete(nodeToDelete.id); setIsDeleteModalOpen(false); }} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-bold">Confirm Delete</button>
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
  const [formData, setFormData] = useState<TopologyNode>(node || { id: `node-${Math.random().toString(36).substr(2, 5)}`, label: '', type: 'Service' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-bold text-white">{node ? 'Edit Resource' : 'Add Resource'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Resource Name</label>
            <input 
              type="text" 
              required 
              value={formData.label} 
              onChange={e => setFormData({...formData, label: e.target.value})} 
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type</label>
            <select 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value as any})} 
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none"
            >
              <option value="Service">Service</option>
              <option value="Database">Database</option>
              <option value="Gateway">Gateway</option>
              <option value="Cache">Cache</option>
              <option value="Infrastructure">Infrastructure</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:bg-slate-800 text-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold flex items-center gap-2">
              <Save size={16} /> Save Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceManagement;
