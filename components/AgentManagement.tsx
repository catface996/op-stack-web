
import React, { useState, useMemo } from 'react';
import { Team, Agent, AgentRole, AgentStatus, AgentConfig, AgentExecutionRecord, TraceStep } from '../types';
import { AgentConfigModal } from './AgentConfigModal';
import { generateMockHistory } from '../services/mockData';
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
  CheckCircle2
} from 'lucide-react';

interface AgentManagementProps {
  teams: Team[];
  onUpdateAgentConfig: (teamId: string, agentId: string, config: AgentConfig) => void;
  onDeleteAgent: (teamId: string, agentId: string) => void;
  onManagePrompts: () => void;
  onManageModels: () => void;
  onManageTools: () => void;
}

const ITEMS_PER_PAGE = 12;

interface FlatAgent extends Agent {
    teamId: string;
    teamName: string;
    resourceId: string;
}

const AgentManagement: React.FC<AgentManagementProps> = ({ 
    teams, 
    onUpdateAgentConfig,
    onDeleteAgent,
    onManagePrompts,
    onManageModels,
    onManageTools
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card'); 
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPERVISOR' | 'WORKER'>('ALL');
  const [configAgent, setConfigAgent] = useState<FlatAgent | null>(null);
  const [viewingAgent, setViewingAgent] = useState<FlatAgent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<FlatAgent | null>(null);
  const [auditAgent, setAuditAgent] = useState<FlatAgent | null>(null);

  const allAgents: FlatAgent[] = useMemo(() => {
    return teams.flatMap(team => [
        { ...team.supervisor, teamId: team.id, teamName: team.name, resourceId: team.resourceId },
        ...team.members.map(member => ({ ...member, teamId: team.id, teamName: team.name, resourceId: team.resourceId }))
    ]);
  }, [teams]);

  const filteredAgents = useMemo(() => {
      return allAgents.filter(agent => {
          const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (agent.specialty || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                              agent.teamName.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesRole = roleFilter === 'ALL' ? true : 
                            roleFilter === 'SUPERVISOR' ? agent.role === AgentRole.TEAM_SUPERVISOR : 
                            agent.role === AgentRole.WORKER;
          return matchesSearch && matchesRole;
      });
  }, [allAgents, searchTerm, roleFilter]);

  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE);
  const paginatedAgents = filteredAgents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.THINKING: return "text-cyan-400 bg-cyan-950/30 border-cyan-800";
      case AgentStatus.WORKING: return "text-green-400 bg-green-950/30 border-green-800";
      case AgentStatus.ERROR: return "text-red-500 bg-red-950/30 border-red-800";
      case AgentStatus.WAITING: return "text-yellow-500 bg-yellow-950/30 border-yellow-800";
      default: return "text-slate-500 bg-slate-900 border-slate-800";
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Users className="text-cyan-400" /> Agents Registry
                </h2>
                <p className="text-slate-400 text-sm mt-1">Manage hierarchical supervisor and specialized worker units.</p>
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
            </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-4 gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800 shrink-0">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search agents..." 
                        value={searchTerm} 
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                        className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-slate-200" 
                    />
                </div>
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700">
                    {['ALL', 'SUPERVISOR', 'WORKER'].map(role => (
                        <button 
                            key={role} 
                            onClick={() => { setRoleFilter(role as any); setCurrentPage(1); }} 
                            className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${roleFilter === role ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                        <LayoutList size={16} />
                    </button>
                    <button onClick={() => setViewMode('card')} className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                        <LayoutGrid size={16} />
                    </button>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                    <span className="text-white font-bold">{paginatedAgents.length}</span> / {filteredAgents.length}
                </div>
            </div>
        </div>

        {/* Agents Grid */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
            {paginatedAgents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                    {paginatedAgents.map(agent => (
                        <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all group flex flex-col h-[280px] relative overflow-hidden shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2.5 rounded-xl border ${agent.role === AgentRole.TEAM_SUPERVISOR ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/30' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                                    {agent.role === AgentRole.TEAM_SUPERVISOR ? <Shield size={24} /> : <Zap size={24} />}
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusColor(agent.status)}`}>
                                    {agent.status}
                                </span>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-base font-bold text-white mb-0.5 truncate group-hover:text-cyan-400 transition-colors">{agent.name}</h3>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{agent.role === AgentRole.TEAM_SUPERVISOR ? 'Team Supervisor' : 'Specialized Worker'}</div>
                            </div>

                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 text-xs">
                                    <Target size={14} className="text-slate-600 shrink-0" />
                                    <span className="text-slate-500">Expertise:</span>
                                    <span className="text-slate-200 font-bold truncate">{agent.specialty || 'Coordination'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <Server size={14} className="text-slate-600 shrink-0" />
                                    <span className="text-slate-500">Team:</span>
                                    <span className="text-slate-300 truncate">{agent.teamName}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setViewingAgent(agent)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="View Profile"><Eye size={14} /></button>
                                    <button onClick={() => setConfigAgent(agent)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="Configure"><Settings size={14} /></button>
                                    {agent.role === AgentRole.WORKER && (
                                        <button onClick={() => setAgentToDelete(agent)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-all" title="Delete"><Trash2 size={14} /></button>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setAuditAgent(agent)}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 group-hover:text-indigo-400 transition-colors uppercase tracking-widest"
                                >
                                    Trace <ArrowUpRight size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
                    <Users size={48} className="opacity-20 mb-4" />
                    <p>No agent operational units found.</p>
                </div>
            )}
        </div>

        {/* Execution History Modal (The TRACE target) */}
        {auditAgent && (
            <AgentAuditModal 
                agent={auditAgent} 
                onClose={() => setAuditAgent(null)} 
            />
        )}

        {/* Config Modal */}
        {configAgent && (
            <AgentConfigModal 
                agent={configAgent} 
                onClose={() => setConfigAgent(null)} 
                onSave={(newConfig) => {
                    onUpdateAgentConfig(configAgent.teamId, configAgent.id, newConfig);
                    setConfigAgent(null);
                }} 
            />
        )}

        {/* View Profile Modal */}
        {viewingAgent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2"><Eye size={18} className="text-cyan-400" /> Agent Intelligence Profile</h3>
                        <button onClick={() => setViewingAgent(null)} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                             <div className="p-3 bg-indigo-950/30 rounded-xl text-indigo-400 border border-indigo-500/20"><Bot size={32} /></div>
                             <div>
                                 <div className="text-lg font-bold text-white">{viewingAgent.name}</div>
                                 <div className="text-xs text-slate-500 font-mono uppercase tracking-tighter">{viewingAgent.role}</div>
                             </div>
                        </div>
                        <div className="p-4 bg-slate-950/30 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase mb-2">Core Directives</div>
                            <p className="text-xs text-slate-400 leading-relaxed italic">"{viewingAgent.config?.systemInstruction || 'Standard autonomous protocol.'}"</p>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
                        <button onClick={() => setViewingAgent(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded font-bold transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Confirmation */}
        {agentToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
                    <div className="flex items-center gap-3 mb-4 text-red-500">
                        <AlertTriangle size={24} />
                        <h3 className="font-bold text-lg text-white">Decommission Agent?</h3>
                    </div>
                    <p className="text-slate-400 text-sm mb-6">Are you sure you want to remove <span className="text-white font-bold">{agentToDelete.name}</span> from the fleet?</p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setAgentToDelete(null)} className="px-4 py-2 rounded text-slate-300 hover:bg-slate-800 text-sm">Cancel</button>
                        <button onClick={() => { onDeleteAgent(agentToDelete.teamId, agentToDelete.id); setAgentToDelete(null); }} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-bold">Confirm Delete</button>
                    </div>
                </div>
            </div>
        )}

        {/* Pagination */}
        <div className="mt-4 flex justify-center items-center gap-4 pt-2 border-t border-slate-900 shrink-0">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-sm text-slate-400">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{Math.max(1, totalPages)}</span></span>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"><ChevronRight size={16} /></button>
        </div>
    </div>
  );
};

/**
 * AgentAuditModal: 实现 TRACE 溯源功能
 * 展示 Agent 的历史执行记录，并能点击查看详细分析过程。
 */
const AgentAuditModal: React.FC<{ agent: FlatAgent, onClose: () => void }> = ({ agent, onClose }) => {
    const [selectedRecord, setSelectedRecord] = useState<AgentExecutionRecord | null>(null);
    const history = useMemo(() => generateMockHistory(agent.id), [agent.id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-indigo-400">
                            <History size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                <span className="text-indigo-400">Trace:</span> {agent.name}
                            </h3>
                            <div className="text-xs text-slate-500 flex items-center gap-3 mt-1 font-mono uppercase tracking-widest">
                                <span>Agent ID: {agent.id}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                <span>Team: {agent.teamName}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all"><X size={24} /></button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: List of Records */}
                    <div className={`w-full md:w-1/3 border-r border-slate-800 bg-slate-900/50 flex flex-col transition-all ${selectedRecord ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-slate-800 bg-slate-950/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Execution Timeline
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                            {history.map(record => (
                                <button 
                                    key={record.id}
                                    onClick={() => setSelectedRecord(record)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all group ${selectedRecord?.id === record.id ? 'bg-indigo-600 border-indigo-500 shadow-lg' : 'bg-slate-950 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${record.status === 'Success' ? 'bg-green-500' : record.status === 'Warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                            <span className={`text-[10px] font-bold uppercase ${selectedRecord?.id === record.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{record.status}</span>
                                        </div>
                                        <span className={`text-[10px] font-mono ${selectedRecord?.id === record.id ? 'text-indigo-200' : 'text-slate-600'}`}>{new Date(record.startTime).toLocaleDateString()}</span>
                                    </div>
                                    <div className={`text-sm font-bold mb-1 truncate ${selectedRecord?.id === record.id ? 'text-white' : 'text-slate-200'}`}>Target: {record.resourceLabel}</div>
                                    <div className={`text-[10px] line-clamp-1 italic ${selectedRecord?.id === record.id ? 'text-indigo-100' : 'text-slate-500'}`}>"{record.summary}"</div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <div className={`flex items-center gap-1 text-[10px] ${selectedRecord?.id === record.id ? 'text-indigo-200' : 'text-slate-600'}`}>
                                            <Clock size={10} /> {(record.duration / 1000).toFixed(1)}s
                                        </div>
                                        <ArrowRight size={14} className={selectedRecord?.id === record.id ? 'text-white' : 'text-slate-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all'} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Trace Details */}
                    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
                        {selectedRecord ? (
                            <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                                <div className="p-6 border-b border-slate-800 bg-slate-900/30 shrink-0">
                                    <div className="flex items-center gap-2 md:hidden mb-4">
                                        <button onClick={() => setSelectedRecord(null)} className="p-1 text-slate-500 hover:text-white"><ChevronLeft size={20} /></button>
                                        <span className="text-sm font-bold">Execution Details</span>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Execution Summary</div>
                                            <h4 className="text-xl font-bold text-white">{selectedRecord.summary}</h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center min-w-[80px]">
                                                <div className="text-[9px] text-slate-500 uppercase">Duration</div>
                                                <div className="text-xs font-mono font-bold text-cyan-400">{(selectedRecord.duration / 1000).toFixed(2)}s</div>
                                            </div>
                                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center min-w-[80px]">
                                                <div className="text-[9px] text-slate-500 uppercase">Steps</div>
                                                <div className="text-xs font-mono font-bold text-indigo-400">{selectedRecord.steps.length}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                    {selectedRecord.steps.map((step, idx) => (
                                        <div key={step.id} className="flex gap-4 group">
                                            <div className="flex flex-col items-center shrink-0">
                                                <div className={`p-2 rounded-lg border ${
                                                    step.type === 'thought' ? 'bg-purple-950/30 border-purple-500/30 text-purple-400' :
                                                    step.type === 'action' ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400' :
                                                    step.type === 'observation' ? 'bg-blue-950/30 border-blue-500/30 text-blue-400' :
                                                    'bg-green-950/30 border-green-500/30 text-green-400'
                                                }`}>
                                                    {step.type === 'thought' ? <Brain size={16} /> :
                                                     step.type === 'action' ? <Terminal size={16} /> :
                                                     step.type === 'observation' ? <Eye size={16} /> :
                                                     <CheckCircle2 size={16} />}
                                                </div>
                                                {idx < selectedRecord.steps.length - 1 && (
                                                    <div className="w-px flex-1 bg-slate-800 my-2"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 pb-8">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                                         step.type === 'thought' ? 'text-purple-400' :
                                                         step.type === 'action' ? 'text-cyan-400' :
                                                         step.type === 'observation' ? 'text-blue-400' :
                                                         'text-green-400'
                                                    }`}>{step.type}</span>
                                                    <span className="text-[10px] text-slate-600 font-mono">{new Date(step.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-sm text-slate-300 leading-relaxed font-sans shadow-inner group-hover:border-slate-700 transition-colors">
                                                    {step.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                                <History size={64} className="opacity-10 mb-4" />
                                <p className="text-lg font-bold opacity-30">Select a record to view detailed trace</p>
                                <p className="text-sm opacity-20 mt-1">Full step-by-step reasoning & tool execution analysis</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentManagement;
