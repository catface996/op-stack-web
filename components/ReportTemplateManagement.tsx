
import React, { useState, useEffect } from 'react';
import { useReportTemplates } from '../services/hooks/useReportTemplates';
import { useReportTemplateMutations } from '../services/hooks/useReportTemplateMutations';
import type { ReportTemplateDTO, ReportTemplateCategory } from '../services/api/types';
import StyledSelect from './ui/StyledSelect';
import ConfirmDialog from './ui/ConfirmDialog';
import {
  Search,
  Plus,
  Settings,
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
  ArrowLeft,
  Sparkles,
  Zap,
  Terminal,
  Clock,
  Eye,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ReportTemplateManagementProps {
  onBack: () => void;
}

const ITEMS_PER_PAGE = 8;
const CATEGORIES: ReportTemplateCategory[] = ['Incident', 'Performance', 'Security', 'Audit'];

const ReportTemplateManagement: React.FC<ReportTemplateManagementProps> = ({ onBack }) => {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [localSearch, setLocalSearch] = useState('');
  const [localCategory, setLocalCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplateDTO | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const {
    templates,
    loading,
    error,
    page,
    totalPages,
    total,
    setPage,
    setCategoryFilter,
    setKeyword,
    refresh,
  } = useReportTemplates({ size: ITEMS_PER_PAGE });

  const { creating, updating, deleting, create, update, remove } = useReportTemplateMutations();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setKeyword]);

  const handleCategoryChange = (category: string) => {
    setLocalCategory(category);
    if (category === 'All') {
      setCategoryFilter(undefined);
    } else {
      setCategoryFilter(category as ReportTemplateCategory);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await remove(id);
    if (result.success) {
      refresh();
    } else {
      alert(result.error || 'Failed to delete template');
    }
    setDeleteConfirmId(null);
  };

  const handleSave = async (templateData: Partial<ReportTemplateDTO> & { name: string; content: string; category: ReportTemplateCategory }) => {
    if (editingTemplate) {
      // Update existing
      const result = await update({
        id: editingTemplate.id,
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        content: templateData.content,
        tags: templateData.tags,
        expectedVersion: editingTemplate.version,
      });
      if (result.success) {
        setIsModalOpen(false);
        setEditingTemplate(null);
        refresh();
      } else {
        alert(result.error || 'Failed to update template');
      }
    } else {
      // Create new
      const result = await create({
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        content: templateData.content,
        tags: templateData.tags,
      });
      if (result.success) {
        setIsModalOpen(false);
        refresh();
      } else {
        alert(result.error || 'Failed to create template');
      }
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'Incident': return { accent: 'bg-red-600', text: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-500/20' };
      case 'Performance': return { accent: 'bg-orange-600', text: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-500/20' };
      case 'Security': return { accent: 'bg-indigo-600', text: 'text-indigo-400', bg: 'bg-indigo-950/30', border: 'border-indigo-500/20' };
      default: return { accent: 'bg-blue-600', text: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/20' };
    }
  };

  const handleCopy = (content: string) => {
      navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"><ArrowLeft size={20} /></button>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Zap className="text-cyan-400" /> Intelligence Blueprints
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 font-medium">Standardized Markdown schemas for cross-agent reporting synthesis.</p>
                </div>
            </div>
            <button onClick={() => { setEditingTemplate(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-cyan-900/20 font-bold text-xs tracking-widest">
                <Plus size={14} /> New template
            </button>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 shrink-0">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input type="text" placeholder="Filter schemas..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-700/60 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200 transition-all" />
                </div>
                <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800 overflow-x-auto no-scrollbar">
                    <button onClick={() => handleCategoryChange('All')} className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all whitespace-nowrap ${localCategory === 'All' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>All</button>
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => handleCategoryChange(cat)} className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all whitespace-nowrap ${localCategory === cat ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{cat}</button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutList size={16} /></button>
                    <button onClick={() => setViewMode('card')} className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={16} /></button>
                </div>
                <div className="hidden sm:block text-[10px] font-black text-slate-500 tracking-widest">
                    Total: <span className="text-white">{total}</span> templates
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Loader2 size={48} className="animate-spin text-cyan-400 mb-4" />
                    <p className="text-sm font-medium">Loading templates...</p>
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-red-950/10 border border-dashed border-red-900/40 rounded-2xl">
                    <AlertCircle size={48} className="text-red-400 mb-4" />
                    <p className="text-sm font-bold text-red-400 mb-4">{error}</p>
                    <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all text-sm font-medium">
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            )}

            {/* Content */}
            {!loading && !error && templates.length > 0 ? (
                viewMode === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6 auto-rows-fr">
                        {templates.map(tpl => {
                            const style = getCategoryStyle(tpl.category);
                            return (
                                <div key={tpl.id} className="relative bg-slate-900 border border-slate-800/80 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all group flex flex-col min-h-[280px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-950/10">
                                    <div className={`h-1 w-full ${style.accent} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                                <div className={`p-2 rounded-lg shrink-0 ${style.bg} border ${style.border} ${style.text}`}><FileText size={20} /></div>
                                                <div className="min-w-0 overflow-hidden">
                                                    <h3 className="text-base font-bold text-white mb-0.5 truncate group-hover:text-cyan-400 transition-colors" title={tpl.name}>{tpl.name}</h3>
                                                    <p className="text-[10px] text-slate-500 font-medium line-clamp-1 opacity-80 italic">{tpl.description}</p>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest shrink-0 ${style.bg} ${style.border} ${style.text}`}>{tpl.category}</div>
                                        </div>
                                        <div className="flex-1 bg-slate-950/50 rounded-lg border border-slate-800/60 p-3 mb-4 overflow-hidden relative">
                                            <p className="text-[10px] font-mono text-slate-400 leading-relaxed line-clamp-5">{tpl.content}</p>
                                            <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-slate-950 to-transparent"></div>
                                        </div>
                                        <div className="mt-auto pt-4 border-t border-slate-800/40 flex justify-between items-center shrink-0">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleCopy(tpl.content)} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="Copy Markdown"><Copy size={15} /></button>
                                                <button onClick={() => { setEditingTemplate(tpl); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="Edit Blueprint"><Settings size={15} /></button>
                                                <button onClick={() => setDeleteConfirmId(tpl.id)} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-red-400 transition-all" title="Purge Schema"><Trash2 size={15} /></button>
                                            </div>
                                            <div className="text-[9px] font-black text-slate-600 flex items-center gap-1.5 uppercase tracking-widest"><Sparkles size={10} /> #{tpl.id}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Blueprint Schema</th>
                                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-center">Category</th>
                                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Last Modified</th>
                                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                                {templates.map(tpl => {
                                    const style = getCategoryStyle(tpl.category);
                                    return (
                                        <tr key={tpl.id} className="hover:bg-slate-800/40 transition-colors group cursor-pointer" onClick={() => { setEditingTemplate(tpl); setIsModalOpen(true); }}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg border shrink-0 ${style.bg} ${style.border} ${style.text}`}><Terminal size={16} /></div>
                                                    <div className="min-w-0 overflow-hidden">
                                                        <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate max-w-xs" title={tpl.name}>{tpl.name}</div>
                                                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">#{tpl.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border tracking-widest ${style.bg} ${style.border} ${style.text}`}>{tpl.category}</span>
                                            </td>
                                            <td className="p-4 text-center text-xs font-mono text-slate-500">{new Date(tpl.updatedAt).toLocaleDateString()}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={(e) => { e.stopPropagation(); handleCopy(tpl.content); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400"><Copy size={16} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingTemplate(tpl); setIsModalOpen(true); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400"><Settings size={16} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(tpl.id); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
            ) : null}

            {/* Empty State */}
            {!loading && !error && templates.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
                    <FileText size={48} className="opacity-10 mb-4" />
                    <p className="text-sm font-bold tracking-wide">No specialized report blueprints found in storage.</p>
                </div>
            )}
        </div>

        {/* Pagination */}
        {!loading && !error && templates.length > 0 && (
        <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"><ChevronLeft size={14} /> Prev</button>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 tracking-widest">Library segment</span>
                <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{page}</span>
                <span className="text-[10px] text-slate-500 font-bold">/</span>
                <span className="text-xs text-slate-400 font-mono font-bold">{Math.max(1, totalPages)}</span>
            </div>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages || totalPages === 0} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs">Next <ChevronRight size={14} /></button>
        </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmId !== null && (
          <ConfirmDialog
            isOpen={true}
            title="Delete Template"
            message="Are you sure you want to delete this template? This action cannot be undone."
            onConfirm={() => handleDelete(deleteConfirmId)}
            onCancel={() => setDeleteConfirmId(null)}
          />
        )}

        {isModalOpen && <TemplateFormModal template={editingTemplate} onClose={() => { setIsModalOpen(false); setEditingTemplate(null); }} onSave={handleSave} saving={creating || updating} />}
    </div>
  );
};

interface TemplateFormData {
  name: string;
  description: string;
  category: ReportTemplateCategory;
  content: string;
  tags: string[];
}

interface TemplateFormModalProps {
  template: ReportTemplateDTO | null;
  onClose: () => void;
  onSave: (data: TemplateFormData) => void;
  saving: boolean;
}

const TemplateFormModal: React.FC<TemplateFormModalProps> = ({ template, onClose, onSave, saving }) => {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: template?.name ?? '',
    description: template?.description ?? '',
    category: template?.category ?? 'Incident',
    content: template?.content ?? '',
    tags: template?.tags ?? [],
  });
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };
  const removeTag = (idx: number) => {
    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.content.trim()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border-t-4 border-t-cyan-600 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest"><Sparkles size={16} className="text-cyan-400" /> {template ? 'Modify blueprint logic' : 'Engineer new report blueprint'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors" disabled={saving}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Blueprint Title</label>
                   <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all" placeholder="Post-Incident Forensic..." />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Category Sector</label>
                   <StyledSelect
                     value={formData.category}
                     onChange={(val) => setFormData({...formData, category: val as ReportTemplateCategory})}
                     options={CATEGORIES.map(c => ({ value: c, label: c }))}
                     placeholder="Select category..."
                   />
                </div>
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Architectural Intent</label>
               <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all" placeholder="Explain the high-level objective of this blueprint..." />
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Markdown Schema (Liquid/Jinja syntax supported)</label>
               <textarea rows={12} required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-cyan-500/50 outline-none font-mono leading-relaxed resize-none h-[400px]" placeholder="# Enter report logic structure here..." />
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">System Tags</label>
               <div className="flex gap-2 mb-2">
                   <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} placeholder="Add tag..." className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none" />
                   <button type="button" onClick={handleAddTag} className="px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all tracking-widest">Add</button>
               </div>
               <div className="flex flex-wrap gap-2">
                   {formData.tags.map((tag, idx) => (
                       <span key={idx} className="flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px] font-bold border border-slate-700">{tag}<button type="button" onClick={() => removeTag(idx)} className="hover:text-white"><X size={12}/></button></span>
                   ))}
               </div>
            </div>
        </form>
        <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3">
             <button type="button" onClick={onClose} disabled={saving} className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50">Cancel</button>
             <button type="submit" onClick={handleSubmit} disabled={saving || !formData.name.trim() || !formData.content.trim()} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white text-xs font-black tracking-widest rounded-lg shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2">
               {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
               {saving ? 'Saving...' : 'Deploy blueprint'}
             </button>
        </div>
      </div>
    </div>
  );
};

export default ReportTemplateManagement;
