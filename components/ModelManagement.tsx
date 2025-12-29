/**
 * ModelManagement Component
 *
 * AI Model configuration management with API integration
 * Feature: 008-model-api-integration
 */

import React, { useState } from 'react';
import { useModels } from '../services/hooks/useModels';
import { useModelMutations } from '../services/hooks/useModelMutations';
import type { ModelDTO, ModelCreateRequest, ModelUpdateRequest } from '../services/api/types';
import {
  ArrowLeft,
  Cpu,
  Plus,
  Trash2,
  Settings,
  Save,
  X,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Brain,
  Maximize2,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  Filter,
  Thermometer,
  Globe,
  Hash,
} from 'lucide-react';

interface ModelManagementProps {
  onBack: () => void;
}

const ITEMS_PER_PAGE = 8;

const ModelManagement: React.FC<ModelManagementProps> = ({ onBack }) => {
  // API hooks
  const {
    models,
    loading,
    error,
    page,
    totalPages,
    setPage,
    isActiveFilter,
    setIsActiveFilter,
    refresh,
  } = useModels({ size: ITEMS_PER_PAGE });

  const {
    createModel,
    updateModel,
    deleteModel,
    loading: mutationLoading,
    error: mutationError,
    clearError,
  } = useModelMutations();

  // Local UI state
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelDTO | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Helper to get status style
  const getModelStatusStyle = (isActive: boolean) => {
    return isActive
      ? { color: 'text-green-400', accent: 'bg-green-600', bg: 'bg-green-950/30', border: 'border-green-500/20' }
      : { color: 'text-slate-500', accent: 'bg-slate-600', bg: 'bg-slate-900', border: 'border-slate-800' };
  };

  // Open edit modal
  const openEditModal = (model: ModelDTO) => {
    setEditingModel(model);
    setIsModalOpen(true);
    clearError();
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingModel(null);
    setIsModalOpen(true);
    clearError();
  };

  // Handle create/update from modal
  const handleSave = async (formData: ModelFormData) => {
    if (editingModel) {
      // Update existing model
      const request: ModelUpdateRequest = {
        id: editingModel.id,
        name: formData.name,
        model_id: formData.model_id,
        description: formData.description || undefined,
        is_active: formData.is_active,
        max_tokens: formData.max_tokens || undefined,
        temperature: formData.temperature ?? undefined,
        top_p: formData.top_p ?? undefined,
        region: formData.region || undefined,
      };
      const result = await updateModel(request, refresh);
      if (result) {
        setIsModalOpen(false);
      }
    } else {
      // Create new model
      const request: ModelCreateRequest = {
        name: formData.name,
        model_id: formData.model_id,
        description: formData.description || undefined,
        is_active: formData.is_active,
        max_tokens: formData.max_tokens || undefined,
        temperature: formData.temperature ?? undefined,
        top_p: formData.top_p ?? undefined,
        region: formData.region || undefined,
      };
      const result = await createModel(request, refresh);
      if (result) {
        setIsModalOpen(false);
      }
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    const success = await deleteModel({ id }, () => {
      // Handle empty page after delete
      if (models.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refresh();
      }
    });
    if (success) {
      setDeleteConfirmId(null);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (model: ModelDTO) => {
    setTogglingId(model.id);
    await updateModel({
      id: model.id,
      is_active: !model.is_active,
    }, refresh);
    setTogglingId(null);
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    if (value === 'all') {
      setIsActiveFilter(undefined);
    } else if (value === 'active') {
      setIsActiveFilter(true);
    } else {
      setIsActiveFilter(false);
    }
  };

  // Get current filter value for display
  const getFilterValue = () => {
    if (isActiveFilter === undefined) return 'all';
    return isActiveFilter ? 'active' : 'inactive';
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
              <Brain className="text-cyan-400" /> Neural Assets
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              Provision and calibrate large language models for specialized agent nodes.
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          disabled={mutationLoading}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-cyan-900/20 font-bold text-xs tracking-widest disabled:opacity-50"
        >
          <Plus size={14} /> Register model
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 shrink-0">
        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-slate-500" />
          <select
            value={getFilterValue()}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="bg-slate-950 border border-slate-700/60 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200 transition-all"
          >
            <option value="all">All Models</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
        {/* View toggle */}
        <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800">
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Loader2 size={48} className="animate-spin text-cyan-500 mb-4" />
            <p className="text-sm font-bold tracking-wide">Loading models...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-red-950/20 border border-dashed border-red-800 rounded-2xl">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <p className="text-sm font-bold tracking-wide text-red-400 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && models.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <Brain size={48} className="opacity-10 mb-4" />
            <p className="text-sm font-bold tracking-wide">No neural assets registered.</p>
            <p className="text-xs text-slate-600 mt-2">Click "Register model" to add your first model.</p>
          </div>
        )}

        {/* Card View */}
        {!loading && !error && models.length > 0 && viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6 auto-rows-fr">
            {models.map((model) => {
              const style = getModelStatusStyle(model.is_active);
              const isToggling = togglingId === model.id;
              return (
                <div
                  key={model.id}
                  className="relative bg-slate-900 border border-slate-800/80 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all group flex flex-col min-h-[260px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-950/10"
                >
                  <div className={`h-1 w-full ${style.accent} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0">
                          <Cpu size={20} />
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <h3 className="text-base font-bold text-white mb-0.5 truncate group-hover:text-cyan-400 transition-colors leading-tight" title={model.name}>
                            {model.name}
                          </h3>
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] opacity-80 font-mono truncate">
                            {model.model_id}
                          </div>
                        </div>
                      </div>
                      {/* Switch toggle for active status */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${model.is_active ? 'text-green-400' : 'text-slate-500'}`}>
                          {model.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(model);
                          }}
                          disabled={isToggling || mutationLoading}
                          className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                            model.is_active ? 'bg-green-600' : 'bg-slate-700'
                          } ${isToggling || mutationLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                          title={model.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 flex items-center justify-center ${
                              model.is_active ? 'left-5' : 'left-0.5'
                            }`}
                          >
                            {isToggling && <Loader2 size={10} className="animate-spin text-slate-400" />}
                          </span>
                        </button>
                      </div>
                    </div>
                    {model.description && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{model.description}</p>
                    )}
                    <div className="space-y-2.5 flex-1">
                      {model.max_tokens && (
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                            <Maximize2 size={12} className="text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] text-slate-500 leading-none mb-1">Max Tokens</div>
                            <div className="text-xs text-slate-200 font-bold truncate">
                              {(model.max_tokens / 1000).toFixed(0)}k
                            </div>
                          </div>
                        </div>
                      )}
                      {model.temperature !== undefined && (
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                            <Thermometer size={12} className="text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] text-slate-500 leading-none mb-1">Temperature</div>
                            <div className="text-xs text-slate-300 font-medium truncate">{model.temperature}</div>
                          </div>
                        </div>
                      )}
                      {model.region && (
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                            <Globe size={12} className="text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] text-slate-500 leading-none mb-1">Region</div>
                            <div className="text-xs text-slate-300 font-medium truncate">{model.region}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-800/40 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(model)}
                          className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all"
                          title="Edit model"
                        >
                          <Settings size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(model.id)}
                          className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                          title="Delete model"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[8px] font-mono text-slate-600 font-bold uppercase tracking-tighter truncate max-w-[80px]">
                        #{model.id}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {!loading && !error && models.length > 0 && viewMode === 'list' && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Model</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Model ID</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Max Tokens</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Status</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {models.map((model) => {
                  const style = getModelStatusStyle(model.is_active);
                  const isToggling = togglingId === model.id;
                  return (
                    <tr
                      key={model.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => openEditModal(model)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0">
                            <Brain size={18} />
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate max-w-xs" title={model.name}>
                              {model.name}
                            </div>
                            {model.description && (
                              <div className="text-[9px] text-slate-500 truncate max-w-[200px]">{model.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-300 font-mono">{model.model_id}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-400 font-mono">
                          {model.max_tokens ? `${(model.max_tokens / 1000).toFixed(0)}k` : '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(model);
                            }}
                            disabled={isToggling || mutationLoading}
                            className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                              model.is_active ? 'bg-green-600' : 'bg-slate-700'
                            } ${isToggling || mutationLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                            title={model.is_active ? 'Click to deactivate' : 'Click to activate'}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 flex items-center justify-center ${
                                model.is_active ? 'left-5' : 'left-0.5'
                              }`}
                            >
                              {isToggling && <Loader2 size={10} className="animate-spin text-slate-400" />}
                            </span>
                          </button>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${model.is_active ? 'text-green-400' : 'text-slate-500'}`}>
                            {model.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(model);
                            }}
                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400"
                          >
                            <Settings size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(model.id);
                            }}
                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400"
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
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1 || loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest">Page</span>
          <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{page}</span>
          <span className="text-[10px] text-slate-500 font-bold">/</span>
          <span className="text-xs text-slate-400 font-mono font-bold">{Math.max(1, totalPages)}</span>
        </div>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <ModelFormModal
          model={editingModel}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          loading={mutationLoading}
          error={mutationError}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <DeleteConfirmModal
          modelName={models.find((m) => m.id === deleteConfirmId)?.name || 'this model'}
          onConfirm={() => handleDelete(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
          loading={mutationLoading}
          error={mutationError}
        />
      )}
    </div>
  );
};

// Form data interface for modal
interface ModelFormData {
  name: string;
  model_id: string;
  description: string;
  is_active: boolean;
  max_tokens: number | undefined;
  temperature: number | undefined;
  top_p: number | undefined;
  region: string;
}

// Model Form Modal
interface ModelFormModalProps {
  model: ModelDTO | null;
  onClose: () => void;
  onSave: (data: ModelFormData) => void;
  loading: boolean;
  error: string | null;
}

const ModelFormModal: React.FC<ModelFormModalProps> = ({ model, onClose, onSave, loading, error }) => {
  const [formData, setFormData] = useState<ModelFormData>({
    name: model?.name || '',
    model_id: model?.model_id || '',
    description: model?.description || '',
    is_active: model?.is_active ?? true,
    max_tokens: model?.max_tokens,
    temperature: model?.temperature,
    top_p: model?.top_p,
    region: model?.region || '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.model_id.trim()) {
      errors.model_id = 'Model ID is required';
    }
    if (formData.temperature !== undefined) {
      if (formData.temperature < 0 || formData.temperature > 2) {
        errors.temperature = 'Temperature must be between 0 and 2';
      }
    }
    if (formData.top_p !== undefined) {
      if (formData.top_p < 0 || formData.top_p > 1) {
        errors.top_p = 'Top P must be between 0 and 1';
      }
    }
    if (formData.max_tokens !== undefined && formData.max_tokens < 1) {
      errors.max_tokens = 'Max tokens must be positive';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-t-4 border-t-cyan-600 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800 shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
            <Sparkles size={16} className="text-cyan-400" />
            {model ? 'Edit Model' : 'Register Model'}
          </h3>
          <button onClick={onClose} disabled={loading} className="text-slate-500 hover:text-white transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Error Display */}
          {error && (
            <div className="bg-red-950/30 border border-red-800 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all ${validationErrors.name ? 'border-red-500' : 'border-slate-700'}`}
              placeholder="GPT-4 Turbo..."
            />
            {validationErrors.name && <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>}
          </div>

          {/* Model ID */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Model ID *
            </label>
            <input
              type="text"
              value={formData.model_id}
              onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
              className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all font-mono ${validationErrors.model_id ? 'border-red-500' : 'border-slate-700'}`}
              placeholder="gpt-4-turbo..."
            />
            {validationErrors.model_id && <p className="text-red-400 text-xs mt-1">{validationErrors.model_id}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all resize-none"
              placeholder="Optional description..."
            />
          </div>

          {/* Max Tokens & Temperature */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={formData.max_tokens ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, max_tokens: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all font-mono ${validationErrors.max_tokens ? 'border-red-500' : 'border-slate-700'}`}
                placeholder="128000"
              />
              {validationErrors.max_tokens && <p className="text-red-400 text-xs mt-1">{validationErrors.max_tokens}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Temperature (0-2)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, temperature: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all font-mono ${validationErrors.temperature ? 'border-red-500' : 'border-slate-700'}`}
                placeholder="0.7"
              />
              {validationErrors.temperature && <p className="text-red-400 text-xs mt-1">{validationErrors.temperature}</p>}
            </div>
          </div>

          {/* Top P & Region */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Top P (0-1)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.top_p ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, top_p: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all font-mono ${validationErrors.top_p ? 'border-red-500' : 'border-slate-700'}`}
                placeholder="1.0"
              />
              {validationErrors.top_p && <p className="text-red-400 text-xs mt-1">{validationErrors.top_p}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Region
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                placeholder="us-east-1"
              />
            </div>
          </div>
        </form>

        <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black tracking-widest rounded-lg shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {model ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
  modelName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ modelName, onConfirm, onCancel, loading, error }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-red-950/50 border border-red-800">
            <Trash2 size={24} className="text-red-400" />
          </div>
          <h3 className="font-bold text-white text-lg">Delete Model?</h3>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-800 rounded-lg p-3 text-red-400 text-sm mb-4 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <p className="text-slate-400 text-sm mb-6">
          Are you sure you want to delete <span className="text-white font-bold">{modelName}</span>? This action cannot be undone.
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

export default ModelManagement;
