/**
 * TopologiesManagement Component
 *
 * Displays paginated list of Topologies with search, CRUD operations
 * Feature: 003-topologies-management
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { TopologyGroup } from '../types';
import { useTopologies, useTopologyMutations } from '../services/hooks';
import type { TopologyListItem, TopologyFormData } from '../services/api/types';
import {
  Search,
  Plus,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
  Share2,
  Layers,
  AlertTriangle,
  Zap,
  Network,
  LayoutList,
  LayoutGrid,
  ArrowUpRight,
  Settings,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface TopologiesManagementProps {
  activeScopeId?: string;
  isSimulating?: boolean;
  onEnter: (id: string) => void;
  onNavigateToDiagnosis: () => void;
}

const CARD_PAGE_SIZE = 8;
const LIST_PAGE_SIZE = 10;

const TopologiesManagement: React.FC<TopologiesManagementProps> = ({
  activeScopeId,
  isSimulating,
  onEnter,
  onNavigateToDiagnosis
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API hooks
  const {
    topologies,
    pagination,
    loading,
    error,
    refresh,
    setPage,
    setSize,
    setKeyword
  } = useTopologies();

  const mutations = useTopologyMutations();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingTg, setEditingTg] = useState<TopologyListItem | null>(null);
  const [viewingTg, setViewingTg] = useState<TopologyListItem | null>(null);
  const [tgToDelete, setTgToDelete] = useState<TopologyListItem | null>(null);

  // Update page size when view mode changes
  useEffect(() => {
    const newSize = viewMode === 'card' ? CARD_PAGE_SIZE : LIST_PAGE_SIZE;
    if (pagination.size !== newSize) {
      setSize(newSize);
    }
  }, [viewMode, pagination.size, setSize]);

  // Debounced search handler
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce API call by 300ms
    searchTimeoutRef.current = setTimeout(() => {
      setKeyword(value);
    }, 300);
  }, [setKeyword]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const openAddModal = () => {
    setEditingTg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tg: TopologyListItem) => {
    setEditingTg(tg);
    setIsModalOpen(true);
  };

  const openDetailModal = (tg: TopologyListItem) => {
    setViewingTg(tg);
    setIsDetailOpen(true);
  };

  const promptDelete = (e: React.MouseEvent, tg: TopologyListItem) => {
    e.stopPropagation();
    setTgToDelete(tg);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (tgToDelete) {
      // T027: Updated to use new API - no confirmName needed
      const success = await mutations.remove(tgToDelete.id);
      if (success) {
        setIsDeleteModalOpen(false);
        setTgToDelete(null);
        refresh();
      }
    }
  };

  const handleSave = async (formData: TopologyFormData) => {
    if (editingTg) {
      // Update existing
      const result = await mutations.update(editingTg.id, formData, editingTg.version);
      if (result) {
        setIsModalOpen(false);
        refresh();
      }
    } else {
      // Create new
      const result = await mutations.create(formData);
      if (result) {
        setIsModalOpen(false);
        refresh();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
             <Network className="text-cyan-400" /> Topology Management
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Define and oversee logical cluster boundaries and operation sectors.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-cyan-900/20 font-bold text-xs tracking-widest"
        >
          <Plus size={14} /> Create topology
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 shrink-0 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search topologies by name, tag or ID..."
            value={searchInput}
            onChange={handleSearchInput}
            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
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
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Loader2 size={48} className="animate-spin text-cyan-500 mb-4" />
            <p className="text-sm font-bold tracking-wide">Loading topologies...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-red-950/10 border border-dashed border-red-900/30 rounded-2xl">
            <AlertTriangle size={48} className="text-red-500 opacity-50 mb-4" />
            <p className="text-sm font-bold tracking-wide text-red-400 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && topologies.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <Network size={48} className="opacity-10 mb-4" />
            <p className="text-sm font-bold tracking-wide">No topology graphs available in this sector.</p>
            <button
              onClick={openAddModal}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all"
            >
              <Plus size={14} /> Create your first topology
            </button>
          </div>
        )}

        {/* Card View */}
        {!loading && !error && topologies.length > 0 && viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
            {topologies.map((tg) => {
              const isActive = activeScopeId === String(tg.id);
              const isRunning = isActive && isSimulating;
              return (
                <div
                  key={tg.id}
                  onClick={() => onEnter(String(tg.id))}
                  className={`relative bg-slate-900 border rounded-xl transition-all cursor-pointer flex flex-col min-h-[220px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-950/10 ${isActive ? 'border-indigo-500/50 bg-indigo-950/10 shadow-indigo-900/10' : 'border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-800/40'}`}
                >
                  <div className={`h-1 w-full ${isActive ? 'bg-indigo-600' : 'bg-slate-700'} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-950/30 text-indigo-400 border border-indigo-500/20' : 'bg-slate-950 text-cyan-500 border border-slate-800'}`}>
                        <Network size={20} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
                          <Layers size={10} /> {tg.memberCount} UNITS
                        </div>
                        {isActive && (
                          <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${isRunning ? 'text-indigo-400 border-indigo-500/30 bg-indigo-950/50 animate-pulse' : 'text-indigo-500 border-indigo-900/30 bg-indigo-950/20'}`}>
                            <Zap size={10} className={isRunning ? 'fill-indigo-400' : ''} /> {isRunning ? 'RUNNING' : 'ACTIVE'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className={`text-base font-bold mb-0.5 truncate transition-colors leading-tight ${isActive ? 'text-indigo-300' : 'text-white group-hover:text-cyan-400'}`}>{tg.name}</h3>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] opacity-80 line-clamp-1">{tg.description}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1.5">
                        {tg.tags?.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800/60 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-800/40 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); openDetailModal(tg); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="View Intelligence Profile"><Eye size={15} /></button>
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(tg); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="Modify Protocol"><Settings size={15} /></button>
                        <button onClick={(e) => promptDelete(e, tg)} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-red-400 transition-all" title="Decommission"><Trash2 size={15} /></button>
                      </div>
                      <button className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1.5 ${isActive ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/30' : 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-600/20'}`}>
                        EXPLORE <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {!loading && !error && topologies.length > 0 && viewMode === 'list' && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Topology Label</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-center">Unit Count</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Status</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {topologies.map((tg) => {
                  const isActive = activeScopeId === String(tg.id);
                  return (
                    <tr key={tg.id} className="hover:bg-slate-800/40 transition-colors group cursor-pointer" onClick={() => onEnter(String(tg.id))}>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg border ${isActive ? 'bg-indigo-950/30 text-indigo-400 border-indigo-500/30' : 'bg-slate-950 text-cyan-500 border border-slate-800'}`}><Network size={18} /></div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{tg.name}</div>
                            <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest">ID: {tg.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 font-mono">{tg.memberCount}</span>
                      </td>
                      <td className="p-4">
                        {isActive ? (
                          <span className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></span>
                            Operational
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Idle</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={(e) => { e.stopPropagation(); onEnter(String(tg.id)); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400"><ArrowUpRight size={16} /></button>
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(tg); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400"><Settings size={16} /></button>
                          <button onClick={(e) => promptDelete(e, tg)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
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
      {!loading && !error && topologies.length > 0 && (
        <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest">Registry segment</span>
            <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{pagination.page}</span>
            <span className="text-[10px] text-slate-500 font-bold">/</span>
            <span className="text-xs text-slate-400 font-mono font-bold">{Math.max(1, pagination.totalPages)}</span>
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

      {isModalOpen && (
        <TopologyFormModal
          tg={editingTg}
          onClose={() => { setIsModalOpen(false); mutations.clearError(); }}
          onSave={handleSave}
          loading={mutations.creating || mutations.updating}
          error={mutations.error}
        />
      )}
      {isDetailOpen && viewingTg && <TopologyDetailModal tg={viewingTg} onClose={() => setIsDetailOpen(false)} />}
      
      {isDeleteModalOpen && tgToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="flex justify-center mb-4 text-red-500">
              <div className="p-4 bg-red-950/20 rounded-full border border-red-900/30">
                <AlertTriangle size={32} />
              </div>
            </div>
            <h3 className="font-bold text-xl text-white mb-2 tracking-tight">Delete Topology?</h3>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              This action will purge the logical mapping of <span className="text-white font-black underline decoration-red-500/50">{tgToDelete.name}</span>. Associated resources will persist in the global registry.
            </p>
            {mutations.error && (
              <p className="text-red-400 text-xs mb-4 bg-red-950/20 p-2 rounded border border-red-900/30">{mutations.error}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setIsDeleteModalOpen(false); mutations.clearError(); }}
                disabled={mutations.deleting}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors disabled:opacity-50"
              >
                Abort
              </button>
              <button
                onClick={confirmDelete}
                disabled={mutations.deleting}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black tracking-widest shadow-lg shadow-red-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {mutations.deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                {mutations.deleting ? 'Deleting...' : 'Confirm delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TopologyFormModal: React.FC<{
  tg: TopologyListItem | null,
  onClose: () => void,
  onSave: (data: TopologyFormData) => void,
  loading?: boolean,
  error?: string | null
}> = ({ tg, onClose, onSave, loading = false, error = null }) => {
  const [formData, setFormData] = useState<TopologyFormData>({
    name: tg?.name || '',
    description: tg?.description || '',
    tags: tg?.tags || []
  });
  const [tagInput, setTagInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };
  const removeTag = (idx: number) => {
    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate required fields
    if (!formData.name.trim()) {
      setValidationError('Topology name is required');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-t-4 border-t-cyan-600 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                    <Sparkles size={16} className="text-cyan-400" /> {tg ? 'Modify topology map' : 'Define new topology'}
                </h3>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                {/* Error Display */}
                {(validationError || error) && (
                  <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400 text-xs">
                    {validationError || error}
                  </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Topology Name <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => { setFormData({...formData, name: e.target.value}); setValidationError(null); }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                          placeholder="e.g. Production Data Flow"
                          disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description</label>
                        <textarea
                          rows={3}
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none resize-none transition-all"
                          placeholder="Outline the purpose of this logical grouping..."
                          disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tags</label>
                        <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={tagInput}
                              onChange={e => setTagInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-cyan-500/50 outline-none"
                              placeholder="Press enter to add..."
                              disabled={loading}
                            />
                            <button type="button" onClick={handleAddTag} disabled={loading} className="px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all tracking-widest disabled:opacity-50">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags?.map((tag, idx) => (
                                <span key={idx} className="flex items-center gap-1 bg-cyan-950/40 text-cyan-400 px-2 py-1 rounded text-[10px] font-bold border border-cyan-500/20">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(idx)} disabled={loading} className="hover:text-white disabled:opacity-50"><X size={12}/></button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </form>
            <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50">Cancel</button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black tracking-widest shadow-lg shadow-cyan-900/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {loading ? 'Saving...' : 'Commit changes'}
                </button>
            </div>
        </div>
    </div>
  );
};

const TopologyDetailModal: React.FC<{ tg: TopologyListItem, onClose: () => void }> = ({ tg, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-t-indigo-600">
            <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                    <Share2 className="text-indigo-400" size={18} /> Topology Intelligence
                </h3>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
                <div className="p-5 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner">
                    <h4 className="text-xl font-black text-white mb-2 leading-tight">{tg.name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed italic">"{tg.description || 'No system definition provided.'}"</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Entity ID</div>
                        <div className="text-xs text-cyan-400 font-mono font-bold truncate">{tg.id}</div>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Active Units</div>
                        <div className="text-sm text-white font-mono font-bold">{tg.memberCount}</div>
                    </div>
                </div>

            </div>
            <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black tracking-widest rounded-lg transition-all">Close segment</button>
            </div>
        </div>
    </div>
);

export default TopologiesManagement;
