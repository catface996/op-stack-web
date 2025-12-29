/**
 * UsageManagement Component
 *
 * Manage template usage categories (create, delete)
 * Feature: 007-prompt-template-api
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Tag,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  Save,
  Bot,
  MessageSquare,
  BarChart3,
  ClipboardList,
  Wand2,
  Brain,
  Code,
  Shield,
  Zap,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { useTemplateUsages } from '../../services/hooks/useTemplateUsages';

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

interface UsageManagementProps {
  onBack: () => void;
}

const PAGE_SIZE = 12;

const UsageManagement: React.FC<UsageManagementProps> = ({ onBack }) => {
  const { usages, loading, error, refresh, createUsage, deleteUsage, mutationLoading, mutationError } = useTemplateUsages();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter usages by search query
  const filteredUsages = useMemo(() => {
    if (!searchQuery.trim()) return usages;
    const query = searchQuery.toLowerCase();
    return usages.filter(
      (usage) =>
        usage.name.toLowerCase().includes(query) ||
        usage.code.toLowerCase().includes(query) ||
        (usage.description && usage.description.toLowerCase().includes(query))
    );
  }, [usages, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsages.length / PAGE_SIZE));
  const paginatedUsages = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsages.slice(start, start + PAGE_SIZE);
  }, [filteredUsages, currentPage]);

  // Reset to page 1 when filtered results change
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleDelete = async (id: number) => {
    try {
      await deleteUsage(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleCreate = async (data: { code: string; name: string; description?: string }) => {
    try {
      await createUsage(data);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Create failed:', err);
    }
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
              <Tag className="text-purple-400" /> Usage Management
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">Manage template usage categories for organization.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search usages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={mutationLoading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-purple-900/20 font-bold text-xs tracking-widest disabled:opacity-50"
          >
            <Plus size={14} /> New Usage
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Loader2 size={48} className="animate-spin text-purple-500 mb-4" />
            <p className="text-sm font-bold tracking-wide">Loading usages...</p>
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
        {!loading && !error && usages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <Tag size={48} className="opacity-10 mb-4" />
            <p className="text-sm font-bold tracking-wide">No usages defined yet.</p>
            <p className="text-xs text-slate-600 mt-2">Create a new usage to categorize templates.</p>
          </div>
        )}

        {/* No Search Results */}
        {!loading && !error && usages.length > 0 && filteredUsages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <Search size={48} className="opacity-10 mb-4" />
            <p className="text-sm font-bold tracking-wide">No matching usages found.</p>
            <p className="text-xs text-slate-600 mt-2">Try a different search term.</p>
          </div>
        )}

        {/* Usage Card Grid */}
        {!loading && !error && filteredUsages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6 auto-rows-fr">
            {paginatedUsages.map((usage) => {
              const UsageIcon = getUsageIcon(usage.code);
              return (
                <div
                  key={usage.id}
                  className="relative bg-slate-900 border border-slate-800/80 rounded-xl hover:border-purple-500/40 hover:bg-slate-800/40 transition-all group flex flex-col min-h-[180px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-950/10"
                >
                  {/* Decorative Top Line */}
                  <div className="h-1 w-full bg-purple-600 opacity-30 group-hover:opacity-100 transition-opacity"></div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        <div className="p-2 rounded-lg shrink-0 bg-purple-950/30 border border-purple-500/20 text-purple-400">
                          <UsageIcon size={20} />
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <h3 className="text-base font-bold text-white mb-0.5 truncate group-hover:text-purple-400 transition-colors leading-tight" title={usage.name}>{usage.name}</h3>
                          <code className="text-[9px] font-mono text-purple-400 bg-purple-950/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {usage.code}
                          </code>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteConfirmId(usage.id)}
                        disabled={mutationLoading}
                        className="p-1.5 rounded-lg shrink-0 hover:bg-slate-700/50 text-slate-500 hover:text-red-400 transition-all disabled:opacity-50"
                        title="Delete usage"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex-1">
                      {usage.description ? (
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{usage.description}</p>
                      ) : (
                        <p className="text-xs text-slate-600 italic">No description</p>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-800/40 flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      <span>ID #{usage.id}</span>
                      <Tag size={10} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Pagination - Outside scrollable area */}
      {!loading && !error && usages.length > 0 && (
        <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest">Page</span>
            <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{currentPage}</span>
            <span className="text-[10px] text-slate-500 font-bold">/</span>
            <span className="text-xs text-slate-400 font-mono font-bold">{totalPages}</span>
            <span className="text-[10px] text-slate-600 ml-2">({filteredUsages.length} total{searchQuery && ', filtered'})</span>
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateUsageModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreate}
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
          error={mutationError}
        />
      )}
    </div>
  );
};

// Create Usage Modal
interface CreateUsageModalProps {
  onClose: () => void;
  onSave: (data: { code: string; name: string; description?: string }) => void;
  loading: boolean;
  error: string | null;
}

const CreateUsageModal: React.FC<CreateUsageModalProps> = ({ onClose, onSave, loading, error }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });
  const [codeError, setCodeError] = useState<string | null>(null);

  const validateCode = (code: string) => {
    // Code should be uppercase with underscores only
    const codeRegex = /^[A-Z][A-Z0-9_]*$/;
    if (!code) {
      setCodeError('Code is required');
      return false;
    }
    if (!codeRegex.test(code)) {
      setCodeError('Code must be uppercase letters, numbers, and underscores (e.g., SYSTEM_PROMPT)');
      return false;
    }
    setCodeError(null);
    return true;
  };

  const handleCodeChange = (value: string) => {
    // Auto-uppercase the input
    const uppercased = value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setFormData({ ...formData, code: uppercased });
    if (uppercased) validateCode(uppercased);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCode(formData.code)) return;
    onSave({
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-t-purple-600">
        <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
            <Tag size={16} className="text-purple-400" />
            Create New Usage
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Display */}
          {(error || codeError) && (
            <div className="bg-red-950/30 border border-red-800 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {codeError || error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:border-purple-500/50 outline-none transition-all font-mono ${codeError ? 'border-red-500' : 'border-slate-700'}`}
              placeholder="e.g., SYSTEM_PROMPT"
            />
            <p className="text-[10px] text-slate-600 mt-1">Uppercase letters, numbers, and underscores only</p>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-purple-500/50 outline-none transition-all"
              placeholder="e.g., System Prompt"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-purple-500/50 outline-none transition-all resize-none"
              placeholder="Optional description..."
            />
          </div>
        </form>

        <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !!codeError}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black tracking-widest rounded-lg shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Create Usage
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
  error: string | null;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ onConfirm, onCancel, loading, error }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-red-950/50 border border-red-800">
            <Trash2 size={24} className="text-red-400" />
          </div>
          <h3 className="font-bold text-white text-lg">Delete Usage?</h3>
        </div>
        {error && (
          <div className="bg-red-950/30 border border-red-800 rounded-lg p-3 text-red-400 text-sm mb-4 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        <p className="text-slate-400 text-sm mb-6">
          This will permanently delete this usage category. Templates using this usage will need to be reassigned.
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

export default UsageManagement;
