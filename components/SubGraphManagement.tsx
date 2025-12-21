
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
  ArrowUpRight
} from 'lucide-react';

interface TopologyManagementProps {
  topologyGroups: TopologyGroup[];
  activeScopeId?: string; // ID of the currently selected scope (if any)
  isSimulating?: boolean; // Global simulation state
  onAdd: (tg: TopologyGroup) => void;
  onUpdate: (tg: TopologyGroup) => void;
  onDelete: (id: string) => void;
  onEnter: (id: string) => void; // Enter Canvas
  onNavigateToDiagnosis: () => void; // Go to Command Center
}

const ITEMS_PER_PAGE = 8;

const SubGraphManagement: React.FC<TopologyManagementProps> = ({ 
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
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Selection States
  const [editingTg, setEditingTg] = useState<TopologyGroup | null>(null);
  const [viewingTg, setViewingTg] = useState<TopologyGroup | null>(null);
  const [tgToDelete, setTgToDelete] = useState<TopologyGroup | null>(null);

  // Filter and Pagination Logic
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
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Topology Management</h2>
          <p className="text-slate-400 text-sm mt-1">Organize and manage infrastructure clusters and sub-systems.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-cyan-900/20 font-medium text-sm"
        >
          <Plus size={16} /> Create topology
        </button>
      </div>

      {/* Toolbar: Search & View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 shrink-0 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search topologies by name, ID, or tag..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-slate-200"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700">
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    title="List View"
                >
                    <LayoutList size={16} />
                </button>
                <button
                    onClick={() => setViewMode('card')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Card View"
                >
                    <LayoutGrid size={16} />
                </button>
            </div>

            <div className="text-xs text-slate-500 hidden sm:block whitespace-nowrap">
              Showing <span className="text-white font-bold">{paginatedTopologyGroups.length}</span> of <span className="text-white font-bold">{filteredTopologyGroups.length}</span>
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        {paginatedTopologyGroups.length > 0 ? (
          viewMode === 'card' ? (
            // CARD VIEW (Grid)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {paginatedTopologyGroups.map((tg) => {
                const isActive = activeScopeId === tg.id;
                const isRunning = isActive && isSimulating;

                return (
                  <div 
                    key={tg.id} 
                    onClick={() => onEnter(tg.id)}
                    className={`
                      group relative bg-slate-900 border rounded-xl p-5 transition-all cursor-pointer flex flex-col h-[220px]
                      ${isActive 
                        ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] bg-indigo-950/10' 
                        : 'border-slate-800 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-900/10'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`
                        p-2 rounded-lg border transition-colors
                        ${isActive 
                          ? 'bg-indigo-950/40 border-indigo-500/40' 
                          : 'bg-slate-950 border-slate-800 group-hover:border-cyan-500/30 group-hover:bg-cyan-950/20'
                        }
                      `}>
                        <Network size={20} className={isActive ? 'text-indigo-400' : 'text-cyan-500'} />
                      </div>
                      <div className="flex gap-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); openDetailModal(tg); }}
                            className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                            title="View Metadata"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); openEditModal(tg); }}
                            className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                            onClick={(e) => promptDelete(e, tg)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h3 className={`text-lg font-bold mb-1 line-clamp-1 transition-colors ${isActive ? 'text-indigo-300' : 'text-white group-hover:text-cyan-400'}`}>
                      {tg.name}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-4 flex-1">{tg.description}</p>
                    
                    {isActive && (
                       <div 
                          onClick={(e) => { e.stopPropagation(); onNavigateToDiagnosis(); }}
                          className={`
                            absolute bottom-[4.5rem] right-4 px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform
                            ${isRunning 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 animate-pulse' 
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                            }
                          `}
                       >
                          {isRunning ? <Zap size={10} className="fill-current" /> : <Activity size={10} />}
                          {isRunning ? 'Running' : 'Active'}
                       </div>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                        {tg.tags?.slice(0, 2).map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                              {tag}
                            </span>
                        ))}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Layers size={12} /> {tg.nodeIds?.length || 0} Nodes
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar size={12} /> {new Date(tg.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // LIST VIEW (Table)
            <div className="bg-slate-900/30 border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Topology Name</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">ID</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-center">Nodes</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Created</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900">
                  {paginatedTopologyGroups.map((tg) => {
                    const isActive = activeScopeId === tg.id;
                    const isRunning = isActive && isSimulating;
                    
                    return (
                      <tr key={tg.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => onEnter(tg.id)}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${isActive ? 'bg-indigo-900 text-indigo-400' : 'bg-slate-950 text-cyan-500'}`}>
                              <Network size={16} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{tg.name}</div>
                              <div className="text-[10px] text-slate-500 line-clamp-1 max-w-[200px]">{tg.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono text-slate-500">{tg.id}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">
                            {tg.nodeIds?.length || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          {isActive ? (
                            <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${isRunning ? 'text-indigo-400 animate-pulse' : 'text-indigo-300'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-indigo-400' : 'bg-indigo-300'}`}></div>
                              {isRunning ? 'Running' : 'Active'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 uppercase font-bold">Idle</span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-slate-500 font-mono">
                          {new Date(tg.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEnter(tg.id); }}
                                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-cyan-400"
                                title="Open Canvas"
                            >
                              <ArrowUpRight size={16} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); openEditModal(tg); }}
                                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400"
                                title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={(e) => promptDelete(e, tg)}
                                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"
                                title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
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
           <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
              <Network size={48} className="opacity-20 mb-4" />
              <p>No topologies found matching your search.</p>
           </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center items-center gap-4 pt-2 border-t border-slate-900 shrink-0">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-slate-400">
          Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{Math.max(1, totalPages)}</span>
        </span>
        <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <TopologyFormModal 
          tg={editingTg} 
          onClose={() => setIsModalOpen(false)} 
          onSave={(tg) => {
            if (editingTg) onUpdate(tg);
            else onAdd(tg);
            setIsModalOpen(false);
          }} 
        />
      )}

      {/* Detail Modal (For Metadata viewing) */}
      {isDetailOpen && viewingTg && (
        <TopologyDetailModal 
          tg={viewingTg} 
          onClose={() => setIsDetailOpen(false)} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && tgToDelete && (
        <TopologyDeleteModal
          tg={tgToDelete}
          onClose={() => { setIsDeleteModalOpen(false); setTgToDelete(null); }}
          onConfirm={confirmDelete}
        />
      )}
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

  const handleAddTag = () => {
      if (tagInput.trim()) {
          const newTags = formData.tags ? [...formData.tags, tagInput.trim()] : [tagInput.trim()];
          setFormData({ ...formData, tags: newTags });
          setTagInput('');
      }
  };

  const removeTag = (idx: number) => {
      const newTags = formData.tags?.filter((_, i) => i !== idx);
      setFormData({ ...formData, tags: newTags });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50 rounded-t-xl">
          <h3 className="font-bold text-white">{tg ? 'Edit topology' : 'Create topology'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Topology ID</label>
            <input 
              type="text" 
              required
              disabled={!!tg}
              value={formData.id}
              onChange={e => setFormData({...formData, id: e.target.value})}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
                <input 
                   type="text"
                   value={tagInput}
                   onChange={e => setTagInput(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                   placeholder="Add tag..."
                   className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
                <button 
                  type="button" 
                  onClick={handleAddTag} 
                  className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm transition-colors"
                >
                    Add
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1 bg-cyan-950 text-cyan-400 px-2 py-1 rounded text-xs border border-cyan-900">
                        {tag}
                        <button type="button" onClick={() => removeTag(idx)} className="hover:text-white"><X size={12}/></button>
                    </span>
                ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-slate-400 hover:bg-slate-800 text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors flex items-center gap-2">
              <Save size={16} /> Save Topology
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TopologyDetailModal: React.FC<{
  tg: TopologyGroup,
  onClose: () => void
}> = ({ tg, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
         <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2">
             <Share2 className="text-cyan-500" size={18} /> Topology Metadata
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
           <div className="p-4 bg-slate-950 rounded border border-slate-800">
               <h4 className="text-lg font-bold text-white mb-2">{tg.name}</h4>
               <p className="text-sm text-slate-400 leading-relaxed">{tg.description}</p>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                 <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">ID</div>
                 <div className="text-sm font-mono text-cyan-400 truncate">{tg.id}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                 <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Created</div>
                 <div className="text-sm font-medium text-white">{new Date(tg.createdAt).toLocaleDateString()}</div>
              </div>
           </div>

           <div className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-sm text-slate-400">Node Count</span>
                <span className="text-white font-bold text-lg">{tg.nodeIds?.length || 0}</span>
           </div>

           {tg.tags && tg.tags.length > 0 && (
             <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Tag size={10} /> Tags
                </div>
                <div className="flex flex-wrap gap-2">
                    {tg.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700">
                            {tag}
                        </span>
                    ))}
                </div>
             </div>
           )}
        </div>
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 rounded-b-xl flex justify-end">
           <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

const TopologyDeleteModal: React.FC<{
  tg: TopologyGroup,
  onClose: () => void,
  onConfirm: () => void
}> = ({ tg, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 border-red-500/20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-red-500">
            <div className="p-2 bg-red-500/10 rounded-full border border-red-500/20">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-lg text-white">Delete Topology?</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Are you sure you want to delete <span className="text-white font-bold">{tg.name}</span>? 
            <br/><br/>
            This will remove the topology definition. The actual resources and nodes will remaining in the global system.
          </p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm} 
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors shadow-lg shadow-red-900/20"
            >
              Delete Topology
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubGraphManagement;
