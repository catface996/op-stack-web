/**
 * Category Management Component
 *
 * CRUD interface for managing tool categories (flat structure)
 * Feature: 010-tool-category-management
 */

import React, { useState, useEffect } from 'react';
import { ToolCategoryDTO } from '../../types';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useCategories } from '../../services/hooks/useCategories';
import { useDebounce } from '../../services/hooks/useDebounce';
import { createCategory, updateCategory, deleteCategory } from '../../services/api/categories';
import { getCategoryIcon } from './categoryIcons';
import {
  FolderOpen,
  Plus,
  Trash2,
  Settings,
  Save,
  X,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Search,
} from 'lucide-react';

interface CategoryManagementProps {
  onBack?: () => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ onBack }) => {
  const {
    categories,
    loading,
    error,
    page,
    totalPages,
    total,
    setPage,
    setKeyword,
    refresh,
  } = useCategories({ size: 10 });

  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ToolCategoryDTO | null>(null);
  const [localSearch, setLocalSearch] = useState('');

  // Debounce search input
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setKeyword(debouncedSearch);
  }, [debouncedSearch, setKeyword]);

  // Delete confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    category: ToolCategoryDTO | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    category: null,
    isLoading: false,
  });

  const openModal = (category?: ToolCategoryDTO) => {
    setEditingCategory(category || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteClick = (category: ToolCategoryDTO) => {
    setDeleteConfirm({ isOpen: true, category, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.category) return;

    setDeleteConfirm(prev => ({ ...prev, isLoading: true }));

    try {
      await deleteCategory({ category_id: deleteConfirm.category.id });
      setDeleteConfirm({ isOpen: false, category: null, isLoading: false });
      refresh();
    } catch (err) {
      // Check if error is about category having tools
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      if (errorMessage.includes('tools')) {
        alert('Cannot delete: This category still has tools. Please remove or reassign tools first.');
      } else {
        alert(errorMessage);
      }
      setDeleteConfirm(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, category: null, isLoading: false });
  };

  const handleSave = async (data: { name: string; description?: string }) => {
    try {
      if (editingCategory) {
        await updateCategory({ category_id: editingCategory.id, ...data });
      } else {
        await createCategory(data);
      }
      closeModal();
      refresh();
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  /**
   * Get category style based on category name
   */
  const getCategoryStyle = (categoryName: string) => {
    const name = categoryName?.toLowerCase() || '';
    const icon = getCategoryIcon(categoryName);
    
    // Database types
    if (name.includes('database') || name.includes('db') || name.includes('数据库') ||
        name.includes('mysql') || name.includes('postgres') || name.includes('mongodb')) {
      return { color: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-500/20', accent: 'bg-purple-600', gradient: 'from-purple-500/40 via-purple-600/20 to-transparent', icon };
    }
    // Cache types
    if (name.includes('cache') || name.includes('redis') || name.includes('缓存')) {
      return { color: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-500/20', accent: 'bg-orange-600', gradient: 'from-orange-500/40 via-orange-600/20 to-transparent', icon };
    }
    // Message Queue types
    if (name.includes('mq') || name.includes('queue') || name.includes('kafka') || name.includes('消息')) {
      return { color: 'text-yellow-400', bg: 'bg-yellow-950/30', border: 'border-yellow-500/20', accent: 'bg-yellow-600', gradient: 'from-yellow-500/40 via-yellow-600/20 to-transparent', icon };
    }
    // Network types
    if (name.includes('network') || name.includes('网络')) {
      return { color: 'text-teal-400', bg: 'bg-teal-950/30', border: 'border-teal-500/20', accent: 'bg-teal-600', gradient: 'from-teal-500/40 via-teal-600/20 to-transparent', icon };
    }
    // Security types
    if (name.includes('security') || name.includes('安全')) {
      return { color: 'text-pink-400', bg: 'bg-pink-950/30', border: 'border-pink-500/20', accent: 'bg-pink-600', gradient: 'from-pink-500/40 via-pink-600/20 to-transparent', icon };
    }
    // Monitoring types
    if (name.includes('monitor') || name.includes('metric') || name.includes('监控') || name.includes('指标')) {
      return { color: 'text-green-400', bg: 'bg-green-950/30', border: 'border-green-500/20', accent: 'bg-green-600', gradient: 'from-green-500/40 via-green-600/20 to-transparent', icon };
    }
    // Cloud types
    if (name.includes('cloud') || name.includes('aws') || name.includes('云')) {
      return { color: 'text-sky-400', bg: 'bg-sky-950/30', border: 'border-sky-500/20', accent: 'bg-sky-600', gradient: 'from-sky-500/40 via-sky-600/20 to-transparent', icon };
    }
    // Container types
    if (name.includes('container') || name.includes('docker') || name.includes('k8s') || name.includes('容器')) {
      return { color: 'text-cyan-400', bg: 'bg-cyan-950/30', border: 'border-cyan-500/20', accent: 'bg-cyan-600', gradient: 'from-cyan-500/40 via-cyan-600/20 to-transparent', icon };
    }
    // Code/Dev types
    if (name.includes('code') || name.includes('dev') || name.includes('代码') || name.includes('开发')) {
      return { color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/20', accent: 'bg-blue-600', gradient: 'from-blue-500/40 via-blue-600/20 to-transparent', icon };
    }
    // AI/Automation types
    if (name.includes('ai') || name.includes('llm') || name.includes('automation') || name.includes('智能') || name.includes('自动化')) {
      return { color: 'text-indigo-400', bg: 'bg-indigo-950/30', border: 'border-indigo-500/20', accent: 'bg-indigo-600', gradient: 'from-indigo-500/40 via-indigo-600/20 to-transparent', icon };
    }
    // Debug/Diagnostic types
    if (name.includes('debug') || name.includes('diagnostic') || name.includes('调试') || name.includes('诊断')) {
      return { color: 'text-rose-400', bg: 'bg-rose-950/30', border: 'border-rose-500/20', accent: 'bg-rose-600', gradient: 'from-rose-500/40 via-rose-600/20 to-transparent', icon };
    }
    // Default
    return { color: 'text-cyan-400', bg: 'bg-cyan-950/30', border: 'border-cyan-500/20', accent: 'bg-cyan-600', gradient: 'from-cyan-500/40 via-cyan-600/20 to-transparent', icon };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 bg-red-950/30 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 shrink-0">
        {/* Left: Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search categories..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/60 rounded-lg py-2 pl-9 pr-10 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200 transition-all"
              disabled={loading}
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Right: View Toggle + Create Button */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              disabled={loading}
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              disabled={loading}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* Create Category Button */}
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
            disabled={loading}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Loader2 size={48} className="animate-spin mb-4 text-cyan-400" />
            <p className="text-sm font-bold tracking-wide">Loading categories...</p>
          </div>
        ) : categories.length > 0 ? (
          viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6 auto-rows-fr">
              {categories.map(category => {
                const style = getCategoryStyle(category.name);
                const Icon = style.icon;
                return (
                <div key={category.id} className="relative bg-slate-900 border border-slate-800/80 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all group flex flex-col min-h-[160px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-950/10">
                  <div className={`h-1 w-full ${style.accent} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {/* Tech-style Icon Container */}
                      <div className="relative">
                        <div className={`absolute inset-0 rounded-xl ${style.accent} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`}></div>
                        <div className={`relative p-0.5 rounded-xl bg-gradient-to-br ${style.gradient} group-hover:shadow-lg group-hover:shadow-current/20 transition-all duration-300`}>
                          <div className={`p-2.5 rounded-[10px] bg-slate-950/90 backdrop-blur-sm ${style.color}`}>
                            <Icon size={20} className="drop-shadow-sm" />
                          </div>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">{category.name}</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3 flex-1">
                      {category.description || 'No description'}
                    </p>
                    <div className="mt-auto pt-3 border-t border-slate-800/40 flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openModal(category)}
                          className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all"
                          title="Edit"
                        >
                          <Settings size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <span className="text-[9px] text-slate-600">{formatDate(category.updated_at)}</span>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          ) : (
            /* List View */
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Category Name</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Description</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Updated</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {categories.map(category => (
                    <tr key={category.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400">
                            <FolderOpen size={14} />
                          </div>
                          <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{category.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-slate-400 max-w-sm truncate">{category.description || 'No description'}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-500">{formatDate(category.updated_at)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => openModal(category)}
                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400"
                            title="Edit"
                          >
                            <Settings size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(category)}
                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400"
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
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <FolderOpen size={48} className="opacity-10 mb-4" />
            <p className="text-sm font-bold tracking-wide mb-3">No categories</p>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all text-xs font-bold"
            >
              <Plus size={14} /> Create first category
            </button>
          </div>
        )}
      </div>

      {/* Pagination - always show for consistent UI */}
      {categories.length > 0 && (
        <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0 mt-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest">Page</span>
            <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{page}</span>
            <span className="text-[10px] text-slate-500 font-bold">/</span>
            <span className="text-xs text-slate-400 font-mono font-bold">{totalPages || 1}</span>
            <span className="text-[10px] text-slate-600 ml-2">{total} items</span>
          </div>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages || loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Category Form Modal */}
      {isModalOpen && (
        <CategoryFormModal
          category={editingCategory}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deleteConfirm.category?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteConfirm.isLoading}
      />
    </div>
  );
};

/**
 * Category Form Modal Component
 */
interface CategoryFormModalProps {
  category: ToolCategoryDTO | null;
  onClose: () => void;
  onSave: (data: { name: string; description?: string }) => Promise<void>;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Category name cannot exceed 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description cannot exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      // Check for duplicate name error
      if (errorMessage.includes('duplicate') || errorMessage.includes('exist') || errorMessage.includes('已存在')) {
        setErrors({ name: 'Category name already exists' });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-t-cyan-600">
        <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
            <FolderOpen size={16} className="text-cyan-400" />
            {category ? 'Edit Category' : 'New Category'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors" disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:outline-none transition-all ${
                  errors.name ? 'border-red-500/50' : 'border-slate-700 focus:border-cyan-500/50'
                }`}
                placeholder="Enter category name"
                disabled={isSubmitting}
                autoFocus
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:outline-none resize-none transition-all ${
                  errors.description ? 'border-red-500/50' : 'border-slate-700 focus:border-cyan-500/50'
                }`}
                placeholder="Describe what types of tools this category contains..."
                disabled={isSubmitting}
              />
              {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
                <AlertCircle size={16} />
                <span className="text-sm">{errors.general}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 bg-slate-950/30 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black tracking-widest rounded-lg shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryManagement;
