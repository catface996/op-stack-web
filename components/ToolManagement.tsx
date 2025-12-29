/**
 * Tool Management Component
 *
 * CRUD interface for managing tools with the new ToolDTO data model
 * Feature: 010-tools-management
 * Feature: 010-tool-category-management (category integration)
 */

import React, { useState, useEffect } from 'react';
import { ToolDTO, ToolStatus, ToolCreateRequest, ToolUpdateRequest, ToolCategoryDTO } from '../types';
import StyledSelect from './ui/StyledSelect';
import ConfirmDialog from './ui/ConfirmDialog';
import CategoryManagement from './tool/CategoryManagement';
import { useTools } from '../services/hooks/useTools';
import { useCategories } from '../services/hooks/useCategories';
import { useDebounce } from '../services/hooks/useDebounce';
import { createTool, updateTool, deleteTool, activateTool, deactivateTool } from '../services/api/tools';
import { listCategories } from '../services/api/categories';
import {
  ArrowLeft,
  Wrench,
  Plus,
  Search,
  Trash2,
  Settings,
  Save,
  X,
  Puzzle,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Link,
  SearchCode,
  Zap,
  Loader2,
  AlertCircle,
  Power,
  PowerOff,
  Tag,
  Hash,
  FolderOpen
} from 'lucide-react';

interface ToolManagementProps {
  onBack: () => void;
}

// Tab type for navigation
type ManagementTab = 'tools' | 'categories';

const ToolManagement: React.FC<ToolManagementProps> = ({ onBack }) => {
  // Tab state for Tools/Categories navigation
  const [activeTab, setActiveTab] = useState<ManagementTab>('tools');

  const {
    tools,
    loading,
    error,
    page,
    totalPages,
    total: toolsTotal,
    setPage,
    setStatus,
    setSearch,
    status: statusFilter,
    search: searchTerm,
    refresh,
  } = useTools({ size: 8 });

  // Get categories count for tab badge
  const { total: categoriesTotal } = useCategories({ size: 1 });

  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolDTO | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  
  // Debounce search input
  const debouncedSearch = useDebounce(localSearch, 300);
  
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  // Delete confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    tool: ToolDTO | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    tool: null,
    isLoading: false,
  });

  // Status toggle loading state
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  const getStatusStyle = (status: ToolStatus) => {
    switch (status) {
      case 'active': return { bg: 'bg-emerald-950/30', border: 'border-emerald-500/20', text: 'text-emerald-400' };
      case 'draft': return { bg: 'bg-amber-950/30', border: 'border-amber-500/20', text: 'text-amber-400' };
      case 'deprecated': return { bg: 'bg-orange-950/30', border: 'border-orange-500/20', text: 'text-orange-400' };
      case 'disabled': return { bg: 'bg-slate-950/30', border: 'border-slate-500/20', text: 'text-slate-400' };
      default: return { bg: 'bg-cyan-950/30', border: 'border-cyan-500/20', text: 'text-cyan-400' };
    }
  };

  const getExecutorIcon = (executorType: string) => {
    switch (executorType?.toLowerCase()) {
      case 'python': return Terminal;
      case 'http': return Link;
      case 'retrieval': return SearchCode;
      default: return Puzzle;
    }
  };

  const openModal = (tool?: ToolDTO) => {
    setEditingTool(tool || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTool(null);
  };

  const handleDeleteClick = (tool: ToolDTO) => {
    setDeleteConfirm({ isOpen: true, tool, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.tool) return;

    setDeleteConfirm(prev => ({ ...prev, isLoading: true }));

    try {
      await deleteTool({ tool_id: deleteConfirm.tool.id });
      setDeleteConfirm({ isOpen: false, tool: null, isLoading: false });
      refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Delete failed');
      setDeleteConfirm(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, tool: null, isLoading: false });
  };

  const handleToggleStatus = async (tool: ToolDTO) => {
    setTogglingStatus(tool.id);
    try {
      if (tool.status === 'active') {
        await deactivateTool({ tool_id: tool.id });
      } else {
        await activateTool({ tool_id: tool.id });
      }
      refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Status toggle failed');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleSave = async (data: ToolCreateRequest | ToolUpdateRequest) => {
    try {
      if (editingTool) {
        await updateTool({ tool_id: editingTool.id, ...data } as ToolUpdateRequest);
      } else {
        await createTool(data as ToolCreateRequest);
      }
      closeModal();
      refresh();
    } catch (error) {
      throw error; // Let the modal handle the error
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      {/* Header with title left, tab navigation right */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        {/* Left: Back button and title - changes based on active tab */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="group p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800/80 transition-all duration-200"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              {activeTab === 'tools' ? (
                <>
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                    <Wrench className="text-cyan-400" size={18} />
                  </div>
                  Tool Management
                </>
              ) : (
                <>
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                    <FolderOpen className="text-cyan-400" size={18} />
                  </div>
                  Category Management
                </>
              )}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {activeTab === 'tools'
                ? 'Manage tools and capabilities for Agents'
                : 'Manage tool categories for organization'}
            </p>
          </div>
        </div>

        {/* Right: Tab Navigation */}
        <div className="inline-flex bg-slate-900/60 backdrop-blur-sm p-1 rounded-xl border border-slate-800/60">
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'tools'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Wrench size={15} />
            <span>Tools</span>
            {toolsTotal > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                activeTab === 'tools' ? 'bg-white/20' : 'bg-slate-700/80 text-slate-400'
              }`}>
                {toolsTotal}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'categories'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FolderOpen size={15} />
            <span>Categories</span>
            {categoriesTotal > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                activeTab === 'categories' ? 'bg-white/20' : 'bg-slate-700/80 text-slate-400'
              }`}>
                {categoriesTotal}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Categories Tab Content */}
      {activeTab === 'categories' && (
        <CategoryManagement />
      )}

      {/* Tools Tab Content */}
      {activeTab === 'tools' && (
        <>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 bg-red-950/30 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 shrink-0">
        {/* Left: Search and Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search tools..."
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

          {/* Status Filter */}
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatus(e.target.value as ToolStatus || undefined)}
            className="bg-slate-950 border border-slate-700/60 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200"
            disabled={loading}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="deprecated">Deprecated</option>
            <option value="disabled">Disabled</option>
          </select>
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

          {/* Create Tool Button */}
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
            disabled={loading}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Tool</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Loader2 size={48} className="animate-spin mb-4 text-cyan-400" />
            <p className="text-sm font-bold tracking-wide">Loading tools...</p>
          </div>
        ) : tools.length > 0 ? (
          viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6 auto-rows-fr">
              {tools.map(tool => {
                const statusStyle = getStatusStyle(tool.status);
                const ExecutorIcon = getExecutorIcon(tool.executor_type);
                return (
                  <div key={tool.id} className="relative bg-slate-900 border border-slate-800/80 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all group flex flex-col min-h-[240px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-950/10">
                    <div className={`h-1 w-full ${tool.status === 'active' ? 'bg-emerald-500' : 'bg-slate-600'} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 group-hover:text-cyan-300 transition-colors shrink-0">
                            <ExecutorIcon size={20} />
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <h3 className="text-base font-bold text-white mb-0.5 truncate group-hover:text-cyan-400 transition-colors leading-tight" title={tool.display_name}>{tool.display_name}</h3>
                            <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest opacity-80 truncate">{tool.name}</div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
                          {tool.status}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3 flex-1">{tool.description}</p>
                      
                      {/* Category Badge */}
                      {tool.category && (
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-[9px] px-1.5 py-0.5 bg-amber-950/30 border border-amber-500/20 text-amber-400 rounded flex items-center gap-1">
                            <FolderOpen size={8} />{tool.category.name}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      {tool.tags && tool.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {tool.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded flex items-center gap-1">
                              <Tag size={8} />{tag}
                            </span>
                          ))}
                          {tool.tags.length > 3 && (
                            <span className="text-[9px] text-slate-500">+{tool.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-auto pt-4 border-t border-slate-800/40 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleToggleStatus(tool)} 
                            className={`p-1.5 hover:bg-slate-700/50 rounded-lg transition-all ${tool.status === 'active' ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-emerald-400'}`}
                            title={tool.status === 'active' ? 'Disable' : 'Enable'}
                            disabled={togglingStatus === tool.id}
                          >
                            {togglingStatus === tool.id ? <Loader2 size={15} className="animate-spin" /> : (tool.status === 'active' ? <Power size={15} /> : <PowerOff size={15} />)}
                          </button>
                          <button onClick={() => openModal(tool)} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="Edit">
                            <Settings size={15} />
                          </button>
                          <button onClick={() => handleDeleteClick(tool)} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-red-400 transition-all" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600">
                          <Hash size={10} /> v{tool.version}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Tool</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Description</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Category</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Status</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Version</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {tools.map(tool => {
                    const statusStyle = getStatusStyle(tool.status);
                    const ExecutorIcon = getExecutorIcon(tool.executor_type);
                    return (
                      <tr key={tool.id} className="hover:bg-slate-800/40 transition-colors group cursor-pointer" onClick={() => openModal(tool)}>
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 shrink-0">
                              <ExecutorIcon size={18} />
                            </div>
                            <div className="min-w-0 overflow-hidden">
                              <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate max-w-xs" title={tool.display_name}>{tool.display_name}</div>
                              <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest truncate">{tool.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-xs text-slate-400 max-w-sm truncate" title={tool.description}>{tool.description}</p>
                        </td>
                        <td className="p-4">
                          {tool.category ? (
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-950/30 border border-amber-500/20 text-amber-400 rounded inline-flex items-center gap-1">
                              <FolderOpen size={8} />{tool.category.name}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border tracking-widest ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
                            {tool.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-slate-400">v{tool.version}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleToggleStatus(tool); }} 
                              className={`p-2 hover:bg-slate-700 rounded-lg ${tool.status === 'active' ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}`}
                              disabled={togglingStatus === tool.id}
                            >
                              {togglingStatus === tool.id ? <Loader2 size={16} className="animate-spin" /> : (tool.status === 'active' ? <Power size={16} /> : <PowerOff size={16} />)}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); openModal(tool); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400">
                              <Settings size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(tool); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400">
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
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <Wrench size={48} className="opacity-10 mb-4" />
            <p className="text-sm font-bold tracking-wide">
              {searchTerm || statusFilter ? 'No matching tools found' : 'No tools yet'}
            </p>
            {(searchTerm || statusFilter) && (
              <button 
                onClick={() => { setLocalSearch(''); setStatus(undefined); }}
                className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination - always show for consistent UI */}
      {tools.length > 0 && (
        <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0 mt-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest">Page</span>
            <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{page}</span>
            <span className="text-[10px] text-slate-500 font-bold">/</span>
            <span className="text-xs text-slate-400 font-mono font-bold">{totalPages || 1}</span>
            <span className="text-[10px] text-slate-600 ml-2">({toolsTotal} total)</span>
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

      {/* Tool Form Modal */}
      {isModalOpen && (
        <ToolFormModal 
          tool={editingTool} 
          onClose={closeModal} 
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Tool"
        message={`Are you sure you want to delete "${deleteConfirm.tool?.display_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteConfirm.isLoading}
      />
        </>
      )}
    </div>
  );
};

/**
 * Tool Form Modal Component
 */
interface ToolFormModalProps {
  tool: ToolDTO | null;
  onClose: () => void;
  onSave: (data: ToolCreateRequest | ToolUpdateRequest) => Promise<void>;
}

const ToolFormModal: React.FC<ToolFormModalProps> = ({ tool, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: tool?.name || '',
    display_name: tool?.display_name || '',
    description: tool?.description || '',
    executor_type: tool?.executor_type || 'python',
    tags: tool?.tags?.join(', ') || '',
    input_schema: tool?.input_schema ? JSON.stringify(tool.input_schema, null, 2) : '{}',
    output_schema: tool?.output_schema ? JSON.stringify(tool.output_schema, null, 2) : '{}',
    script_content: tool?.script_content || '',
    category_id: tool?.category_id || '',
  });

  // Fetch categories for dropdown
  const [categories, setCategories] = useState<ToolCategoryDTO[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        // Constitution: API Pagination Request Format - use "size" not "page_size"
        const response = await listCategories({ page: 1, size: 100 });
        // Constitution: API Pagination Response Format - extract from data.content
        // Check for success via code === 0 or success === true
        const isSuccess = response.code === 0 || response.success === true;
        if (isSuccess && response.data) {
          setCategories(response.data.content || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCats();
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'schema' | 'script'>('basic');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Name validation (snake_case pattern)
    if (!formData.name.trim()) {
      newErrors.name = 'Tool identifier is required';
    } else if (!/^[a-z][a-z0-9_]*$/.test(formData.name)) {
      newErrors.name = 'Must start with lowercase letter, only lowercase letters, numbers, and underscores allowed';
    }
    
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    // Validate JSON schemas
    try {
      JSON.parse(formData.input_schema);
    } catch {
      newErrors.input_schema = 'Input schema must be valid JSON';
    }
    
    try {
      JSON.parse(formData.output_schema);
    } catch {
      newErrors.output_schema = 'Output schema must be valid JSON';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      const data: ToolCreateRequest = {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description,
        category_id: formData.category_id || null,  // Use selected category or null
        executor_type: formData.executor_type || 'python',
        executor_config: {},  // Required field with default empty object
        tags: tags.length > 0 ? tags : [],
        input_schema: JSON.parse(formData.input_schema),
        output_schema: JSON.parse(formData.output_schema),
        script_content: formData.script_content || null,
      };
      
      await onSave(data);
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Save failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-t-4 border-t-cyan-600 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
            <Zap size={16} className="text-cyan-400" /> 
            {tool ? 'Edit Tool' : 'New Tool'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors" disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30">
          {(['basic', 'schema', 'script'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'text-cyan-400 border-b-2 border-cyan-400' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'basic' ? 'Basic Info' : tab === 'schema' ? 'Schema' : 'Script'}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
          <div className="p-6 space-y-5">
            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Tool Identifier *
                    </label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:outline-none transition-all font-mono ${
                        errors.name ? 'border-red-500/50' : 'border-slate-700 focus:border-cyan-500/50'
                      }`}
                      placeholder="my_tool_name" 
                      disabled={isSubmitting || !!tool}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                    <p className="mt-1 text-[10px] text-slate-600">Lowercase letter start, only lowercase, numbers, underscores</p>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Display Name *
                    </label>
                    <input 
                      type="text" 
                      value={formData.display_name} 
                      onChange={e => setFormData({...formData, display_name: e.target.value})}
                      className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:outline-none transition-all ${
                        errors.display_name ? 'border-red-500/50' : 'border-slate-700 focus:border-cyan-500/50'
                      }`}
                      placeholder="My Tool" 
                      disabled={isSubmitting}
                    />
                    {errors.display_name && <p className="mt-1 text-xs text-red-400">{errors.display_name}</p>}
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Description *
                  </label>
                  <textarea 
                    rows={3} 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:outline-none resize-none transition-all ${
                      errors.description ? 'border-red-500/50' : 'border-slate-700 focus:border-cyan-500/50'
                    }`}
                    placeholder="Describe what this tool does..." 
                    disabled={isSubmitting}
                  />
                  {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Executor Type
                    </label>
                    <select
                      value={formData.executor_type}
                      onChange={e => setFormData({...formData, executor_type: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                      disabled={isSubmitting}
                    >
                      <option value="python">Python</option>
                      <option value="http">HTTP</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      <FolderOpen size={10} className="inline mr-1" /> Category
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={e => setFormData({...formData, category_id: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                      disabled={isSubmitting || loadingCategories}
                    >
                      <option value="">None</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {loadingCategories && <p className="mt-1 text-[10px] text-slate-600">Loading categories...</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    placeholder="tag1, tag2, tag3"
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-[10px] text-slate-600">Separate multiple tags with commas</p>
                </div>
              </>
            )}

            {/* Schema Tab */}
            {activeTab === 'schema' && (
              <>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Input Schema (JSON)
                  </label>
                  <textarea 
                    rows={8} 
                    value={formData.input_schema} 
                    onChange={e => setFormData({...formData, input_schema: e.target.value})}
                    className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:outline-none resize-none transition-all font-mono ${
                      errors.input_schema ? 'border-red-500/50' : 'border-slate-700 focus:border-cyan-500/50'
                    }`}
                    placeholder='{"type": "object", "properties": {...}}' 
                    disabled={isSubmitting}
                  />
                  {errors.input_schema && <p className="mt-1 text-xs text-red-400">{errors.input_schema}</p>}
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Output Schema (JSON)
                  </label>
                  <textarea 
                    rows={8} 
                    value={formData.output_schema} 
                    onChange={e => setFormData({...formData, output_schema: e.target.value})}
                    className={`w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-white focus:outline-none resize-none transition-all font-mono ${
                      errors.output_schema ? 'border-red-500/50' : 'border-slate-700 focus:border-cyan-500/50'
                    }`}
                    placeholder='{"type": "object", "properties": {...}}' 
                    disabled={isSubmitting}
                  />
                  {errors.output_schema && <p className="mt-1 text-xs text-red-400">{errors.output_schema}</p>}
                </div>
              </>
            )}
            
            {/* Script Tab */}
            {activeTab === 'script' && (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Script Content
                </label>
                <textarea 
                  rows={16} 
                  value={formData.script_content} 
                  onChange={e => setFormData({...formData, script_content: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none transition-all font-mono"
                  placeholder="# Python script content..." 
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-[10px] text-slate-600">Write script code based on the executor type</p>
              </div>
            )}

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

export default ToolManagement;
