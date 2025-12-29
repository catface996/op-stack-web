/**
 * AddMembersDialog Component
 *
 * Dialog for adding resources as members to a topology
 * Feature: 003-topologies-management
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useResources } from '../../services/hooks';
import type { ResourceDTO, CycleDetectionResponse } from '../../services/api/types';
import { getResourceTypeIcon } from '../../services/api/resources';
import {
  X,
  Search,
  Check,
  Loader2,
  AlertTriangle,
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AddMembersDialogProps {
  subgraphId: number;
  existingMemberIds: number[];
  onClose: () => void;
  onAdd: (memberIds: number[]) => Promise<boolean>;
  onCheckCycle: (memberIds: number[]) => Promise<CycleDetectionResponse>;
  adding?: boolean;
  checkingCycle?: boolean;
  error?: string | null;
  cycleError?: CycleDetectionResponse | null;
}

export const AddMembersDialog: React.FC<AddMembersDialogProps> = ({
  subgraphId,
  existingMemberIds,
  onClose,
  onAdd,
  onCheckCycle,
  adding = false,
  checkingCycle = false,
  error = null,
  cycleError = null,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Debounce search
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { resources, loading: loadingResources, pagination, setPage, refresh: refreshResources } = useResources({ keyword: searchKeyword });

  // Track successfully added member IDs (to filter from list without closing dialog)
  const [addedMemberIds, setAddedMemberIds] = useState<Set<number>>(new Set());

  // Filter out existing members, newly added members, and the subgraph itself from current page
  const availableResources = useMemo(() => {
    const existingSet = new Set([...existingMemberIds, ...addedMemberIds, subgraphId]);
    return resources.filter(r => !existingSet.has(r.id));
  }, [resources, existingMemberIds, addedMemberIds, subgraphId]);

  // Debounced search handler
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchKeyword(value);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;

    const memberIds = Array.from(selectedIds);

    // Check for subgraphs that might cause cycles
    const selectedResources = availableResources.filter(r => selectedIds.has(r.id));
    const hasSubgraphs = selectedResources.some(r => {
      try {
        const attrs = JSON.parse(r.attributes || '{}');
        return attrs.isSubgraph === true;
      } catch {
        return false;
      }
    });

    // Only check cycles if adding subgraphs
    if (hasSubgraphs) {
      const cycleResult = await onCheckCycle(memberIds);
      if (cycleResult.hasCycle) {
        return; // Error will be shown via cycleError prop
      }
    }

    const success = await onAdd(memberIds);
    if (success) {
      // Add successfully added IDs to the filter set (removes them from list)
      setAddedMemberIds(prev => new Set([...prev, ...memberIds]));
      // Clear selection
      setSelectedIds(new Set());
      // Refresh the resource list
      refreshResources();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-t-4 border-t-cyan-600 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
            <Users size={16} className="text-cyan-400" /> Add Members
          </h3>
          <button onClick={onClose} disabled={adding} className="text-slate-500 hover:text-white transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search resources by name..."
              value={searchInput}
              onChange={handleSearchInput}
              className="w-full bg-slate-950 border border-slate-700/60 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200 transition-all"
            />
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Cycle error display */}
        {cycleError?.hasCycle && (
          <div className="mx-4 mt-4 p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg text-amber-400 text-xs">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle size={14} /> Circular Reference Detected
            </div>
            <p>{cycleError.cycleDescription || 'Adding these members would create a circular reference.'}</p>
          </div>
        )}

        {/* Resource list */}
        <div className="flex-1 overflow-auto custom-scrollbar p-4">
          {loadingResources ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500">
              <Loader2 size={24} className="animate-spin text-cyan-500 mb-2" />
              <p className="text-xs">Loading resources...</p>
            </div>
          ) : availableResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500">
              <Users size={24} className="opacity-20 mb-2" />
              <p className="text-xs">No available resources found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableResources.map((resource) => {
                const Icon = getResourceTypeIcon(resource.resourceTypeCode, resource.name);
                const isSelected = selectedIds.has(resource.id);
                const isSubgraph = (() => {
                  try {
                    const attrs = JSON.parse(resource.attributes || '{}');
                    return attrs.isSubgraph === true;
                  } catch {
                    return false;
                  }
                })();

                return (
                  <div
                    key={resource.id}
                    onClick={() => toggleSelect(resource.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/30 border border-cyan-500/30'
                        : 'bg-slate-950/50 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-cyan-600 border-cyan-500'
                        : 'border-slate-600'
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 text-cyan-500 border border-slate-800">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate" title={resource.name}>{resource.name}</span>
                        {isSubgraph && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-950/50 text-indigo-400 border border-indigo-500/30">
                            Subgraph
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest">
                        {resource.resourceTypeCode} · ID: {resource.id}
                      </div>
                    </div>
                    <div className={`text-[9px] font-black uppercase tracking-widest ${
                      resource.status === 'RUNNING'
                        ? 'text-green-400'
                        : resource.status === 'STOPPED'
                        ? 'text-slate-500'
                        : resource.status === 'MAINTENANCE'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      {resource.status}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loadingResources && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4 mt-4 border-t border-slate-800">
              <button
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page === 1 || loadingResources}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all text-xs font-bold"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs text-slate-400">
                Page <span className="text-white font-mono font-bold">{pagination.page}</span> of{' '}
                <span className="font-mono font-bold">{pagination.totalPages}</span>
                <span className="text-slate-600 ml-2">({pagination.totalElements} total)</span>
              </span>
              <button
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loadingResources}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all text-xs font-bold"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedIds.size > 0 ? (
              <span className="text-cyan-400 font-bold">{selectedIds.size}</span>
            ) : (
              '0'
            )}{' '}
            resource{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={adding || checkingCycle}
              className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedIds.size === 0 || adding || checkingCycle}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black tracking-widest shadow-lg shadow-cyan-900/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {adding || checkingCycle ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {checkingCycle ? 'Checking...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Plus size={14} /> Add Members
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMembersDialog;
