
import React, { useState } from 'react';
import { AgentTool } from '../types';
import { 
  ArrowLeft, 
  Wrench, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Puzzle,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ToolManagementProps {
  tools: AgentTool[];
  onAdd: (tool: AgentTool) => void;
  onUpdate: (tool: AgentTool) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const ITEMS_PER_PAGE = 8;

const ToolManagement: React.FC<ToolManagementProps> = ({ tools, onAdd, onUpdate, onDelete, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AgentTool | null>(null);

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE);
  const paginatedTools = filteredTools.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const openAddModal = () => {
    setEditingTool(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tool: AgentTool) => {
    setEditingTool(tool);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
           </button>
           <div>
             <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
               <Wrench className="text-cyan-400" /> Agent Tools
             </h2>
             <p className="text-slate-400 text-sm mt-1">Manage functions and integrations available to agents.</p>
           </div>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-cyan-900/20 font-medium text-sm"
        >
          <Plus size={16} /> Create Tool
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between mb-4 gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800 shrink-0">
         <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
               type="text"
               placeholder="Search tools..."
               value={searchTerm}
               onChange={handleSearch}
               className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-slate-200"
            />
         </div>

         <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            {/* View Mode */}
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

            <div className="text-xs text-slate-500 font-mono">
                <span className="text-white font-bold">{paginatedTools.length}</span> / {filteredTools.length} tools
            </div>
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-900/30 border border-slate-800 rounded-lg shadow-inner custom-scrollbar relative">
         {paginatedTools.length > 0 ? (
            viewMode === 'list' ? (
                // List View
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Tool Name</th>
                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Description</th>
                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Type</th>
                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Created</th>
                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900">
                        {paginatedTools.map(tool => (
                            <tr key={tool.id} className="hover:bg-slate-800/50 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Puzzle size={16} className="text-cyan-500" />
                                        <div>
                                            <div className="font-bold text-slate-200">{tool.name}</div>
                                            <div className="text-xs text-slate-500 font-mono">{tool.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-slate-300 max-w-sm truncate">{tool.description}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs font-bold uppercase text-slate-300">{tool.type}</span>
                                </td>
                                <td className="p-4 text-xs text-slate-500 font-mono">{new Date(tool.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditModal(tool)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400 transition-colors">
                                        <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => onDelete(tool.id)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors">
                                        <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                // Card View
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedTools.map(tool => (
                         <div key={tool.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-cyan-500/30 hover:bg-slate-800/80 transition-all group flex flex-col h-[200px]">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 rounded-lg bg-slate-950 text-slate-400 border border-slate-700">
                                   <Puzzle size={20} className="text-cyan-500" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => openEditModal(tool)} className="p-1.5 hover:bg-slate-700 rounded text-slate-500 hover:text-blue-400">
                                      <Edit2 size={14} />
                                   </button>
                                   <button onClick={() => onDelete(tool.id)} className="p-1.5 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400">
                                      <Trash2 size={14} />
                                   </button>
                                </div>
                            </div>
                            
                            <h3 className="text-sm font-bold text-white mb-1">{tool.name}</h3>
                            <div className="text-xs text-slate-500 font-mono mb-3">{tool.id}</div>
                            
                            <p className="text-xs text-slate-400 line-clamp-3 mb-4 flex-1">{tool.description}</p>
                            
                            <div className="mt-auto flex justify-between items-center border-t border-slate-800/50 pt-3">
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700 uppercase">
                                    {tool.type}
                                </span>
                                <span className="text-[10px] text-slate-600 font-mono">
                                    {new Date(tool.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                         </div>
                    ))}
                </div>
            )
         ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-500">
                 <Wrench size={32} className="opacity-20 mb-2" />
                 <p>No tools found.</p>
             </div>
         )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 py-2 border-t border-slate-900 shrink-0">
          <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"
          >
              <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-slate-400">
              Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{Math.max(1, totalPages)}</span>
          </span>
          <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"
          >
              <ChevronRight size={16} />
          </button>
      </div>

      {isModalOpen && (
          <ToolFormModal 
             tool={editingTool}
             onClose={() => setIsModalOpen(false)}
             onSave={(t) => {
                 if(editingTool) onUpdate(t);
                 else onAdd(t);
                 setIsModalOpen(false);
             }}
          />
      )}
    </div>
  );
};

const ToolFormModal: React.FC<{
    tool: AgentTool | null;
    onClose: () => void;
    onSave: (tool: AgentTool) => void;
  }> = ({ tool, onClose, onSave }) => {
    const [formData, setFormData] = useState<AgentTool>(tool || {
        id: `tool-${Math.random().toString(36).substr(2, 6)}`,
        name: '',
        description: '',
        type: 'Function',
        createdAt: Date.now()
    });
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50 rounded-t-xl">
            <h3 className="font-bold text-white">{tool ? 'Edit Tool' : 'Create Tool'}</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tool Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none resize-none" />
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none">
                      <option value="Function">Function</option>
                      <option value="Integration">Integration</option>
                      <option value="Retrieval">Retrieval</option>
                  </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2"><Save size={16} /> Save</button>
              </div>
          </form>
        </div>
      </div>
    );
};

export default ToolManagement;
