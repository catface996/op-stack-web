
import React, { useState, useMemo } from 'react';
import { Team, Agent, AgentRole, AgentStatus, AgentConfig } from '../types';
import { AgentConfigModal } from './AgentConfigModal';
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
  CheckCircle2,
  FileText,
  Wrench
} from 'lucide-react';

interface AgentManagementProps {
  teams: Team[];
  onUpdateAgentConfig: (teamId: string, agentId: string, config: AgentConfig) => void;
  onManagePrompts: () => void;
  onManageModels: () => void;
  onManageTools: () => void;
}

const ITEMS_PER_PAGE = 10;

// Flattened Agent Interface for Table/Grid
interface FlatAgent extends Agent {
    teamId: string;
    teamName: string;
    resourceId: string;
}

const AgentManagement: React.FC<AgentManagementProps> = ({ 
    teams, 
    onUpdateAgentConfig,
    onManagePrompts,
    onManageModels,
    onManageTools
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPERVISOR' | 'WORKER'>('ALL');

  // Config Modal State
  const [configAgent, setConfigAgent] = useState<FlatAgent | null>(null);

  // Flatten Teams to Agent List
  const allAgents: FlatAgent[] = useMemo(() => {
    return teams.flatMap(team => [
        { ...team.supervisor, teamId: team.id, teamName: team.name, resourceId: team.resourceId },
        ...team.members.map(member => ({ ...member, teamId: team.id, teamName: team.name, resourceId: team.resourceId }))
    ]);
  }, [teams]);

  // Filtering Logic
  const filteredAgents = useMemo(() => {
      return allAgents.filter(agent => {
          const matchesSearch = 
              agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              agent.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              agent.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              agent.id.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesRole = 
              roleFilter === 'ALL' ? true :
              roleFilter === 'SUPERVISOR' ? agent.role === AgentRole.TEAM_SUPERVISOR :
              agent.role === AgentRole.WORKER;

          return matchesSearch && matchesRole;
      });
  }, [allAgents, searchTerm, roleFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE);
  const paginatedAgents = filteredAgents.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1);
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.IDLE: return "text-slate-500 bg-slate-900 border-slate-800";
      case AgentStatus.THINKING: return "text-cyan-400 bg-cyan-950/30 border-cyan-900";
      case AgentStatus.WORKING: return "text-green-400 bg-green-950/30 border-green-900";
      case AgentStatus.COMPLETED: return "text-slate-300 bg-slate-800 border-slate-700";
      case AgentStatus.WAITING: return "text-yellow-500 bg-yellow-950/30 border-yellow-900";
      case AgentStatus.ERROR: return "text-red-500 bg-red-950/30 border-red-900";
      default: return "text-slate-500";
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Users className="text-cyan-400" /> Agent Registry
                </h2>
                <p className="text-slate-400 text-sm mt-1">Monitor and configure all system agents across teams.</p>
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
                        onChange={handleSearch}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-slate-200"
                    />
                </div>
                
                {/* Role Filter */}
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700">
                    {['ALL', 'SUPERVISOR', 'WORKER'].map(role => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role as any)}
                            className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${roleFilter === role ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                {/* View Mode */}
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        title="List View"
                    >
                        <LayoutList size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('card')}
                        className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Card View"
                    >
                        <LayoutGrid size={16} />
                    </button>
                </div>
                
                <div className="text-xs text-slate-500 font-mono">
                    <span className="text-white font-bold">{paginatedAgents.length}</span> / {filteredAgents.length}
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-900/30 border border-slate-800 rounded-lg shadow-inner custom-scrollbar relative">
            {paginatedAgents.length > 0 ? (
                viewMode === 'list' ? (
                    // List View
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Agent Name</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Role & Team</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Status</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Model Config</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-900">
                            {paginatedAgents.map(agent => (
                                <tr key={agent.id} className="hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg ${agent.role === AgentRole.TEAM_SUPERVISOR ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-500/30' : 'bg-slate-950 text-slate-400 border border-slate-700'}`}>
                                                {agent.role === AgentRole.TEAM_SUPERVISOR ? <Bot size={16} /> : <Cpu size={16} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-200">{agent.name}</div>
                                                <div className="text-[10px] text-slate-500 font-mono">{agent.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="text-xs">
                                            <div className="font-bold text-slate-300 mb-0.5">{agent.role === AgentRole.TEAM_SUPERVISOR ? 'Supervisor' : agent.specialty || 'Worker'}</div>
                                            <div className="flex items-center gap-1 text-slate-500">
                                                <Server size={10} /> {agent.teamName}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(agent.status)}`}>
                                            {agent.status}
                                        </span>
                                        {(agent.findings.warnings > 0 || agent.findings.critical > 0) && (
                                            <div className="flex gap-1 mt-1">
                                                {agent.findings.critical > 0 && <AlertOctagon size={12} className="text-red-500" />}
                                                {agent.findings.warnings > 0 && <AlertTriangle size={12} className="text-yellow-500" />}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        {agent.config ? (
                                            <div className="text-[10px] font-mono text-slate-400">
                                                <div className="text-cyan-600">{agent.config.model}</div>
                                                <div className="opacity-60">Temp: {agent.config.temperature}</div>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-600 italic">Default</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <button 
                                            onClick={() => setConfigAgent(agent)}
                                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-cyan-400 transition-colors border border-transparent hover:border-slate-600"
                                            title="Configure Agent"
                                        >
                                            <Settings size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    // Card View
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginatedAgents.map(agent => (
                            <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-cyan-500/30 hover:bg-slate-800/80 transition-all group flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`p-2 rounded-lg ${agent.role === AgentRole.TEAM_SUPERVISOR ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-500/30' : 'bg-slate-950 text-slate-400 border border-slate-700'}`}>
                                        {agent.role === AgentRole.TEAM_SUPERVISOR ? <Bot size={20} /> : <Cpu size={20} />}
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => setConfigAgent(agent)}
                                            className="p-1.5 hover:bg-slate-700 rounded text-slate-500 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Settings size={16} />
                                        </button>
                                    </div>
                                </div>
                                
                                <h3 className="text-sm font-bold text-white mb-1">{agent.name}</h3>
                                <div className="text-xs text-slate-500 font-mono bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50 w-fit mb-3">
                                    ID: {agent.id}
                                </div>

                                <div className="space-y-2 mb-4 flex-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Role</span>
                                        <span className="text-slate-300 font-medium">{agent.role === AgentRole.TEAM_SUPERVISOR ? 'Supervisor' : 'Worker'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Specialty</span>
                                        <span className="text-slate-300 font-medium truncate max-w-[120px]">{agent.specialty || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Team</span>
                                        <span className="text-slate-300 font-medium truncate max-w-[120px]">{agent.teamName}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(agent.status)}`}>
                                        {agent.status}
                                    </span>
                                    {agent.config?.model && (
                                        <span className="text-[10px] text-slate-600 font-mono">
                                            {agent.config.model.replace('gemini-', '')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Users size={32} className="opacity-20 mb-2" />
                    <p>No agents found matching your search.</p>
                </div>
            )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 py-2 border-t border-slate-900 shrink-0">
            <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"
            >
                <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-400">
                Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{Math.max(1, totalPages)}</span>
            </span>
            <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"
            >
                <ChevronRight size={16} />
            </button>
        </div>

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
    </div>
  );
};

export default AgentManagement;
