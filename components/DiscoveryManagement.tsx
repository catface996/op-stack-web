
import React, { useState, useMemo } from 'react';
import { DiscoverySource } from '../types';
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
  ChevronRight
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

interface DiscoveryManagementProps {
  sources: DiscoverySource[];
  onAdd: (source: DiscoverySource) => void;
  onDelete: (id: string) => void;
  onScan: (id: string) => void;
}

const DiscoveryManagement: React.FC<DiscoveryManagementProps> = ({ sources, onAdd, onDelete, onScan }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSource, setNewSource] = useState<Partial<DiscoverySource>>({ type: 'K8s', status: 'Connected' });
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-cyan-900/20 font-bold text-xs uppercase tracking-widest"
        >
          <Plus size={14} /> Add Connector
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

                    <div className="mb-4">
                      <h3 className="text-base font-bold text-white mb-0.5 truncate leading-tight hover:text-cyan-400 transition-colors">{source.name}</h3>
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
                        <button className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all" title="Settings">
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
                        <Zap size={12} /> SCAN NOW
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
                          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
                            {getIcon(source.type)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{source.name}</div>
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
                          <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400" title="Settings">
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
      <div className="mt-6 flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"><ChevronLeft size={14} /> Prev</button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connector Segment</span>
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
                  <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none" onChange={e => setNewSource({...newSource, type: e.target.value as any})}>
                    <option value="K8s">Kubernetes API</option>
                    <option value="Prometheus">Prometheus</option>
                    <option value="Cloud">Public Cloud</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Endpoint / ARN</label>
                  <input required onChange={e => setNewSource({...newSource, endpoint: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none font-mono" placeholder="https://..." />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-widest rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-900/20">
                  <Save size={14} /> Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryManagement;
