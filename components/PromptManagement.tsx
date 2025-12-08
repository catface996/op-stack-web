
import React, { useState, useMemo } from 'react';
import { PromptTemplate } from '../types';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  FileText, 
  LayoutList, 
  LayoutGrid, 
  Save, 
  X, 
  Tag,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft
} from 'lucide-react';

interface PromptManagementProps {
  prompts: PromptTemplate[];
  onAdd: (prompt: PromptTemplate) => void;
  onUpdate: (prompt: PromptTemplate) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const ITEMS_PER_PAGE = 8;
const CATEGORIES = ['System', 'User', 'Analysis', 'Reporting'] as const;

const PromptManagement: React.FC<PromptManagementProps> = ({ prompts, onAdd, onUpdate, onDelete, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);

  // Filter Logic
  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
        const matchesSearch = 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;

        return matchesSearch && matchesCategory;
    });
  }, [prompts, searchTerm, activeCategory]);

  const totalPages = Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE);
  const paginatedPrompts = filteredPrompts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1);
  };

  const handleCopy = (content: string) => {
      navigator.clipboard.writeText(content);
      // Optional: Toast notification could go here
  };

  const openAddModal = () => {
      setEditingPrompt(null);
      setIsModalOpen(true);
  };

  const openEditModal = (prompt: PromptTemplate) => {
      setEditingPrompt(prompt);
      setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
            <div className="flex items-center gap-4">
                <button 
                  onClick={onBack}
                  className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <FileText className="text-cyan-400" /> Prompt Templates
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Manage system instructions and reusable query templates.</p>
                </div>
            </div>
            <button 
                onClick={openAddModal}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-cyan-900/20 font-medium text-sm"
            >
                <Plus size={16} /> Create Template
            </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-4 gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800 shrink-0">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-slate-200"
                    />
                </div>

                {/* Categories */}
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700 overflow-x-auto max-w-full">
                    <button
                        onClick={() => setActiveCategory('All')}
                        className={`px-3 py-1.5 text-xs font-bold rounded transition-all whitespace-nowrap ${activeCategory === 'All' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        All
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1.5 text-xs font-bold rounded transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
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
                    <span className="text-white font-bold">{paginatedPrompts.length}</span> / {filteredPrompts.length}
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-900/30 border border-slate-800 rounded-lg shadow-inner custom-scrollbar relative">
            {paginatedPrompts.length > 0 ? (
                viewMode === 'list' ? (
                    // List View
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Template Name</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Category</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Content Preview</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Last Updated</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-900">
                            {paginatedPrompts.map(prompt => (
                                <tr key={prompt.id} className="hover:bg-slate-800/50 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-200">{prompt.name}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{prompt.description}</div>
                                        <div className="flex gap-1 mt-1">
                                            {prompt.tags.slice(0,3).map(tag => (
                                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-400">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border bg-slate-950 border-slate-700 text-slate-300`}>
                                            {prompt.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs font-mono text-slate-400 bg-slate-950/50 p-2 rounded border border-slate-800 max-w-md truncate">
                                            {prompt.content}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-slate-500 font-mono">
                                        {new Date(prompt.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleCopy(prompt.content)}
                                                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-green-400 transition-colors"
                                                title="Copy Content"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button 
                                                onClick={() => openEditModal(prompt)}
                                                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => onDelete(prompt.id)}
                                                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors"
                                                title="Delete"
                                            >
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
                        {paginatedPrompts.map(prompt => (
                            <div key={prompt.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-cyan-500/30 hover:bg-slate-800/80 transition-all group flex flex-col h-[280px]">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border bg-slate-950 border-slate-700 text-slate-300`}>
                                        {prompt.category}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleCopy(prompt.content)}
                                            className="p-1.5 hover:bg-slate-700 rounded text-slate-500 hover:text-green-400"
                                            title="Copy"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <button 
                                            onClick={() => openEditModal(prompt)}
                                            className="p-1.5 hover:bg-slate-700 rounded text-slate-500 hover:text-blue-400"
                                            title="Edit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(prompt.id)}
                                            className="p-1.5 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                
                                <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{prompt.name}</h3>
                                <p className="text-xs text-slate-500 mb-3 line-clamp-2 h-8">{prompt.description}</p>
                                
                                <div className="flex-1 bg-slate-950 rounded border border-slate-800 p-2 mb-3 overflow-hidden relative">
                                    <p className="text-[10px] font-mono text-slate-400 leading-relaxed whitespace-pre-wrap">
                                        {prompt.content}
                                    </p>
                                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-950 to-transparent"></div>
                                </div>

                                <div className="flex flex-wrap gap-1 mt-auto">
                                    {prompt.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-500">
                                            {tag}
                                        </span>
                                    ))}
                                    {prompt.tags.length > 3 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-500">+{prompt.tags.length - 3}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <FileText size={32} className="opacity-20 mb-2" />
                    <p>No prompt templates found.</p>
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

        {/* Modal */}
        {isModalOpen && (
            <PromptFormModal 
                prompt={editingPrompt}
                onClose={() => setIsModalOpen(false)}
                onSave={(p) => {
                    if (editingPrompt) onUpdate(p);
                    else onAdd(p);
                    setIsModalOpen(false);
                }}
            />
        )}
    </div>
  );
};

const PromptFormModal: React.FC<{
  prompt: PromptTemplate | null;
  onClose: () => void;
  onSave: (prompt: PromptTemplate) => void;
}> = ({ prompt, onClose, onSave }) => {
  const [formData, setFormData] = useState<PromptTemplate>(prompt || {
      id: `pt-${Math.random().toString(36).substr(2, 6)}`,
      name: '',
      description: '',
      content: '',
      category: 'System',
      tags: [],
      updatedAt: Date.now()
  });
  
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
      if (tagInput.trim()) {
          setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
          setTagInput('');
      }
  };

  const removeTag = (idx: number) => {
      setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50 rounded-t-xl">
          <h3 className="font-bold text-white">{prompt ? 'Edit Template' : 'Create Template'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Template Name</label>
                   <input 
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
                   <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as any})}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                   >
                       {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
               <input 
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
               />
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                  Content
               </label>
               <textarea 
                  rows={8}
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none font-mono leading-relaxed"
                  placeholder="Enter prompt content here..."
               />
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tags</label>
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
                   {formData.tags.map((tag, idx) => (
                       <span key={idx} className="flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-700">
                           {tag}
                           <button type="button" onClick={() => removeTag(idx)} className="hover:text-white"><X size={12}/></button>
                       </span>
                   ))}
               </div>
            </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50 rounded-b-xl flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
             <button 
                onClick={() => onSave({ ...formData, updatedAt: Date.now() })}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2"
             >
                <Save size={16} /> Save Template
             </button>
        </div>
      </div>
    </div>
  );
};

export default PromptManagement;
