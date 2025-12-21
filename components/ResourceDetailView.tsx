
import React, { useState, useMemo, useEffect } from 'react';
import { TopologyNode, Team, TopologyGroup, Agent, AgentRole, AgentStatus, AgentConfig, DiagnosisSession, TopologyLayer } from '../types';

// Layer options for the dropdown
const LAYER_OPTIONS: { value: TopologyLayer; label: string }[] = [
  { value: 'scenario', label: 'Business Scenario' },
  { value: 'flow', label: 'Business Flow' },
  { value: 'application', label: 'Business Application' },
  { value: 'middleware', label: 'Middleware' },
  { value: 'infrastructure', label: 'Infrastructure' },
];
import { AgentConfigModal } from './AgentConfigModal';
import {
  ArrowLeft,
  ChevronRight,
  Server, 
  Database, 
  Shield, 
  Activity, 
  Share2, 
  Users, 
  CheckCircle2, 
  Settings, 
  Bot, 
  Network,
  Cpu,
  ArrowUpRight,
  Info,
  Search,
  LayoutList,
  LayoutGrid,
  Eye,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Check,
  History,
  Clock,
  AlertOctagon,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface ResourceDetailViewProps {
  node: TopologyNode;
  team?: Team;
  associatedTopologyGroups: TopologyGroup[];
  analysisHistory?: DiagnosisSession[];
  onLoadSession?: (session: DiagnosisSession) => void;
  onBack: () => void;
  onNavigateToTopology: (topologyId: string) => void;
  onUpdateNode: (node: TopologyNode) => void;
  onUpdateAgentConfig: (teamId: string, agentId: string, config: AgentConfig) => void;
  onAddWorker: (teamId: string, workerTemplate: { name: string, specialty: string }) => void;
  onRemoveWorker: (teamId: string, agentId: string) => void;
}

const ITEMS_PER_PAGE = 6;

const ResourceDetailView: React.FC<ResourceDetailViewProps> = ({ 
  node, 
  team, 
  associatedTopologyGroups, 
  analysisHistory = [],
  onLoadSession,
  onBack, 
  onNavigateToTopology,
  onUpdateNode,
  onUpdateAgentConfig,
  onAddWorker,
  onRemoveWorker
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'topologies' | 'agents' | 'history'>('info');
  
  // Edit Mode State for Basic Info
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<TopologyNode>(node);
  const [editCustomProps, setEditCustomProps] = useState<{key: string, value: string}[]>([]);

  // Agent Config Modal State
  const [configAgent, setConfigAgent] = useState<Agent | null>(null);
  
  // Add Worker Modal State
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);

  // Initialize edit form when node changes
  useEffect(() => {
    setEditForm(node);
    if (node.properties) {
        setEditCustomProps(Object.entries(node.properties).map(([k, v]) => ({ key: k, value: v })));
    } else {
        setEditCustomProps([]);
    }
  }, [node, isEditing]);

  // Topology Tab State
  const [tgSearchTerm, setTgSearchTerm] = useState('');
  const [tgCurrentPage, setTgCurrentPage] = useState(1);
  const [tgViewMode, setTgViewMode] = useState<'list' | 'card'>('card');

  // History Tab State
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyViewMode, setHistoryViewMode] = useState<'list' | 'card'>('list');
  
  const getNodeIcon = (type: string, size: number = 20) => {
    switch (type) {
      case 'Database': return <Database size={size} className="text-purple-400" />;
      case 'Gateway': return <Shield size={size} className="text-pink-400" />;
      case 'Service': return <Server size={size} className="text-blue-400" />;
      case 'Cache': return <Activity size={size} className="text-orange-400" />;
      default: return <Server size={size} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.IDLE: return "text-slate-500";
      case AgentStatus.THINKING: return "text-cyan-400";
      case AgentStatus.WORKING: return "text-green-400";
      case AgentStatus.COMPLETED: return "text-slate-300";
      case AgentStatus.WAITING: return "text-yellow-500";
      case AgentStatus.ERROR: return "text-red-500";
      default: return "text-slate-500";
    }
  };

  // Topology Filtering & Pagination Logic
  const filteredTopologyGroups = useMemo(() => {
    return associatedTopologyGroups.filter(tg => 
      tg.name.toLowerCase().includes(tgSearchTerm.toLowerCase()) ||
      tg.id.toLowerCase().includes(tgSearchTerm.toLowerCase())
    );
  }, [associatedTopologyGroups, tgSearchTerm]);

  const totalTgPages = Math.ceil(filteredTopologyGroups.length / ITEMS_PER_PAGE);
  const paginatedTopologyGroups = filteredTopologyGroups.slice(
    (tgCurrentPage - 1) * ITEMS_PER_PAGE,
    tgCurrentPage * ITEMS_PER_PAGE
  );

  const handleTgSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTgSearchTerm(e.target.value);
    setTgCurrentPage(1); // Reset to first page on search
  };

  // History Filtering & Pagination Logic
  const filteredHistory = useMemo(() => {
      return analysisHistory.filter(h => 
          h.query.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
          h.status.toLowerCase().includes(historySearchTerm.toLowerCase())
      ).slice().reverse(); // Show newest first
  }, [analysisHistory, historySearchTerm]);

  const totalHistoryPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice(
      (historyCurrentPage - 1) * ITEMS_PER_PAGE,
      historyCurrentPage * ITEMS_PER_PAGE
  );

  const handleHistorySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHistorySearchTerm(e.target.value);
      setHistoryCurrentPage(1);
  };

  // Edit Handlers
  const handleSave = () => {
    const properties: Record<string, string> = {};
    editCustomProps.forEach(p => {
        if (p.key.trim()) properties[p.key.trim()] = p.value;
    });
    
    onUpdateNode({
        ...editForm,
        properties
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(node); // Reset
  };

  const handleAddProp = () => {
    setEditCustomProps([...editCustomProps, { key: '', value: '' }]);
  };

  const handleRemoveProp = (idx: number) => {
    setEditCustomProps(editCustomProps.filter((_, i) => i !== idx));
  };

  const handlePropChange = (idx: number, field: 'key' | 'value', value: string) => {
    const newProps = [...editCustomProps];
    newProps[idx][field] = value;
    setEditCustomProps(newProps);
  };

  const AgentListItem: React.FC<{ agent: Agent, isSupervisor?: boolean }> = ({ agent, isSupervisor }) => (
    <div className={`p-4 rounded-lg border flex items-center gap-4 transition-all hover:bg-slate-900 shadow-sm relative z-20 group ${isSupervisor ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-slate-950 border-slate-800'}`}>
       <div className={`p-3 rounded-full shrink-0 ${isSupervisor ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
          {isSupervisor ? <Bot size={20} /> : <Cpu size={18} />}
       </div>
       <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <span className={`text-sm font-bold truncate ${isSupervisor ? 'text-indigo-200' : 'text-slate-200'}`}>{agent.name}</span>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-slate-800 bg-slate-900 ${getStatusColor(agent.status)}`}>{agent.status}</span>
                {isSupervisor && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setConfigAgent(agent); }}
                        className="p-1 text-slate-500 hover:text-cyan-400 rounded hover:bg-slate-800 transition-colors"
                        title="Configure Agent"
                    >
                        <Settings size={14} />
                    </button>
                )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-1">
             <span className="text-xs text-slate-500">{isSupervisor ? 'Team Supervisor' : agent.specialty || 'Worker'}</span>
             {(agent.findings.warnings > 0 || agent.findings.critical > 0) && (
               <span className="text-[10px] text-yellow-500 flex items-center gap-1 bg-yellow-950/30 px-2 py-0.5 rounded border border-yellow-900/50">
                 {agent.findings.warnings + agent.findings.critical} Issues
               </span>
             )}
          </div>
          {isSupervisor && agent.config?.model && (
              <div className="mt-2 text-[10px] text-slate-600 font-mono flex gap-2">
                  <span>Model: {agent.config.model}</span>
                  <span>|</span>
                  <span>Temp: {agent.config.temperature}</span>
              </div>
          )}
       </div>
       
       {/* Remove Worker Button (Hover Only) */}
       {!isSupervisor && team && (
           <button 
             onClick={(e) => { e.stopPropagation(); onRemoveWorker(team.id, agent.id); }}
             className="absolute right-2 top-2 p-1.5 bg-slate-900 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-all border border-slate-800 shadow-md"
             title="Remove Worker"
           >
             <Trash2 size={12} />
           </button>
       )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
               <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                  {getNodeIcon(node.type, 24)}
               </div>
               <div>
                  <h1 className="text-lg font-bold text-white tracking-tight">{node.label}</h1>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                     <span>ID: {node.id}</span>
                     <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                     <span className="flex items-center gap-1 text-green-400"><CheckCircle2 size={10} /> Active</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex gap-8">
              <button 
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'info' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
              >
                  <Info size={16} /> Basic Information
              </button>
              <button 
                onClick={() => setActiveTab('topologies')}
                className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'topologies' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
              >
                  <Network size={16} /> Topologies
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">{associatedTopologyGroups.length}</span>
              </button>
              <button 
                onClick={() => setActiveTab('agents')}
                className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'agents' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
              >
                  <Users size={16} /> Agent Team
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">{team ? team.members.length + 1 : 0}</span>
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'history' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
              >
                  <History size={16} /> Analysis History
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">{analysisHistory.length}</span>
              </button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 relative">
         <div className="w-full h-full p-6">
            
            {/* Tab 1: Basic Information */}
            {activeTab === 'info' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                   <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-2">
                          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                            <Activity size={16} className="text-cyan-500" /> Resource Attributes
                          </h2>
                          {!isEditing ? (
                              <button 
                                onClick={() => setIsEditing(true)}
                                className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                              >
                                  <Edit2 size={12} /> Edit
                              </button>
                          ) : (
                              <div className="flex gap-2">
                                  <button 
                                    onClick={handleCancelEdit}
                                    className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-slate-800"
                                  >
                                      <X size={12} /> Cancel
                                  </button>
                                  <button 
                                    onClick={handleSave}
                                    className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors px-2 py-1 rounded bg-green-950/30 border border-green-900/50"
                                  >
                                      <Save size={12} /> Save
                                  </button>
                              </div>
                          )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                         {/* LABEL */}
                         <div className="flex justify-between items-center py-2 border-b border-slate-800/50 h-10">
                            <span className="text-sm text-slate-400">Resource Label</span>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    value={editForm.label}
                                    onChange={e => setEditForm({...editForm, label: e.target.value})}
                                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 w-40 text-right"
                                />
                            ) : (
                                <span className="text-sm font-bold text-white">{node.label}</span>
                            )}
                         </div>

                         {/* TYPE */}
                         <div className="flex justify-between items-center py-2 border-b border-slate-800/50 h-10">
                            <span className="text-sm text-slate-400">Resource Type</span>
                            {isEditing ? (
                                <select
                                    value={editForm.type}
                                    onChange={e => setEditForm({...editForm, type: e.target.value as any})}
                                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 w-40 text-right"
                                >
                                    <option value="Service">Service</option>
                                    <option value="Database">Database</option>
                                    <option value="Gateway">Gateway</option>
                                    <option value="Cache">Cache</option>
                                    <option value="Infrastructure">Infrastructure</option>
                                </select>
                            ) : (
                                <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200">
                                {node.type}
                                </span>
                            )}
                         </div>

                         {/* LAYER */}
                         <div className="flex justify-between items-center py-2 border-b border-slate-800/50 h-10">
                            <span className="text-sm text-slate-400">Layer</span>
                            {isEditing ? (
                                <select
                                    value={editForm.layer || 'application'}
                                    onChange={e => setEditForm({...editForm, layer: e.target.value as TopologyLayer})}
                                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 w-40 text-right"
                                >
                                    {LAYER_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200">
                                {LAYER_OPTIONS.find(l => l.value === node.layer)?.label || 'Business Application'}
                                </span>
                            )}
                         </div>

                         {/* STATUS - READ ONLY */}
                         <div className="flex justify-between items-center py-2 border-b border-slate-800/50 h-10">
                            <span className="text-sm text-slate-400">Current Status</span>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-950/30 px-2 py-1 rounded border border-green-900/50">
                               <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                               Online
                            </span>
                         </div>
                         
                         {/* COORDS - READ ONLY */}
                         <div className="flex justify-between items-center py-2 border-b border-slate-800/50 h-10">
                            <span className="text-sm text-slate-400">Grid Coordinates</span>
                            <span className="text-xs font-mono text-slate-500">
                               X: {node.x?.toFixed(0) || 'N/A'}, Y: {node.y?.toFixed(0) || 'N/A'}
                            </span>
                         </div>
                         
                         {/* ID - READ ONLY */}
                         <div className="flex justify-between items-center py-2 border-b border-slate-800/50 h-10">
                            <span className="text-sm text-slate-400">System ID</span>
                            <span className="text-xs font-mono text-slate-500">{node.id}</span>
                         </div>
                      </div>
    
                      {/* Custom Properties */}
                      <div className="mt-8">
                         <div className="flex items-center justify-between mb-3">
                             <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Settings size={12} /> Custom Metadata
                             </h3>
                             {isEditing && (
                                 <button 
                                    onClick={handleAddProp}
                                    className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                                 >
                                     <Plus size={12} /> Add Property
                                 </button>
                             )}
                         </div>

                         {isEditing ? (
                             <div className="space-y-2">
                                 {editCustomProps.map((prop, idx) => (
                                     <div key={idx} className="flex gap-2 items-center">
                                         <input 
                                             type="text"
                                             placeholder="Key"
                                             value={prop.key}
                                             onChange={(e) => handlePropChange(idx, 'key', e.target.value)}
                                             className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                                         />
                                         <input 
                                             type="text"
                                             placeholder="Value"
                                             value={prop.value}
                                             onChange={(e) => handlePropChange(idx, 'value', e.target.value)}
                                             className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                                         />
                                         <button 
                                             type="button"
                                             onClick={() => handleRemoveProp(idx)}
                                             className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                                         >
                                             <Trash2 size={14} />
                                         </button>
                                     </div>
                                 ))}
                                 {editCustomProps.length === 0 && (
                                     <div className="text-center py-4 border border-dashed border-slate-800 rounded bg-slate-950/50 text-xs text-slate-500">
                                         No custom properties added.
                                     </div>
                                 )}
                             </div>
                         ) : (
                             // READ ONLY VIEW
                             node.properties && Object.keys(node.properties).length > 0 ? (
                                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                                   <table className="w-full text-sm text-left">
                                      <thead className="bg-slate-900 text-xs uppercase text-slate-500 font-bold">
                                          <tr>
                                              <th className="px-4 py-3 border-b border-slate-800 w-1/3">Attribute Key</th>
                                              <th className="px-4 py-3 border-b border-slate-800">Value</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                         {Object.entries(node.properties).map(([k, v]) => (
                                            <tr key={k} className="border-b border-slate-800 last:border-0 hover:bg-slate-900/50 transition-colors">
                                               <td className="px-4 py-3 text-cyan-400 font-mono text-xs border-r border-slate-800">{k}</td>
                                               <td className="px-4 py-3 text-slate-300 font-mono text-xs">{v}</td>
                                            </tr>
                                         ))}
                                      </tbody>
                                   </table>
                                </div>
                             ) : (
                                <div className="text-center py-8 border border-dashed border-slate-800 rounded bg-slate-950/50 text-sm text-slate-500">
                                   No custom attributes defined for this resource.
                                </div>
                             )
                         )}
                      </div>
                   </div>
                </div>
            )}

            {/* Tab 2: Topologies */}
            {activeTab === 'topologies' && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex-1 flex flex-col">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4 shrink-0">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                            <Network size={16} className="text-cyan-500" /> Associated Topologies
                        </h2>
                        
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            {/* Search Bar */}
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                                <input
                                    type="text"
                                    placeholder="Filter topologies..."
                                    value={tgSearchTerm}
                                    onChange={handleTgSearch}
                                    className="w-full bg-slate-950 border border-slate-700 rounded py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                                />
                            </div>

                            {/* View Toggle */}
                            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 shrink-0">
                                <button
                                    onClick={() => setTgViewMode('list')}
                                    className={`p-1.5 rounded transition-all ${tgViewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    title="List View"
                                >
                                    <LayoutList size={16} />
                                </button>
                                <button
                                    onClick={() => setTgViewMode('card')}
                                    className={`p-1.5 rounded transition-all ${tgViewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    title="Card View"
                                >
                                    <LayoutGrid size={16} />
                                </button>
                            </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-auto custom-scrollbar">
                         {paginatedTopologyGroups.length > 0 ? (
                            tgViewMode === 'card' ? (
                                // Card View
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {paginatedTopologyGroups.map(tg => (
                                    <div 
                                        key={tg.id} 
                                        onClick={() => onNavigateToTopology(tg.id)}
                                        className="group flex flex-col p-5 bg-slate-950 border border-slate-800 rounded-lg hover:border-cyan-500/50 hover:bg-slate-900 hover:shadow-lg hover:shadow-cyan-900/10 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400">
                                            <ArrowUpRight size={18} />
                                        </div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-indigo-950/30 rounded border border-indigo-500/20 text-indigo-400">
                                                <Network size={20} />
                                            </div>
                                            <span className="text-base font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">{tg.name}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 pl-1">{tg.description}</p>
                                        <div className="mt-auto flex gap-2 pt-3 border-t border-slate-900">
                                            {tg.tags?.map((tag, i) => (
                                                <span key={i} className="text-xs px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 group-hover:border-slate-700">
                                                {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    ))}
                                </div>
                            ) : (
                                // List View
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Topology Name</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">ID</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Description</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Tags</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                                        {paginatedTopologyGroups.map(tg => (
                                            <tr key={tg.id} className="hover:bg-slate-900 transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-indigo-950/30 rounded border border-indigo-500/20 text-indigo-400">
                                                            <Network size={16} />
                                                        </div>
                                                        <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{tg.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-xs font-mono text-slate-500">{tg.id}</td>
                                                <td className="p-4 text-sm text-slate-400 max-w-xs truncate">{tg.description}</td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {tg.tags?.slice(0, 2).map((tag, i) => (
                                                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {tg.tags && tg.tags.length > 2 && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-500">+{tg.tags.length - 2}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => onNavigateToTopology(tg.id)}
                                                        className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-cyan-400 transition-colors"
                                                        title="Enter Topology"
                                                    >
                                                        <ArrowUpRight size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                         ) : (
                            <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-800 rounded-lg bg-slate-950/30 text-slate-500 min-h-[300px]">
                               <Network size={48} className="opacity-20 mb-4" />
                               {tgSearchTerm ? (
                                   <p className="text-base font-medium">No topologies match "{tgSearchTerm}".</p>
                               ) : (
                                   <>
                                    <p className="text-base font-medium">Not assigned to any topologies.</p>
                                    <p className="text-sm opacity-60 mt-1">Add this resource to a topology to see it here.</p>
                                   </>
                               )}
                            </div>
                         )}
                      </div>

                      {/* Pagination Controls */}
                      {totalTgPages > 1 && (
                        <div className="mt-6 flex justify-center items-center gap-4 shrink-0">
                            <button 
                                onClick={() => setTgCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={tgCurrentPage === 1}
                                className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs text-slate-400">
                                Page <span className="text-white font-bold">{tgCurrentPage}</span> of <span className="text-white font-bold">{totalTgPages}</span>
                            </span>
                            <button 
                                onClick={() => setTgCurrentPage(prev => Math.min(totalTgPages, prev + 1))}
                                disabled={tgCurrentPage === totalTgPages}
                                className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                      )}
                   </div>
                </div>
            )}

            {/* Tab 3: Agent Team */}
            {activeTab === 'agents' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                   <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm min-h-[400px]">
                      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-2">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                            <Users size={16} className="text-cyan-500" /> Assigned Guardians
                        </h2>
                        {team && (
                            <button 
                                onClick={() => setIsAddWorkerModalOpen(true)}
                                className="flex items-center gap-2 text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded transition-colors shadow-lg shadow-cyan-900/20 font-bold"
                            >
                                <Plus size={14} /> Add Worker
                            </button>
                        )}
                      </div>

                      {team ? (
                         <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between p-4 bg-slate-950/80 rounded-lg border border-slate-800 shadow-inner">
                               <div className="flex items-center gap-3">
                                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-400">
                                    <Users size={20} />
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Team</div>
                                    <div className="text-lg font-bold text-white">{team.name}</div>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team ID</div>
                                  <div className="text-sm font-mono text-cyan-500">{team.id}</div>
                               </div>
                            </div>

                            {/* Hierarchical View */}
                            <div className="mt-2 relative">
                                
                                {/* Supervisor */}
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                         <span className="px-2 py-1 rounded bg-indigo-950/30 border border-indigo-500/30 text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                            <Bot size={12} /> Supervisor
                                         </span>
                                    </div>
                                    <div className="w-full md:w-2/3">
                                        <AgentListItem agent={team.supervisor} isSupervisor />
                                    </div>
                                </div>

                                {/* Connecting Line (Stem) */}
                                <div className="absolute left-8 top-20 bottom-10 w-px bg-slate-700/50"></div>

                                {/* Workers */}
                                <div className="pt-10 pl-16 space-y-6">
                                    <div className="absolute left-16 -mt-6 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Cpu size={12} /> Workers
                                    </div>

                                    {team.members.map(member => (
                                        <div key={member.id} className="relative">
                                            {/* Connecting Line (Branch) */}
                                            <div className="absolute -left-8 top-1/2 w-8 h-px bg-slate-700/50"></div>
                                            {/* Node Dot */}
                                            <div className="absolute -left-[35px] top-1/2 -mt-1 w-2 h-2 rounded-full bg-slate-800 border border-slate-600"></div>

                                            <div className="w-full md:w-5/6">
                                                <AgentListItem agent={member} />
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {team.members.length === 0 && (
                                        <div className="text-sm text-slate-500 italic p-2 border border-dashed border-slate-800 rounded">
                                            No workers assigned. Add a worker to assist the supervisor.
                                        </div>
                                    )}
                                </div>
                            </div>
                         </div>
                      ) : (
                         <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-lg bg-slate-950/30 text-slate-500">
                            <Bot size={48} className="opacity-20 mb-4" />
                            <p className="text-base font-medium">No agent team assigned.</p>
                            <p className="text-sm opacity-60 mt-1">This resource is currently unmonitored.</p>
                         </div>
                      )}
                   </div>
                </div>
            )}

            {/* Tab 4: Analysis History */}
            {activeTab === 'history' && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex-1 flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4 shrink-0">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                                <History size={16} className="text-cyan-500" /> Diagnosis Records
                            </h2>
                            
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                {/* Search Bar */}
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search history..."
                                        value={historySearchTerm}
                                        onChange={handleHistorySearch}
                                        className="w-full bg-slate-950 border border-slate-700 rounded py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                                    />
                                </div>

                                {/* View Toggle */}
                                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 shrink-0">
                                    <button
                                        onClick={() => setHistoryViewMode('list')}
                                        className={`p-1.5 rounded transition-all ${historyViewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                        title="List View"
                                    >
                                        <LayoutList size={16} />
                                    </button>
                                    <button
                                        onClick={() => setHistoryViewMode('card')}
                                        className={`p-1.5 rounded transition-all ${historyViewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                        title="Card View"
                                    >
                                        <LayoutGrid size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar">
                            {paginatedHistory.length > 0 ? (
                                historyViewMode === 'list' ? (
                                    // List View
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Status</th>
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Query / Intent</th>
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Date & Time</th>
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Findings</th>
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                                            {paginatedHistory.map(session => (
                                                <tr key={session.id} className="hover:bg-slate-900 transition-colors group">
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                            session.status === 'Running' ? 'bg-cyan-900/50 text-cyan-400 border-cyan-700 animate-pulse' : 
                                                            session.status === 'Failed' ? 'bg-red-950 text-red-400 border-red-900' :
                                                            'bg-slate-800 text-slate-400 border-slate-700'
                                                        }`}>
                                                            {session.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-300 font-medium max-w-xs truncate" title={session.query}>{session.query}</td>
                                                    <td className="p-4 text-xs text-slate-500 font-mono">
                                                        {new Date(session.timestamp).toLocaleDateString()} <span className="text-slate-600">|</span> {new Date(session.timestamp).toLocaleTimeString()}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2">
                                                            {session.findings.critical > 0 && (
                                                                <span className="flex items-center gap-1 text-[10px] text-red-500 bg-red-950/30 px-1.5 rounded border border-red-900/30">
                                                                    <AlertOctagon size={10} /> {session.findings.critical} Crit
                                                                </span>
                                                            )}
                                                            {session.findings.warnings > 0 && (
                                                                <span className="flex items-center gap-1 text-[10px] text-yellow-500 bg-yellow-950/30 px-1.5 rounded border border-yellow-900/30">
                                                                    <AlertTriangle size={10} /> {session.findings.warnings} Warn
                                                                </span>
                                                            )}
                                                            {session.findings.critical === 0 && session.findings.warnings === 0 && (
                                                                <span className="text-[10px] text-green-500 bg-green-950/30 px-2 py-0.5 rounded border border-green-900/30">
                                                                    Clean
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            onClick={() => onLoadSession && onLoadSession(session)}
                                                            className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-cyan-400 transition-colors"
                                                            title="View Analysis Log"
                                                        >
                                                            <ArrowRight size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    // Card View
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {paginatedHistory.map(session => (
                                            <div 
                                                key={session.id} 
                                                onClick={() => onLoadSession && onLoadSession(session)}
                                                className="group p-4 bg-slate-950 border border-slate-800 rounded-lg hover:border-cyan-500/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col h-[180px]"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                        session.status === 'Running' ? 'bg-cyan-900/50 text-cyan-400 border-cyan-700 animate-pulse' : 
                                                        session.status === 'Failed' ? 'bg-red-950 text-red-400 border-red-900' :
                                                        'bg-slate-800 text-slate-400 border-slate-700'
                                                    }`}>
                                                        {session.status}
                                                    </span>
                                                    <div className="text-xs text-slate-500 font-mono">
                                                        {new Date(session.timestamp).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                
                                                <h3 className="text-sm font-bold text-slate-200 line-clamp-2 mb-3 group-hover:text-cyan-300 transition-colors">"{session.query}"</h3>
                                                
                                                <div className="mt-auto pt-3 border-t border-slate-900 flex justify-between items-center">
                                                    <div className="flex gap-2">
                                                        {session.findings.critical > 0 && (
                                                            <span className="flex items-center gap-1 text-[10px] text-red-500">
                                                                <AlertOctagon size={10} /> {session.findings.critical}
                                                            </span>
                                                        )}
                                                        {session.findings.warnings > 0 && (
                                                            <span className="flex items-center gap-1 text-[10px] text-yellow-500">
                                                                <AlertTriangle size={10} /> {session.findings.warnings}
                                                            </span>
                                                        )}
                                                        {session.findings.critical === 0 && session.findings.warnings === 0 && (
                                                            <span className="text-[10px] text-green-500">Clean</span>
                                                        )}
                                                    </div>
                                                    <ArrowRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-800 rounded-lg bg-slate-950/30 text-slate-500 min-h-[300px]">
                                    <Clock size={48} className="opacity-20 mb-4" />
                                    {historySearchTerm ? (
                                        <p className="text-base font-medium">No records match "{historySearchTerm}".</p>
                                    ) : (
                                        <>
                                            <p className="text-base font-medium">No analysis history found.</p>
                                            <p className="text-sm opacity-60 mt-1">Run a diagnosis including this resource to see records here.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {totalHistoryPages > 1 && (
                            <div className="mt-6 flex justify-center items-center gap-4 shrink-0">
                                <button 
                                    onClick={() => setHistoryCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={historyCurrentPage === 1}
                                    className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-xs text-slate-400">
                                    Page <span className="text-white font-bold">{historyCurrentPage}</span> of <span className="text-white font-bold">{totalHistoryPages}</span>
                                </span>
                                <button 
                                    onClick={() => setHistoryCurrentPage(prev => Math.min(totalHistoryPages, prev + 1))}
                                    disabled={historyCurrentPage === totalHistoryPages}
                                    className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
         </div>
      </div>

      {/* Configuration Modal */}
      {configAgent && team && (
          <AgentConfigModal 
            agent={configAgent} 
            onClose={() => setConfigAgent(null)} 
            onSave={(newConfig) => {
                onUpdateAgentConfig(team.id, configAgent.id, newConfig);
                setConfigAgent(null);
            }} 
          />
      )}
      
      {/* Add Worker Modal */}
      {isAddWorkerModalOpen && team && (
          <AddWorkerModal
             resourceType={node.type}
             existingWorkerNames={team.members.map(m => m.name)}
             onClose={() => setIsAddWorkerModalOpen(false)}
             onAdd={(template) => {
                 onAddWorker(team.id, template);
                 setIsAddWorkerModalOpen(false);
             }}
          />
      )}
    </div>
  );
};

// ... Helper Components (AddWorkerModal) ...
// Included to ensure file completeness

const WORKER_TEMPLATES: Record<string, {name: string, specialty: string, desc: string}[]> = {
    'Database': [
        { name: 'Query Optimizer', specialty: 'Query Performance', desc: 'Analyzes slow queries and suggests index improvements.' },
        { name: 'Integrity Guard', specialty: 'Data Consistency', desc: 'Checks for foreign key violations and data anomalies.' },
        { name: 'Backup Monitor', specialty: 'Disaster Recovery', desc: 'Verifies backup completion and point-in-time recovery readiness.' },
        { name: 'Deadlock Detector', specialty: 'Concurrency Control', desc: 'Identifies transaction locks and blocking chains.' }
    ],
    'Service': [
        { name: 'Log Analyzer', specialty: 'Error Tracking', desc: 'Parses application logs for exceptions and stack traces.' },
        { name: 'Latency Checker', specialty: 'Performance Monitoring', desc: 'Measures API response times and throughput.' },
        { name: 'Resource Scaler', specialty: 'Capacity Planning', desc: 'Monitors CPU/Memory usage and suggests scaling actions.' },
        { name: 'Dep. Watcher', specialty: 'Dependency Health', desc: 'Checks connectivity to downstream services.' }
    ],
    'Gateway': [
        { name: 'Traffic Inspector', specialty: 'Traffic Analysis', desc: 'Monitors inbound request volume and patterns.' },
        { name: 'Auth Sentinel', specialty: 'Security', desc: 'Validates token signatures and inspects for unauthorized access.' },
        { name: 'Rate Limiter', specialty: 'Traffic Control', desc: 'Tracks quota usage and throttled requests.' }
    ],
    'Cache': [
        { name: 'Hit Rate Monitor', specialty: 'Cache Efficiency', desc: 'Tracks hit/miss ratios and eviction rates.' },
        { name: 'Key Auditor', specialty: 'Storage Analysis', desc: 'Identifies large keys and potential memory leaks.' },
        { name: 'Latency Pulse', specialty: 'Performance', desc: 'Ensures sub-millisecond response times.' }
    ]
};

const AddWorkerModal: React.FC<{
    resourceType: string,
    existingWorkerNames: string[],
    onClose: () => void,
    onAdd: (template: { name: string, specialty: string }) => void
}> = ({ resourceType, existingWorkerNames, onClose, onAdd }) => {
    
    const [searchTerm, setSearchTerm] = useState("");
    const templates = WORKER_TEMPLATES[resourceType] || WORKER_TEMPLATES['Service'];

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => 
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            t.specialty.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [templates, searchTerm]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div>
                        <h3 className="font-bold text-white text-lg">Deploy New Worker</h3>
                        <p className="text-xs text-slate-500 mt-1">Select a specialized agent template for this {resourceType}.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                </div>
                
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search workers by name or specialty..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-slate-200"
                        />
                    </div>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {filteredTemplates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredTemplates.map((tpl, i) => {
                                const isAdded = existingWorkerNames.includes(tpl.name);
                                return (
                                    <div 
                                        key={i}
                                        onClick={() => !isAdded && onAdd(tpl)}
                                        className={`
                                            group p-4 rounded-lg border transition-all relative
                                            ${isAdded 
                                                ? 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed' 
                                                : 'bg-slate-950 border-slate-800 hover:bg-slate-900 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-900/10 cursor-pointer'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className={`p-2 rounded border transition-colors ${
                                                isAdded 
                                                    ? 'bg-slate-900 border-slate-800 text-slate-600' 
                                                    : 'bg-slate-900 border-slate-800 group-hover:bg-cyan-950/30 group-hover:border-cyan-500/30 text-slate-400 group-hover:text-cyan-400'
                                            }`}>
                                                <Cpu size={20} />
                                            </div>
                                            {isAdded ? (
                                                <span className="text-xs font-bold text-green-500 uppercase tracking-wider flex items-center gap-1">
                                                    <Check size={12} /> Added
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-cyan-500 transition-colors">Select</span>
                                            )}
                                        </div>
                                        <h4 className={`font-bold mb-1 transition-colors ${isAdded ? 'text-slate-500' : 'text-white group-hover:text-cyan-300'}`}>{tpl.name}</h4>
                                        <div className={`text-xs mb-2 font-mono ${isAdded ? 'text-slate-600' : 'text-cyan-500'}`}>{tpl.specialty}</div>
                                        <p className={`text-sm leading-relaxed ${isAdded ? 'text-slate-600' : 'text-slate-400 group-hover:text-slate-300'}`}>{tpl.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                             <Cpu size={32} className="mx-auto mb-2 opacity-20" />
                             <p>No worker templates match your search.</p>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-slate-800 bg-slate-950/50 rounded-b-xl flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ResourceDetailView;
