/**
 * Prompt Management Component
 *
 * Manages prompt templates with list view, search, filtering, CRUD operations
 * Feature: 007-prompt-template-api
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StyledSelect from './ui/StyledSelect';
import { usePromptTemplates, PromptTemplateFilters } from '../services/hooks/usePromptTemplates';
import { useTemplateUsages } from '../services/hooks/useTemplateUsages';
import { usePromptTemplateMutations } from '../services/hooks/usePromptTemplateMutations';
import type { PromptTemplateDTO, CreatePromptTemplateRequest, UpdatePromptTemplateRequest } from '../services/api/types';
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
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Terminal,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  GitBranch,
  Tag,
  Bot,
  MessageSquare,
  BarChart3,
  ClipboardList,
  Wand2,
  Brain,
  Code,
  Shield,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// Icon mapping for different usage types
const USAGE_ICON_MAP: Record<string, LucideIcon> = {
  // 实际业务类型
  FAULT_DIAGNOSIS: Zap,        // 故障诊断
  KNOWLEDGE_QA: Brain,         // 知识问答
  DATA_ANALYSIS: BarChart3,    // 数据分析
  REPORT_GENERATION: ClipboardList, // 报告生成
  CODE_REVIEW: Code,           // 代码审查
  OPS_SUGGESTION: Wand2,       // 运维建议
  DAILY_INSPECTION: ClipboardList, // 日常巡检
  OPERATION_SUGGESTION: Wand2, // 运维建议 (备选code)
  ROUTINE_CHECK: ClipboardList, // 日常巡检 (备选code)
  // 通用类型
  SYSTEM_PROMPT: Bot,
  USER_PROMPT: MessageSquare,
  ANALYSIS: BarChart3,
  REPORTING: ClipboardList,
  GENERATION: Wand2,
  REASONING: Brain,
  CODE: Code,
  SECURITY: Shield,
  AUTOMATION: Zap,
};

const getUsageIcon = (usageCode: string | null | undefined): LucideIcon => {
  if (!usageCode) return Terminal;
  return USAGE_ICON_MAP[usageCode.toUpperCase()] || Terminal;
};

interface PromptManagementProps {
  onBack: () => void;
}

const MAX_CONTENT_SIZE = 64 * 1024; // 64KB

const PromptManagement: React.FC<PromptManagementProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [activeUsageId, setActiveUsageId] = useState<number | undefined>(undefined);

  // Filters for the hook
  const filters: PromptTemplateFilters = {
    usageId: activeUsageId,
    keyword: searchTerm || undefined,
  };

  // Hooks for data fetching
  const { templates, pagination, loading, error, refresh, setPage } = usePromptTemplates(filters);
  const { usages, loading: usagesLoading } = useTemplateUsages();
  const { createTemplate, updateTemplate, deleteTemplate, loading: mutationLoading, error: mutationError } = usePromptTemplateMutations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplateDTO | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Helper to get usage code from usageId
  const getUsageCode = (usageId: number | null): string | null => {
    if (!usageId) return null;
    const usage = usages.find(u => u.id === usageId);
    return usage?.code || null;
  };

  const getUsageStyle = (usageName: string | null) => {
    if (!usageName) return { accent: 'bg-slate-600', text: 'text-slate-400', bg: 'bg-slate-950/30', border: 'border-slate-500/20' };
    const hash = usageName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const styles = [
      { accent: 'bg-indigo-600', text: 'text-indigo-400', bg: 'bg-indigo-950/30', border: 'border-indigo-500/20' },
      { accent: 'bg-purple-600', text: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-500/20' },
      { accent: 'bg-pink-600', text: 'text-pink-400', bg: 'bg-pink-950/30', border: 'border-pink-500/20' },
      { accent: 'bg-cyan-600', text: 'text-cyan-400', bg: 'bg-cyan-950/30', border: 'border-cyan-500/20' },
      { accent: 'bg-emerald-600', text: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-500/20' },
      { accent: 'bg-amber-600', text: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-500/20' },
    ];
    return styles[hash % styles.length];
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const openEditModal = (template: PromptTemplateDTO) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: { name: string; content: string; description: string; usageId?: number; changeNote?: string }) => {
    try {
      if (editingTemplate) {
        // Update existing template
        await updateTemplate({
          id: editingTemplate.id,
          content: data.content,
          changeNote: data.changeNote,
          expectedVersion: editingTemplate.version,
        }, refresh);
      } else {
        // Create new template
        await createTemplate({
          name: data.name,
          content: data.content,
          description: data.description,
          usageId: data.usageId,
        });
      }
      setIsModalOpen(false);
      refresh();
    } catch (err) {
      // Error is handled in the hook, but we keep the modal open
      console.error('Save failed:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTemplate(id);
      setDeleteConfirmId(null);
      refresh();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleViewDetail = (id: number) => {
    navigate(`/prompts/${id}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <FileText className="text-cyan-400" /> Prompt Registry
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">Standardized instruction templates for hierarchical agent coordination.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/prompts/usages')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-all border border-slate-700 font-bold text-xs tracking-widest"
          >
            <Tag size={14} /> Manage Usages
          </button>
          <button
            onClick={openCreateModal}
            disabled={mutationLoading}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-cyan-900/20 font-bold text-xs tracking-widest disabled:opacity-50"
          >
            <Plus size={14} /> New template
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 shrink-0">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Filter by name, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/60 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200 transition-all"
            />
          </div>
          <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveUsageId(undefined)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all whitespace-nowrap ${activeUsageId === undefined ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              All
            </button>
            {usagesLoading ? (
              <span className="px-3 py-1.5 text-[10px] text-slate-500">Loading...</span>
            ) : (
              usages.map(usage => (
                <button
                  key={usage.id}
                  onClick={() => setActiveUsageId(usage.id)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all whitespace-nowrap ${activeUsageId === usage.id ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {usage.name}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
              <LayoutList size={16} />
            </button>
            <button onClick={() => setViewMode('card')} className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Loader2 size={48} className="animate-spin text-cyan-500 mb-4" />
            <p className="text-sm font-bold tracking-wide">Loading prompt templates...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-red-950/20 border border-dashed border-red-800 rounded-2xl">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <p className="text-sm font-bold tracking-wide text-red-400 mb-4">{error}</p>
            <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && templates.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <FileText size={48} className="opacity-10 mb-4" />
            <p className="text-sm font-bold tracking-wide">No prompt templates found.</p>
            <p className="text-xs text-slate-600 mt-2">Create a new template to get started.</p>
          </div>
        )}

        {/* Card View */}
        {!loading && !error && templates.length > 0 && viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6 auto-rows-fr">
            {templates.map(template => {
              const style = getUsageStyle(template.usageName);
              const UsageIcon = getUsageIcon(getUsageCode(template.usageId));
              return (
                <div
                  key={template.id}
                  className="relative bg-slate-900 border border-slate-800/80 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all group flex flex-col min-h-[280px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-950/10 cursor-pointer"
                  onClick={() => handleViewDetail(template.id)}
                >
                  <div className={`h-1 w-full ${style.accent} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${style.bg} ${style.border} ${style.text}`}>
                          <UsageIcon size={20} />
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <h3 className="text-base font-bold text-white mb-0.5 truncate group-hover:text-cyan-400 transition-colors" title={template.name}>{template.name}</h3>
                          <p className="text-[10px] text-slate-500 font-medium line-clamp-1 opacity-80 italic">{template.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest ${style.bg} ${style.border} ${style.text}`}>
                          {template.usageName || 'Uncategorized'}
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-400">
                          <GitBranch size={10} /> v{template.currentVersion}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-950/50 rounded-lg border border-slate-800/60 p-3 mb-4 overflow-hidden relative">
                      <p className="text-[10px] font-mono text-slate-400 leading-relaxed line-clamp-4">{template.content}</p>
                      <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-slate-950 to-transparent"></div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-800/40 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleCopy(template.content); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="Copy Content">
                          <Copy size={15} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(template); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="Configure Template">
                          <Settings size={15} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(template.id); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-red-400 transition-all" title="Delete Template">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="text-[9px] font-black text-slate-600 flex items-center gap-1.5">
                        <Clock size={10} /> {new Date(template.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {!loading && !error && templates.length > 0 && viewMode === 'list' && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Template Label</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Usage</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Version</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Content Preview</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {templates.map(template => {
                  const style = getUsageStyle(template.usageName);
                  const UsageIcon = getUsageIcon(getUsageCode(template.usageId));
                  return (
                    <tr
                      key={template.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => handleViewDetail(template.id)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg border shrink-0 ${style.bg} ${style.border} ${style.text}`}>
                            <UsageIcon size={16} />
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate max-w-xs" title={template.name}>{template.name}</div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ID: {template.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border tracking-widest ${style.bg} ${style.border} ${style.text}`}>
                          {template.usageName || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400 w-fit">
                          <GitBranch size={12} /> v{template.currentVersion}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-500 opacity-60 truncate max-w-xs">
                        {template.content.substring(0, 50)}...
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={(e) => { e.stopPropagation(); handleCopy(template.content); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400">
                            <Copy size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(template); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400">
                            <Settings size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(template.id); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400">
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
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && templates.length > 0 && (
        <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest">Page</span>
            <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{pagination.page}</span>
            <span className="text-[10px] text-slate-500 font-bold">/</span>
            <span className="text-xs text-slate-400 font-mono font-bold">{Math.max(1, pagination.totalPages)}</span>
            <span className="text-[10px] text-slate-600 ml-2">({pagination.totalElements} total)</span>
          </div>
          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <PromptFormModal
          template={editingTemplate}
          usages={usages}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          loading={mutationLoading}
          error={mutationError}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
          loading={mutationLoading}
        />
      )}
    </div>
  );
};

// Form Modal Component
interface PromptFormModalProps {
  template: PromptTemplateDTO | null;
  usages: { id: number; name: string; code: string }[];
  onClose: () => void;
  onSave: (data: { name: string; content: string; description: string; usageId?: number; changeNote?: string }) => void;
  loading: boolean;
  error: string | null;
}

const PromptFormModal: React.FC<PromptFormModalProps> = ({ template, usages, onClose, onSave, loading, error }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    content: template?.content || '',
    description: template?.description || '',
    usageId: template?.usageId || undefined,
    changeNote: '',
  });
  const [contentSizeError, setContentSizeError] = useState<string | null>(null);

  const validateContentSize = (content: string) => {
    const size = new Blob([content]).size;
    if (size > MAX_CONTENT_SIZE) {
      setContentSizeError(`Content exceeds maximum size of 64KB (current: ${(size / 1024).toFixed(1)}KB)`);
      return false;
    }
    setContentSizeError(null);
    return true;
  };

  const handleContentChange = (content: string) => {
    setFormData({ ...formData, content });
    validateContentSize(content);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContentSize(formData.content)) return;
    onSave({
      name: formData.name,
      content: formData.content,
      description: formData.description,
      usageId: formData.usageId,
      changeNote: formData.changeNote || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-t-4 border-t-cyan-600 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
            <Sparkles size={16} className="text-cyan-400" />
            {template ? 'Edit Template' : 'Create New Template'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Error Display */}
          {(error || contentSizeError) && (
            <div className="bg-red-950/30 border border-red-800 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {contentSizeError || error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Template Title</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                disabled={!!template} // Name can't be changed on edit
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all disabled:opacity-50"
                placeholder="Template name..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Usage Type</label>
              <StyledSelect
                value={formData.usageId?.toString() || ''}
                onChange={(val) => setFormData({...formData, usageId: val ? parseInt(val) : undefined})}
                options={[
                  { value: '', label: 'No usage type' },
                  ...usages.map(u => ({ value: u.id.toString(), label: u.name }))
                ]}
                placeholder="Select usage type..."
                disabled={!!template} // Usage can't be changed on edit
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              disabled={!!template} // Description can't be changed on edit
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all disabled:opacity-50"
              placeholder="High-level description of this prompt..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Content {contentSizeError && <span className="text-red-400">*</span>}
            </label>
            <textarea
              rows={8}
              required
              value={formData.content}
              onChange={e => handleContentChange(e.target.value)}
              className={`w-full bg-slate-950 border rounded-lg p-3 text-sm text-slate-200 focus:border-cyan-500/50 outline-none font-mono leading-relaxed resize-none ${contentSizeError ? 'border-red-500' : 'border-slate-700'}`}
              placeholder="Enter prompt template content here..."
            />
          </div>

          {/* Change Note (only for edit mode) */}
          {template && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Change Note (Optional)</label>
              <input
                type="text"
                value={formData.changeNote}
                onChange={e => setFormData({...formData, changeNote: e.target.value})}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                placeholder="Describe what changed in this version..."
              />
            </div>
          )}
        </form>

        <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !!contentSizeError}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black tracking-widest rounded-lg shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {template ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ onConfirm, onCancel, loading }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-red-950/50 border border-red-800">
            <Trash2 size={24} className="text-red-400" />
          </div>
          <h3 className="font-bold text-white text-lg">Delete Template?</h3>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          This action cannot be undone. The template will be permanently removed from the system.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptManagement;
