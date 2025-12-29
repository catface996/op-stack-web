
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DiscoverySource, Agent } from '../types';
import StyledSelect from './ui/StyledSelect';
import {
  Radar,
  Plus,
  Settings,
  Trash2,
  X,
  Database,
  Cloud,
  Network,
  Activity,
  Zap,
  RefreshCw,
  Save,
  Search,
  LayoutList,
  LayoutGrid,
  ArrowUpRight,
  Clock,
  ChevronLeft,
  ChevronRight,
  Bot,
  ChevronDown,
  Check
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

// --- Sub-component: Single-Select Dropdown for Agents ---

const AgentSingleSelect: React.FC<{
  selectedId: string | undefined;
  agents: Agent[];
  onChange: (id: string | undefined) => void;
}> = ({ selectedId, agents, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredAgents = useMemo(() => {
    return agents.filter(a =>
      a.name.toLowerCase().includes(filter.toLowerCase()) ||
      a.role.toLowerCase().includes(filter.toLowerCase())
    );
  }, [agents, filter]);

  const selectedAgent = agents.find(a => a.id === selectedId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string | undefined) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-950 border rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-cyan-500 ring-1 ring-cyan-500/20' : 'border-slate-700 hover:border-slate-600'}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedAgent ? (
            <div className="flex items-center gap-2 bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-500/30">
              <Bot size={10} />
              {selectedAgent.name}
              <span className="text-indigo-500/70">({selectedAgent.role})</span>
            </div>
          ) : (
            <span className="text-slate-500 text-sm">Select an agent...</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[60] w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-800 bg-slate-950/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-slate-500" size={14} />
              <input
                type="text"
                autoFocus
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Search agents..."
                className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {/* No Agent Option */}
            <div
              onClick={() => handleSelect(undefined)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${!selectedId ? 'bg-indigo-900/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold">No Agent Assigned</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Connector will not be linked to any agent</div>
              </div>
              {!selectedId && <Check size={14} className="text-cyan-400 shrink-0 ml-2" />}
            </div>

            {filteredAgents.length > 0 ? (
              filteredAgents.map(agent => {
                const isSelected = selectedId === agent.id;
                return (
                  <div
                    key={agent.id}
                    onClick={() => handleSelect(agent.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-indigo-900/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <div className={`p-1.5 rounded ${isSelected ? 'bg-indigo-600/30 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                        <Bot size={12} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-bold truncate">{agent.name}</div>
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-slate-700 bg-slate-950 text-slate-500">{agent.role}</span>
                        </div>
                        {agent.specialty && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">{agent.specialty}</div>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-cyan-400 shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-600 italic">No agents found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface DiscoveryManagementProps {
  sources: DiscoverySource[];
  agents: Agent[];
  onAdd: (source: DiscoverySource) => void;
  onUpdate: (source: DiscoverySource) => void;
  onDelete: (id: string) => void;
  onScan: (id: string) => void;
}

const DiscoveryManagement: React.FC<DiscoveryManagementProps> = ({ sources, agents, onAdd, onUpdate, onDelete, onScan }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<DiscoverySource | null>(null);
  const [newSource, setNewSource] = useState<Partial<DiscoverySource>>({ type: 'K8s', status: 'Connected' });
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const openConfigModal = (source: DiscoverySource) => {
    setSelectedSource({ ...source });
    setIsConfigModalOpen(true);
  };

  const handleUpdateSource = () => {
    if (selectedSource) {
      onUpdate(selectedSource);
      setIsConfigModalOpen(false);
      setSelectedSource(null);
    }
  };

  const filteredSources = useMemo(() => sources.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.type.toLowerCase().includes(searchTerm.toLowerCase())
  ), [sources, searchTerm]);

  const totalPages = Math.ceil(filteredSources.length / ITEMS_PER_PAGE);
  const paginatedSources = filteredSources.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'K8s': return <Network className="text-blue-400" size={20} />;
      case 'Cloud': return <Cloud className="text-cyan-400" size={20} />;
      case 'Prometheus': return <Activity className="text-orange-400" size={20} />;
      default: return <Database className="text-slate-400" size={20} />;
    }
  };

  const formatLastScan = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Radar className="text-cyan-400" /> Infrastructure Connectors
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Manage data source connections for infrastructure discovery.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-cyan-900/20 font-bold text-xs tracking-widest"
        >
          <Plus size={14} /> Add connector
        </button>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 shrink-0 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search connectors by name, type or endpoint..."
            value={searchTerm}
            onChange={handleSearch}
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

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {paginatedSources.length > 0 ? (
          viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
              {paginatedSources.map(source => (
                <div
                  key={source.id}
                  className="relative bg-slate-900 border border-slate-800/80 rounded-xl transition-all cursor-pointer flex flex-col min-h-[200px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-950/10 hover:border-cyan-500/40 hover:bg-slate-800/40"
                >
                  <div className={`h-1 w-full ${source.status === 'Connected' ? 'bg-green-500' : 'bg-red-500'} opacity-30`}></div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
                        {getIcon(source.type)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${source.status === 'Connected' ? 'text-green-400 border-green-900 bg-green-950/20' : 'text-red-400 border-red-900 bg-red-950/20'}`}>
                          {source.status}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 min-w-0 overflow-hidden">
                      <h3 className="text-base font-bold text-white mb-0.5 truncate leading-tight hover:text-cyan-400 transition-colors" title={source.name}>{source.name}</h3>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] opacity-80 truncate">{source.type} Connector</div>
                    </div>

                    <div className="flex-1">
                      <div className="text-[10px] text-slate-500 font-mono truncate">{source.endpoint}</div>
                      {source.lastScan && (
                        <div className="flex items-center gap-1 mt-2 text-[9px] text-slate-600">
                          <Clock size={10} />
                          Last scan: {formatLastScan(source.lastScan)}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/40 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onScan(source.id)} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="Refresh">
                          <RefreshCw size={15} />
                        </button>
                        <button onClick={() => openConfigModal(source)} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="Settings">
                          <Settings size={15} />
                        </button>
                        <button onClick={() => onDelete(source.id)} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-red-400 transition-all" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <button
                        onClick={() => onScan(source.id)}
                        className="px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1.5 bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-600/20"
                      >
                        <Zap size={12} /> Scan now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Connector</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Type</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Endpoint</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-center">Status</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-center">Last Scan</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {paginatedSources.map(source => (
                    <tr key={source.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
                            {getIcon(source.type)}
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate max-w-xs" title={source.name}>{source.name}</div>
                            <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest">{source.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">{source.type}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-400 font-mono truncate block max-w-[200px]">{source.endpoint}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${source.status === 'Connected' ? 'text-green-400 border-green-900 bg-green-950/20' : 'text-red-400 border-red-900 bg-red-950/20'}`}>
                          {source.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs text-slate-500">{formatLastScan(source.lastScan)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => onScan(source.id)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400" title="Scan Now">
                            <Zap size={16} />
                          </button>
                          <button onClick={() => openConfigModal(source)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400" title="Settings">
                            <Settings size={16} />
                          </button>
                          <button onClick={() => onDelete(source.id)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400" title="Delete">
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
            <Radar size={48} className="opacity-10 mb-4" />
            <p className="text-sm font-bold tracking-wide">No connectors found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"><ChevronLeft size={14} /> Prev</button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest">Connector segment</span>
          <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{currentPage}</span>
          <span className="text-[10px] text-slate-500 font-bold">/</span>
          <span className="text-xs text-slate-400 font-mono font-bold">{Math.max(1, totalPages)}</span>
        </div>
        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs">Next <ChevronRight size={14} /></button>
      </div>

      {/* Add Connector Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-t-cyan-600">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                <Plus size={16} className="text-cyan-400" /> New Environment Link
              </h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-slate-500 hover:text-white" /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onAdd({...newSource, id: `src-${Date.now()}`} as any); setIsModalOpen(false); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Connector Name</label>
                  <input required onChange={e => setNewSource({...newSource, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. Prod-K8s-Cluster" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Provider Type</label>
                  <StyledSelect
                    value={newSource.type || 'K8s'}
                    onChange={(val) => setNewSource({...newSource, type: val as any})}
                    options={[
                      { value: 'K8s', label: 'Kubernetes API' },
                      { value: 'Prometheus', label: 'Prometheus' },
                      { value: 'Cloud', label: 'Public Cloud' }
                    ]}
                    placeholder="Select provider type..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Endpoint / ARN</label>
                  <input required onChange={e => setNewSource({...newSource, endpoint: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none font-mono" placeholder="https://..." />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black tracking-widest rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-900/20">
                  <Save size={14} /> Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Config Connector Modal */}
      {isConfigModalOpen && selectedSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-visible border-t-4 border-t-cyan-600">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-2xl">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                <Settings size={16} className="text-cyan-400" /> Connector Configuration
              </h3>
              <button onClick={() => { setIsConfigModalOpen(false); setSelectedSource(null); }}>
                <X className="text-slate-500 hover:text-white" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Connector Info Header */}
              <div className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg">
                  {getIcon(selectedSource.type)}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{selectedSource.type} Connector</div>
                  <div className="text-sm font-bold text-white">{selectedSource.id}</div>
                </div>
                <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${selectedSource.status === 'Connected' ? 'text-green-400 border-green-900 bg-green-950/20' : 'text-red-400 border-red-900 bg-red-950/20'}`}>
                  {selectedSource.status}
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Connector Name</label>
                  <input
                    value={selectedSource.name}
                    onChange={e => setSelectedSource({ ...selectedSource, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Provider Type</label>
                  <StyledSelect
                    value={selectedSource.type}
                    onChange={(val) => setSelectedSource({ ...selectedSource, type: val as any })}
                    options={[
                      { value: 'K8s', label: 'Kubernetes API' },
                      { value: 'Prometheus', label: 'Prometheus' },
                      { value: 'Cloud', label: 'Public Cloud' }
                    ]}
                    placeholder="Select provider type..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Endpoint / ARN</label>
                  <input
                    value={selectedSource.endpoint}
                    onChange={e => setSelectedSource({ ...selectedSource, endpoint: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Connection Status</label>
                  <StyledSelect
                    value={selectedSource.status}
                    onChange={(val) => setSelectedSource({ ...selectedSource, status: val as 'Connected' | 'Disconnected' })}
                    options={[
                      { value: 'Connected', label: 'Connected' },
                      { value: 'Disconnected', label: 'Disconnected' }
                    ]}
                    placeholder="Select status..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Bot size={12} className="text-cyan-400" /> Assigned Agent
                  </label>
                  <AgentSingleSelect
                    selectedId={selectedSource.agentId}
                    agents={agents}
                    onChange={(id) => setSelectedSource({ ...selectedSource, agentId: id })}
                  />
                  <p className="text-[9px] text-slate-600 mt-1.5">Select an agent to handle discovery tasks for this connector.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => { onScan(selectedSource.id); setIsConfigModalOpen(false); setSelectedSource(null); }}
                  className="px-4 py-2 text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-2"
                >
                  <Zap size={14} /> Test Connection
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsConfigModalOpen(false); setSelectedSource(null); }}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateSource}
                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black tracking-widest rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-900/20"
                  >
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryManagement;
