
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Agent, AgentRole, AgentStatus, AgentConfig, AgentExecutionRecord, TraceStep } from '../types';
import { generateMockHistory } from '../services/mockData';
import { useAgents, AgentWithApiFields } from '../services/hooks/useAgents';
import type { AgentRoleDTO } from '../services/api/types';
import { paths } from '../services/routes';
import {
  Search,
  Users,
  Bot,
  Cpu,
  Server,
  Activity,
  LayoutList,
  LayoutGrid,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Wrench,
  Shield,
  Zap,
  Brain,
  Target,
  Layers,
  ArrowUpRight,
  ArrowRight,
  Trash2,
  Eye,
  X,
  History,
  Clock,
  ExternalLink,
  ChevronDown,
  Terminal,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Save
} from 'lucide-react';

interface AgentManagementProps {
  onManagePrompts: () => void;
  onManageModels: () => void;
  onManageTools: () => void;
}

// 默认分页 8，确保网格布局美观
const ITEMS_PER_PAGE = 8;

// Map UI role filter to API role
function mapRoleFilterToApiRole(filter: 'ALL' | 'SUPERVISOR' | 'WORKER'): AgentRoleDTO | undefined {
  switch (filter) {
    case 'SUPERVISOR':
      // We'll handle supervisor types (both GLOBAL_SUPERVISOR and TEAM_SUPERVISOR) in the filter
      return 'TEAM_SUPERVISOR'; // API doesn't support combined filter, will do client-side
    case 'WORKER':
      return 'WORKER';
    default:
      return undefined;
  }
}

const AgentManagement: React.FC<AgentManagementProps> = ({
    onManagePrompts,
    onManageModels,
    onManageTools
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPERVISOR' | 'WORKER'>('ALL');
  const [viewingAgent, setViewingAgent] = useState<AgentWithApiFields | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<AgentWithApiFields | null>(null);
  const [auditAgent, setAuditAgent] = useState<AgentWithApiFields | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Edit mode state for viewing agent modal
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Use the API hook for fetching agents
  const {
    agents,
    loading,
    error,
    page: currentPage,
    totalPages,
    total,
    roleFilter: apiRoleFilter,
    keyword,
    setPage: setCurrentPage,
    setRoleFilter: setApiRoleFilter,
    setKeyword,
    refresh,
    handleCreate,
    handleUpdate,
    handleDelete,
    creating,
    updating,
    deleting,
  } = useAgents({
    page: 1,
    size: ITEMS_PER_PAGE,
    // API filters will be applied via the hook
    role: roleFilter === 'ALL' ? undefined : roleFilter === 'WORKER' ? 'WORKER' : undefined,
    keyword: searchTerm.trim() || undefined,
  });

  // Handle role filter change - update API filter and reset page
  const handleRoleFilterChange = (newFilter: 'ALL' | 'SUPERVISOR' | 'WORKER') => {
    setRoleFilter(newFilter);
    // For supervisor filter, we need client-side filtering since API doesn't support combined role filter
    if (newFilter === 'WORKER') {
      setApiRoleFilter('WORKER');
    } else {
      setApiRoleFilter(undefined);
    }
    setCurrentPage(1);
  };

  // Handle search term change with debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setKeyword(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, setKeyword]);

  // Client-side filter for supervisor types (since API can't combine GLOBAL_SUPERVISOR and TEAM_SUPERVISOR)
  const filteredAgents = useMemo(() => {
    if (roleFilter === 'SUPERVISOR') {
      return agents.filter(agent =>
        agent.role === AgentRole.TEAM_SUPERVISOR || agent.role === AgentRole.GLOBAL_SUPERVISOR
      );
    }
    return agents;
  }, [agents, roleFilter]);

  const paginatedAgents = filteredAgents;

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.THINKING: return "text-cyan-400 bg-cyan-950/40 border-cyan-500/30";
      case AgentStatus.WORKING: return "text-green-400 bg-green-950/40 border-green-500/30";
      case AgentStatus.ERROR: return "text-red-400 bg-red-950/40 border-red-500/30";
      case AgentStatus.WAITING: return "text-yellow-400 bg-yellow-950/40 border-yellow-500/30";
      default: return "text-slate-400 bg-slate-900 border-slate-800";
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Users className="text-cyan-400" /> Agents Registry
                    {loading && <Loader2 size={18} className="animate-spin text-slate-500" />}
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-medium">Monitoring and managing {total} autonomous operation units across the cluster.</p>
            </div>
            <div className="flex gap-2">
                 <button onClick={onManagePrompts} className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs font-bold text-slate-300 hover:text-white transition-colors">
                     <FileText size={14} /> Prompts
                 </button>
                 <button onClick={onManageModels} className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs font-bold text-slate-300 hover:text-white transition-colors">
                     <Cpu size={14} /> Models
                 </button>
                 <button onClick={onManageTools} className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs font-bold text-slate-300 hover:text-white transition-colors">
                     <Wrench size={14} /> Tools
                 </button>
                 <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-colors shadow-lg shadow-cyan-900/20">
                     <Plus size={14} /> New Agent
                 </button>
            </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 shrink-0">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search system units..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/60 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200 transition-all"
                    />
                </div>
                <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800">
                    {[{key: 'ALL', label: 'All'}, {key: 'SUPERVISOR', label: 'Supervisor'}, {key: 'WORKER', label: 'Worker'}].map(({key, label}) => (
                        <button
                            key={key}
                            onClick={() => handleRoleFilterChange(key as 'ALL' | 'SUPERVISOR' | 'WORKER')}
                            className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${roleFilter === key ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-cyan-400 transition-all disabled:opacity-50"
                    title="Refresh agent list"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
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

        {/* Error Banner */}
        {error && (
            <div className="mb-4 p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center gap-3 shrink-0">
                <AlertCircle size={18} className="text-red-400 shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
                <button
                    onClick={refresh}
                    className="ml-auto px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded text-xs font-bold transition-colors"
                >
                    Retry
                </button>
            </div>
        )}

        {/* Agents Grid - Redesigned Cards */}
        <div className="flex-1 overflow-auto custom-scrollbar">
            {paginatedAgents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6 auto-rows-fr">
                    {paginatedAgents.map(agent => {
                        const isSupervisor = agent.role === AgentRole.TEAM_SUPERVISOR || agent.role === AgentRole.GLOBAL_SUPERVISOR;
                        const roleLabel = agent.role === AgentRole.GLOBAL_SUPERVISOR ? 'Global Orchestrator' :
                                         agent.role === AgentRole.TEAM_SUPERVISOR ? 'Strategic Coordinator' :
                                         agent.role === AgentRole.SCOUTER ? 'Discovery Unit' : 'Tactical Unit';
                        const teamCount = agent.teamIds?.length || 0;

                        return (
                            <div key={agent.id} className="relative bg-slate-900 border border-slate-800/80 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all group flex flex-col min-h-[220px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-950/10">
                                {/* Decorative Top Line */}
                                <div className={`h-1 w-full ${isSupervisor ? 'bg-indigo-600' : 'bg-cyan-600'} opacity-30 group-hover:opacity-100 transition-opacity`}></div>

                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                            <div className={`p-2 rounded-lg shrink-0 ${isSupervisor ? 'bg-indigo-950/30 text-indigo-400 border border-indigo-500/20' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>
                                                {isSupervisor ? <Shield size={20} /> : <Zap size={20} />}
                                            </div>
                                            <div className="min-w-0 overflow-hidden">
                                                <h3 className="text-base font-bold text-white mb-0.5 truncate group-hover:text-cyan-400 transition-colors leading-tight" title={agent.name}>{agent.name}</h3>
                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] opacity-80">
                                                    {roleLabel}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-wider shrink-0 ${getStatusColor(agent.status)}`}>
                                            {agent.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2.5 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                                                <Target size={12} className="text-slate-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] text-slate-500 leading-none mb-1">Expertise</div>
                                                <div className="text-xs text-slate-200 font-bold truncate">{agent.specialty || 'Generalist'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                                                <Layers size={12} className="text-slate-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] text-slate-500 leading-none mb-1">Teams</div>
                                                <div className="text-xs text-slate-300 truncate font-medium">
                                                    {teamCount > 0 ? `${teamCount} team${teamCount > 1 ? 's' : ''}` : 'Unassigned'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-slate-800/40 flex justify-between items-center shrink-0">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setViewingAgent(agent)} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="View Intelligence Profile"><Eye size={15} /></button>
                                            <button onClick={() => navigate(paths.agentConfig(agent.id))} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="Modify Protocol"><Settings size={15} /></button>
                                            {agent.role === AgentRole.WORKER && (
                                                <button onClick={() => setAgentToDelete(agent)} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-red-400 transition-all" title="Decommission"><Trash2 size={15} /></button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setAuditAgent(agent)}
                                            className="px-2.5 py-1 rounded bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold transition-all flex items-center gap-1.5"
                                        >
                                            Trace log <ArrowUpRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
                    <Users size={48} className="opacity-10 mb-4" />
                    <p className="text-sm font-bold tracking-wide">No neural units match the current filter.</p>
                </div>
            )}
        </div>

        {/* Audit Modal */}
        {auditAgent && <AgentAuditModal agent={auditAgent} onClose={() => setAuditAgent(null)} />}

        {viewingAgent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-t-4 border-t-cyan-600">
                    <div className="p-5 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest"><Sparkles size={16} className="text-cyan-400" /> Unit intelligence profile</h3>
                        <div className="flex items-center gap-2">
                            {!isEditingAgent && (
                                <button
                                    onClick={() => {
                                        setIsEditingAgent(true);
                                        setEditName(viewingAgent.name);
                                        setEditSpecialty(viewingAgent.specialty || '');
                                        setEditError(null);
                                    }}
                                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-cyan-400 transition-all"
                                    title="Edit basic info"
                                >
                                    <Pencil size={16} />
                                </button>
                            )}
                            <button onClick={() => { setViewingAgent(null); setIsEditingAgent(false); setEditError(null); }} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                        </div>
                    </div>
                    <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* Edit Error Banner */}
                        {editError && (
                            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-2">
                                <AlertCircle size={14} className="text-red-400 shrink-0" />
                                <span className="text-xs text-red-300">{editError}</span>
                            </div>
                        )}

                        {/* Agent Identity */}
                        <div className="flex items-center gap-5 p-5 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner">
                             <div className="p-4 bg-indigo-950/40 rounded-2xl text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-950/50"><Bot size={36} /></div>
                             <div className="min-w-0 flex-1">
                                 {isEditingAgent ? (
                                     <div className="space-y-3">
                                         <div>
                                             <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Name</label>
                                             <input
                                                 type="text"
                                                 value={editName}
                                                 onChange={(e) => setEditName(e.target.value)}
                                                 className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                                                 placeholder="Agent name"
                                                 disabled={updating}
                                             />
                                         </div>
                                         <div>
                                             <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Specialty</label>
                                             <input
                                                 type="text"
                                                 value={editSpecialty}
                                                 onChange={(e) => setEditSpecialty(e.target.value)}
                                                 className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                                                 placeholder="Agent specialty"
                                                 disabled={updating}
                                             />
                                         </div>
                                     </div>
                                 ) : (
                                     <>
                                         <div className="text-xl font-black text-white truncate">{viewingAgent.name}</div>
                                         <div className="text-[10px] text-indigo-400 font-mono font-bold tracking-widest uppercase mt-1">{viewingAgent.role}</div>
                                         {viewingAgent.specialty && (
                                             <div className="text-xs text-slate-400 mt-1 truncate">{viewingAgent.specialty}</div>
                                         )}
                                     </>
                                 )}
                             </div>
                        </div>

                        {/* Findings Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-yellow-950/20 p-4 rounded-xl border border-yellow-900/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle size={14} className="text-yellow-500" />
                                    <span className="text-[9px] text-yellow-500/80 font-bold uppercase">Warnings</span>
                                </div>
                                <div className="text-2xl font-black text-yellow-400">{viewingAgent.findings?.warnings || 0}</div>
                            </div>
                            <div className="bg-red-950/20 p-4 rounded-xl border border-red-900/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertOctagon size={14} className="text-red-500" />
                                    <span className="text-[9px] text-red-500/80 font-bold uppercase">Critical</span>
                                </div>
                                <div className="text-2xl font-black text-red-400">{viewingAgent.findings?.critical || 0}</div>
                            </div>
                        </div>

                        {/* Team Assignments */}
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800">
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Layers size={12} /> Team Assignments
                            </div>
                            <div className="text-sm text-slate-300">
                                {viewingAgent.teamIds && viewingAgent.teamIds.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {viewingAgent.teamIds.map((teamId) => (
                                            <span key={teamId} className="px-2 py-1 bg-slate-800 rounded text-xs font-mono">
                                                Team #{teamId}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-slate-500 italic">No team assignments</span>
                                )}
                            </div>
                        </div>

                        {/* System Instruction */}
                        <div className="p-5 bg-slate-950/40 rounded-xl border border-slate-800">
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3 flex items-center gap-2"><Terminal size={12} /> Autonomous directive</div>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 whitespace-pre-wrap">
                                {viewingAgent.config?.systemInstruction || 'Standard autonomous protocol. Operates within defined mission constraints with minimal supervision.'}
                            </p>
                        </div>

                        {/* Configuration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                                <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Model</div>
                                <div className="text-xs text-white font-mono">{viewingAgent.config?.model || 'Not configured'}</div>
                            </div>
                            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                                <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Temperature</div>
                                <div className="text-xs text-white font-mono">{viewingAgent.config?.temperature ?? 'Default'}</div>
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="grid grid-cols-2 gap-4 text-[10px]">
                            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                                <div className="text-slate-500 font-bold uppercase mb-1">Created</div>
                                <div className="text-slate-400 font-mono">
                                    {viewingAgent.createdAt ? new Date(viewingAgent.createdAt).toLocaleString() : 'N/A'}
                                </div>
                            </div>
                            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                                <div className="text-slate-500 font-bold uppercase mb-1">Updated</div>
                                <div className="text-slate-400 font-mono">
                                    {viewingAgent.updatedAt ? new Date(viewingAgent.updatedAt).toLocaleString() : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3">
                        {isEditingAgent ? (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEditingAgent(false);
                                        setEditError(null);
                                    }}
                                    disabled={updating}
                                    className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!editName.trim()) {
                                            setEditError('Agent name is required');
                                            return;
                                        }
                                        setEditError(null);
                                        const success = await handleUpdate(viewingAgent.id, editName.trim(), editSpecialty.trim() || undefined);
                                        if (success) {
                                            setIsEditingAgent(false);
                                            setViewingAgent(null);
                                        } else {
                                            setEditError(error || 'Failed to update agent');
                                        }
                                    }}
                                    disabled={updating || !editName.trim()}
                                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black tracking-widest rounded-lg transition-colors shadow-lg shadow-cyan-900/20 flex items-center gap-2"
                                >
                                    {updating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => { setViewingAgent(null); setIsEditingAgent(false); }} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black tracking-widest rounded-lg transition-colors">Close portal</button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {agentToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                    <div className="flex justify-center mb-4 text-red-500">
                        <div className="p-4 bg-red-950/20 rounded-full border border-red-900/30">
                            <AlertTriangle size={32} />
                        </div>
                    </div>
                    <h3 className="font-bold text-xl text-white mb-2 tracking-tight">Decommission Unit?</h3>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">This action will permanently purge <span className="text-white font-black underline decoration-red-500/50">{agentToDelete.name}</span> from the neural network fabric.</p>
                    {deleteError && (
                        <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-300 text-left">
                            {deleteError}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { setAgentToDelete(null); setDeleteError(null); }}
                            disabled={deleting}
                            className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors disabled:opacity-50"
                        >
                            Abort purge
                        </button>
                        <button
                            onClick={async () => {
                                setDeleteError(null);
                                const success = await handleDelete(agentToDelete.id);
                                if (success) {
                                    setAgentToDelete(null);
                                } else {
                                    setDeleteError(error || 'Failed to delete agent');
                                }
                            }}
                            disabled={deleting}
                            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black tracking-widest shadow-lg shadow-red-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                            {deleting ? 'Deleting...' : 'Confirm purge'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Add Agent Modal */}
        {showAddModal && (
            <AddAgentModal
                onClose={() => setShowAddModal(false)}
                onAdd={async (agent) => {
                    const created = await handleCreate(agent.name, agent.specialty);
                    if (created) {
                        setShowAddModal(false);
                    }
                }}
                saving={creating}
                error={error}
            />
        )}

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
            <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
            >
                <ChevronLeft size={14} /> Prev
            </button>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 tracking-widest">Registry segment</span>
                <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{currentPage}</span>
                <span className="text-[10px] text-slate-500 font-bold">/</span>
                <span className="text-xs text-slate-400 font-mono font-bold">{Math.max(1, totalPages)}</span>
            </div>
            <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages || totalPages === 0} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
            >
                Next <ChevronRight size={14} />
            </button>
        </div>
    </div>
  );
};

// Add Agent Modal Component
const AddAgentModal: React.FC<{
    onClose: () => void;
    onAdd: (agent: { name: string; specialty: string }) => Promise<void>;
    saving?: boolean;
    error?: string | null;
}> = ({ onClose, onAdd, saving = false, error }) => {
    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setLocalError('Agent name is required');
            return;
        }
        setLocalError(null);
        await onAdd({
            name: name.trim(),
            specialty: specialty.trim() || 'General Operations'
        });
    };

    const isValid = name.trim();
    const displayError = localError || error;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-t-cyan-600">
                <div className="p-5 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                        <Plus size={16} className="text-cyan-400" /> Deploy New Agent
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        {/* Error Message */}
                        {displayError && (
                            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-2">
                                <AlertCircle size={14} className="text-red-400 shrink-0" />
                                <span className="text-xs text-red-300">{displayError}</span>
                            </div>
                        )}

                        {/* Agent Name */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                Agent Designation
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => { setName(e.target.value); setLocalError(null); }}
                                placeholder="e.g., Diagnostic Worker Alpha"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                autoFocus
                                disabled={saving}
                            />
                        </div>

                        {/* Specialty */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                Operational Expertise
                            </label>
                            <input
                                type="text"
                                value={specialty}
                                onChange={(e) => setSpecialty(e.target.value)}
                                placeholder="e.g., Network Analysis, Security Audit"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                disabled={saving}
                            />
                            <p className="text-[10px] text-slate-600 mt-2">
                                Optional. Defines the agent's area of specialization.
                            </p>
                        </div>
                    </div>

                    <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isValid || saving}
                            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-lg transition-colors shadow-lg shadow-cyan-900/20 flex items-center gap-2"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            {saving ? 'Deploying...' : 'Deploy Agent'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// AgentAuditModal - using AgentWithApiFields now
const AgentAuditModal: React.FC<{ agent: AgentWithApiFields, onClose: () => void }> = ({ agent, onClose }) => {
    const [selectedRecord, setSelectedRecord] = useState<AgentExecutionRecord | null>(null);
    const history = useMemo(() => generateMockHistory(agent.id), [agent.id]);
    const teamCount = agent.teamIds?.length || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 lg:p-8 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl text-indigo-400 shadow-lg shadow-indigo-950/50">
                            <History size={26} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                <span className="text-indigo-400 opacity-70">AGENT TRACE:</span> {agent.name}
                            </h3>
                            <div className="text-[10px] text-slate-500 flex items-center gap-3 mt-1 font-bold uppercase tracking-[0.2em]">
                                <span>SEGMENT ID: {agent.id}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                <span>TEAMS: {teamCount > 0 ? teamCount : 'Unassigned'}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all bg-slate-950/50 border border-slate-800"><X size={24} /></button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className={`w-full md:w-[320px] border-r border-slate-800 bg-slate-950/30 flex flex-col shrink-0 transition-all ${selectedRecord ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-slate-800 bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
                            Transmission Log
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
                            {history.map(record => (
                                <button 
                                    key={record.id}
                                    onClick={() => setSelectedRecord(record)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all group relative overflow-hidden ${selectedRecord?.id === record.id ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-900/20' : 'bg-slate-950/50 border-slate-800/60 hover:border-indigo-500/40 hover:bg-slate-900/50'}`}
                                >
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'Success' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : record.status === 'Warning' ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${selectedRecord?.id === record.id ? 'text-white' : 'text-slate-500'}`}>{record.status}</span>
                                        </div>
                                        <span className={`text-[9px] font-mono font-bold ${selectedRecord?.id === record.id ? 'text-indigo-200' : 'text-slate-600'}`}>{new Date(record.startTime).toLocaleDateString()}</span>
                                    </div>
                                    <div className={`text-xs font-bold mb-1 truncate relative z-10 ${selectedRecord?.id === record.id ? 'text-white' : 'text-slate-200'}`}>Target: {record.resourceLabel}</div>
                                    <div className={`text-[10px] line-clamp-1 italic font-medium relative z-10 ${selectedRecord?.id === record.id ? 'text-indigo-100' : 'text-slate-500'}`}>"{record.summary}"</div>
                                    <div className="mt-3 flex items-center justify-between relative z-10">
                                        <div className={`flex items-center gap-1.5 text-[9px] font-bold ${selectedRecord?.id === record.id ? 'text-indigo-100' : 'text-slate-600'}`}>
                                            <Clock size={10} /> {(record.duration / 1000).toFixed(1)}s
                                        </div>
                                        <ArrowRight size={14} className={selectedRecord?.id === record.id ? 'text-white translate-x-0 opacity-100' : 'text-slate-700 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0'} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
                        {selectedRecord ? (
                            <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                                <div className="p-7 border-b border-slate-800 bg-slate-900/40 shrink-0">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                        <div>
                                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Protocol Result Summary</div>
                                            <h4 className="text-2xl font-black text-white leading-tight">{selectedRecord.summary}</h4>
                                        </div>
                                        <div className="flex gap-4 shrink-0">
                                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Time to complete</div>
                                                <div className="text-sm text-white font-mono font-bold tracking-tighter">{(selectedRecord.duration / 1000).toFixed(2)} SEC</div>
                                            </div>
                                            {selectedRecord && (
                                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                    <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Status</div>
                                                    <div className={`text-sm font-black uppercase tracking-wider ${selectedRecord.status === 'Success' ? 'text-green-400' : 'text-yellow-400'}`}>{selectedRecord.status}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[radial-gradient(circle_at_top_right,#0f172a,transparent)]">
                                    {selectedRecord.steps.map((step, idx) => (
                                        <div key={step.id} className="flex gap-6 group">
                                            <div className="flex flex-col items-center shrink-0">
                                                <div className={`p-3 rounded-xl border-2 shadow-lg transition-all ${
                                                    step.type === 'thought' ? 'bg-purple-950/20 border-purple-500/20 text-purple-400 shadow-purple-950/20' :
                                                    step.type === 'action' ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400 shadow-cyan-950/20' :
                                                    'bg-blue-950/20 border-blue-500/20 text-blue-400 shadow-blue-950/20'
                                                }`}>
                                                    {step.type === 'thought' ? <Brain size={18} /> : step.type === 'action' ? <Terminal size={18} /> : <Eye size={18} />}
                                                </div>
                                                {idx < selectedRecord.steps.length - 1 && <div className="w-0.5 flex-1 bg-slate-800 my-3"></div>}
                                            </div>
                                            <div className="flex-1 pb-10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                                        step.type === 'thought' ? 'text-purple-400' : step.type === 'action' ? 'text-cyan-400' : 'text-blue-400'
                                                    }`}>{step.type}</span>
                                                    <span className="text-[10px] text-slate-600 font-mono font-bold tracking-tight">{new Date(step.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-sans shadow-inner backdrop-blur-sm group-hover:bg-slate-900 transition-colors">
                                                    {step.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-800">
                                <History size={80} className="mb-6 opacity-10" />
                                <p className="text-sm font-black uppercase tracking-[0.4em] opacity-40">Awaiting Log Selection</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentManagement;
