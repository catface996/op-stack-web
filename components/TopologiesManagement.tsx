
import React, { useState, useMemo } from 'react';
import { TopologyGroup } from '../types';
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
  Share2, 
  Layers,
  Calendar,
  Tag,
  AlertTriangle,
  Zap,
  Activity,
  Network,
  LayoutList,
  LayoutGrid,
  ArrowUpRight,
  Settings
} from 'lucide-react';

interface TopologiesManagementProps {
  topologyGroups: TopologyGroup[];
  activeScopeId?: string;
  isSimulating?: boolean;
  onAdd: (tg: TopologyGroup) => void;
  onUpdate: (tg: TopologyGroup) => void;
  onDelete: (id: string) => void;
  onEnter: (id: string) => void;
  onNavigateToDiagnosis: () => void;
}

const ITEMS_PER_PAGE = 8;

const TopologiesManagement: React.FC<TopologiesManagementProps> = ({ 
  topologyGroups, 
  activeScopeId,
  isSimulating,
  onAdd, 
  onUpdate, 
  onDelete, 
  onEnter,
  onNavigateToDiagnosis
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingTg, setEditingTg] = useState<TopologyGroup | null>(null);
  const [viewingTg, setViewingTg] = useState<TopologyGroup | null>(null);
  const [tgToDelete, setTgToDelete] = useState<TopologyGroup | null>(null);

  const filteredTopologyGroups = useMemo(() => {
    return topologyGroups.filter(tg => 
      tg.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tg.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tg.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [topologyGroups, searchTerm]);

  const totalPages = Math.ceil(filteredTopologyGroups.length / ITEMS_PER_PAGE);
  const paginatedTopologyGroups = filteredTopologyGroups.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const openAddModal = () => {
    setEditingTg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tg: TopologyGroup) => {
    setEditingTg(tg);
    setIsModalOpen(true);
  };

  const openDetailModal = (tg: TopologyGroup) => {
    setViewingTg(tg);
    setIsDetailOpen(true);
  };

  const promptDelete = (e: React.MouseEvent, tg: TopologyGroup) => {
    e.stopPropagation();
    setTgToDelete(tg);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (tgToDelete) {
      onDelete(tgToDelete.id);
      setIsDeleteModalOpen(false);
      setTgToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Topologies Management</h2>
          <p className="text-slate-400 text-sm mt-1">Organize and manage infrastructure clusters and sub-systems.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-cyan-900/20 font-medium text-sm"
        >
          <Plus size={16} /> Create Topology
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 shrink-0 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search topologies..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-slate-200"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700">
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <LayoutList size={16} />
                </button>
                <button
                    onClick={() => setViewMode('card')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <LayoutGrid size={16} />
                </button>
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap">
              <span className="text-white font-bold">{paginatedTopologyGroups.length}</span> / <span className="text-white font-bold">{filteredTopologyGroups.length}</span> items
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative">
        {paginatedTopologyGroups.length > 0 ? (
          viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {paginatedTopologyGroups.map((tg) => {
                const isActive = activeScopeId === tg.id;
                const isRunning = isActive && isSimulating;
                return (
                  <div 
                    key={tg.id} 
                    onClick={() => onEnter(tg.id)}
                    className={`group relative bg-slate-900 border rounded-xl p-5 transition-all cursor-pointer flex flex-col h-[240px] ${isActive ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] bg-indigo-950/10' : 'border-slate-800 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-900/10'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg border transition-colors ${isActive ? 'bg-indigo-950/40 border-indigo-500/40' : 'bg-slate-950 border-slate-800 group-hover:border-cyan-500/30 group-hover:bg-cyan-950/20'}`}>
                        <Network size={20} className={isActive ? 'text-indigo-400' : 'text-cyan-500'} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
                            <Layers size={10} /> {tg.nodeIds?.length || 0}
                        </span>
                        {isActive && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/30">
                                <Activity size={10} /> {isRunning ? 'Running' : 'Active'}
                            </span>
                        )}
                      </div>
                    </div>
                    <h3 className={`text-lg font-bold mb-1 line-clamp-1 transition-colors ${isActive ? 'text-indigo-300' : 'text-white group-hover:text-cyan-400'}`}>{tg.name}</h3>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-4 flex-1">{tg.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                        {tg.tags?.slice(0, 2).map((tag, i) => (<span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">{tag}</span>))}
                    </div>

                    {/* Unified Action Footer */}
                    <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); openDetailModal(tg); }} 
                                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-cyan-400 transition-all"
                                title="View Details"
                            >
                                <Eye size={14} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); openEditModal(tg); }} 
                                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-400 transition-all"
                                title="Configure Topology"
                            >
                                <Settings size={14} />
                            </button>
                            <button 
                                onClick={(e) => promptDelete(e, tg)} 
                                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                                title="Delete Topology"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <button className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 group-hover:text-cyan-400 transition-colors uppercase tracking-widest">
                            Explore <ArrowUpRight size={12} />
                        </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Topology Name</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Nodes</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900">
                  {paginatedTopologyGroups.map((tg) => {
                    const isActive = activeScopeId === tg.id;
                    return (
                      <tr key={tg.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => onEnter(tg.id)}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${isActive ? 'bg-indigo-900 text-indigo-400' : 'bg-slate-950 text-cyan-500'}`}><Network size={16} /></div>
                            <div><div className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{tg.name}</div></div>
                          </div>
                        </td>
                        <td className="p-4"><span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">{tg.nodeIds?.length || 0}</span></td>
                        <td className="p-4">{isActive ? <span className="text-[10px] font-bold uppercase text-indigo-400">Active</span> : <span className="text-[10px] text-slate-600 uppercase font-bold">Idle</span>}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); onEnter(tg.id); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-cyan-400"><ArrowUpRight size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(tg); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400"><Settings size={16} /></button>
                            <button onClick={(e) => promptDelete(e, tg)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
           <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl"><Network size={48} className="opacity-20 mb-4" /><p>No topologies found.</p></div>
        )}
      </div>

      <div className="mt-4 flex justify-center items-center gap-4 pt-2 border-t border-slate-900 shrink-0">
        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"><ChevronLeft size={16} /></button>
        <span className="text-sm text-slate-400">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{Math.max(1, totalPages)}</span></span>
        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"><ChevronRight size={16} /></button>
      </div>

      {isModalOpen && <TopologyFormModal tg={editingTg} onClose={() => setIsModalOpen(false)} onSave={(tg) => { if (editingTg) onUpdate(tg); else onAdd(tg); setIsModalOpen(false); }} />}
      {isDetailOpen && viewingTg && <TopologyDetailModal tg={viewingTg} onClose={() => setIsDetailOpen(false)} />}
      {isDeleteModalOpen && tgToDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"><div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6"><div className="flex items-center gap-3 mb-4 text-red-500"><AlertTriangle size={24} /><h3 className="font-bold text-lg text-white">Delete Topology?</h3></div><p className="text-slate-400 text-sm mb-6">Are you sure you want to delete <span className="text-white font-bold">{tgToDelete.name}</span>?</p><div className="flex justify-end gap-3"><button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded text-slate-300 hover:bg-slate-800 text-sm">Cancel</button><button onClick={confirmDelete} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-bold">Confirm Delete</button></div></div></div>}
    </div>
  );
};

const TopologyFormModal: React.FC<{ 
  tg: TopologyGroup | null, 
  onClose: () => void, 
  onSave: (tg: TopologyGroup) => void 
}> = ({ tg, onClose, onSave }) => {
  const [formData, setFormData] = useState<TopologyGroup>(tg || {
    id: `tg-${Math.random().toString(36).substr(2, 6)}`,
    name: '',
    description: '',
    nodeCount: 0,
    createdAt: new Date().toISOString(),
    tags: [],
    nodeIds: []
  });
  const [tagInput, setTagInput] = useState('');
  const handleAddTag = () => { if (tagInput.trim()) { const newTags = formData.tags ? [...formData.tags, tagInput.trim()] : [tagInput.trim()]; setFormData({ ...formData, tags: newTags }); setTagInput(''); } };
  const removeTag = (idx: number) => { const newTags = formData.tags?.filter((_, i) => i !== idx); setFormData({ ...formData, tags: newTags }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"><div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]"><div className="flex items-center justify-between p-4 border-b border-slate-800"><h3 className="font-bold text-white">{tg ? 'Edit Topology' : 'Create Topology'}</h3><button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button></div><form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 space-y-4 overflow-y-auto flex-1"><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Name</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none" /></div><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label><textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none resize-none" /></div><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tags</label><div className="flex gap-2 mb-2"><input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none" /><button type="button" onClick={handleAddTag} className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm">Add</button></div><div className="flex flex-wrap gap-2">{formData.tags?.map((tag, idx) => (<span key={idx} className="flex items-center gap-1 bg-cyan-950 text-cyan-400 px-2 py-1 rounded text-xs border border-cyan-900">{tag}<button type="button" onClick={() => removeTag(idx)} className="hover:text-white"><X size={12}/></button></span>))}</div></div><div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:bg-slate-800 text-sm">Cancel</button><button type="submit" className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold flex items-center gap-2"><Save size={16} /> Save</button></div></form></div></div>
  );
};

const TopologyDetailModal: React.FC<{ tg: TopologyGroup, onClose: () => void }> = ({ tg, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"><div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md"><div className="flex items-center justify-between p-4 border-b border-slate-800"><h3 className="font-bold text-white flex items-center gap-2"><Share2 className="text-cyan-500" size={18} /> Metadata</h3><button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button></div><div className="p-6 space-y-6"><div className="p-4 bg-slate-950 rounded border border-slate-800"><h4 className="text-lg font-bold text-white mb-2">{tg.name}</h4><p className="text-sm text-slate-400 leading-relaxed">{tg.description}</p></div><div className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800"><span className="text-sm text-slate-400">Node Count</span><span className="text-white font-bold text-lg">{tg.nodeIds?.length || 0}</span></div></div><div className="p-4 border-t border-slate-800 flex justify-end"><button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded">Close</button></div></div></div>
);

export default TopologiesManagement;
