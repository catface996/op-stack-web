/**
 * MembersList Component
 *
 * Displays paginated list of topology members with actions
 * Feature: 003-topologies-management
 */

import React, { useState } from 'react';
import type { TopologyMember } from '../../services/api/types';
import type { MembersPagination } from '../../services/hooks';
import {
  Box,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Users,
  ExternalLink,
  Check,
} from 'lucide-react';
import { getResourceTypeIcon } from '../../services/api/resources';

interface MembersListProps {
  members: TopologyMember[];
  pagination: MembersPagination;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onRemoveMember: (member: TopologyMember) => void;
  onRemoveSelected: (members: TopologyMember[]) => void;
  onViewResource: (memberId: number) => void;
  removing?: boolean;
  /** Compact mode for sidebar display */
  compact?: boolean;
}

export const MembersList: React.FC<MembersListProps> = ({
  members,
  pagination,
  loading,
  error,
  onRefresh,
  onPageChange,
  onRemoveMember,
  onRemoveSelected,
  onViewResource,
  removing = false,
  compact = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map(m => m.memberId)));
    }
  };

  const handleRemoveSelected = () => {
    const selectedMembers = members.filter(m => selectedIds.has(m.memberId));
    onRemoveSelected(selectedMembers);
    setSelectedIds(new Set());
  };

  // Loading state
  if (loading && members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500">
        <Loader2 size={32} className="animate-spin text-cyan-500 mb-3" />
        <p className="text-sm font-bold">Loading members...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500 bg-red-950/10 border border-dashed border-red-900/30 rounded-xl">
        <AlertTriangle size={32} className="text-red-500 opacity-50 mb-3" />
        <p className="text-sm font-bold text-red-400 mb-3">{error}</p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
        <Users size={32} className="opacity-20 mb-3" />
        <p className="text-sm font-bold">No members in this topology</p>
        <p className="text-xs text-slate-600 mt-1">Add resources to this topology to see them here</p>
      </div>
    );
  }

  // Compact mode - simple card list for sidebar
  if (compact) {
    return (
      <div className="space-y-2">
        {members.map((member) => {
          const Icon = getResourceTypeIcon(member.memberTypeCode, member.memberName);
          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-600 group transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                <div className="p-1.5 rounded bg-slate-950 text-cyan-500 border border-slate-800 shrink-0">
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-200 truncate">{member.memberName}</div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-500">
                    <span className="font-mono">{member.memberTypeCode}</span>
                    <span className={`font-black uppercase ${
                      member.memberStatus === 'RUNNING' ? 'text-green-400' :
                      member.memberStatus === 'STOPPED' ? 'text-slate-500' :
                      member.memberStatus === 'MAINTENANCE' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {member.memberStatus}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <button
                  onClick={() => onViewResource(member.memberId)}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-500 hover:text-cyan-400"
                  title="View details"
                >
                  <ExternalLink size={12} />
                </button>
                <button
                  onClick={() => onRemoveMember(member)}
                  disabled={removing}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400 disabled:opacity-50"
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Compact pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] text-slate-400">
              {pagination.page}/{pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-lg">
          <span className="text-xs font-bold text-indigo-300">
            {selectedIds.size} member{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleRemoveSelected}
            disabled={removing}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            {removing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Remove Selected
          </button>
        </div>
      )}

      {/* Member list */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950 sticky top-0 z-10">
            <tr>
              <th className="p-3 w-10">
                <button
                  onClick={toggleSelectAll}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    selectedIds.size === members.length && members.length > 0
                      ? 'bg-cyan-600 border-cyan-500'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  {selectedIds.size === members.length && members.length > 0 && (
                    <Check size={12} className="text-white" />
                  )}
                </button>
              </th>
              <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Member</th>
              <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Type</th>
              <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Status</th>
              <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/40">
            {members.map((member) => {
              const Icon = getResourceTypeIcon(member.memberTypeCode, member.memberName);
              const isSelected = selectedIds.has(member.memberId);
              return (
                <tr
                  key={member.id}
                  className={`transition-colors group ${
                    isSelected ? 'bg-indigo-950/20' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="p-3">
                    <button
                      onClick={() => toggleSelect(member.memberId)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-cyan-600 border-cyan-500'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-950 text-cyan-500 border border-slate-800 shrink-0">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <div className="text-sm font-bold text-white truncate max-w-xs" title={member.memberName}>{member.memberName}</div>
                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest">ID: {member.memberId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-xs text-slate-400 font-mono">{member.memberTypeCode}</span>
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      member.memberStatus === 'RUNNING'
                        ? 'text-green-400'
                        : member.memberStatus === 'STOPPED'
                        ? 'text-slate-500'
                        : member.memberStatus === 'MAINTENANCE'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      {member.memberStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => onViewResource(member.memberId)}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400"
                        title="View resource details"
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button
                        onClick={() => onRemoveMember(member)}
                        disabled={removing}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400 disabled:opacity-50"
                        title="Remove from topology"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all text-xs font-bold"
          >
            <ChevronLeft size={12} /> Prev
          </button>
          <span className="text-xs text-slate-400">
            Page <span className="text-white font-mono font-bold">{pagination.page}</span> of{' '}
            <span className="font-mono font-bold">{pagination.totalPages}</span>
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all text-xs font-bold"
          >
            Next <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MembersList;
