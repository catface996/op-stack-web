
import React, { useState, useEffect } from 'react';
import { useReports } from '../services/hooks/useReports';
import type { ReportDTO, ReportType } from '../services/api/types';
import {
  FileText,
  Search,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  User,
  Tag,
  FileCheck,
  BarChart,
  Lock,
  ArrowUpRight,
  Settings,
  Clock,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  BookOpen,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  X
} from 'lucide-react';

interface ReportManagementProps {
  onViewReport: (report: ReportDTO) => void;
  onManageTemplates: () => void;
}

const ITEMS_PER_PAGE = 8;

const ReportManagement: React.FC<ReportManagementProps> = ({ onViewReport, onManageTemplates }) => {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [localSearch, setLocalSearch] = useState('');
  const [localTypeFilter, setLocalTypeFilter] = useState<string>('All');
  const [deleteConfirm, setDeleteConfirm] = useState<ReportDTO | null>(null);

  const {
    reports,
    loading,
    error,
    page,
    totalPages,
    total,
    typeFilter,
    keyword,
    setPage,
    setTypeFilter,
    setKeyword,
    refresh,
    handleDelete,
    deleting,
  } = useReports({ size: ITEMS_PER_PAGE });

  // Debounced search - update keyword after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setKeyword]);

  // Convert local type filter to API type filter
  const handleTypeFilterChange = (type: string) => {
    setLocalTypeFilter(type);
    if (type === 'All') {
      setTypeFilter(undefined);
    } else {
      setTypeFilter(type as ReportType);
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'Security': return { color: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-900/40', icon: Lock, accent: 'bg-red-600' };
      case 'Performance': return { color: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-900/40', icon: BarChart, accent: 'bg-orange-600' };
      case 'Audit': return { color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-900/40', icon: FileCheck, accent: 'bg-blue-600' };
      default: return { color: 'text-cyan-400', bg: 'bg-cyan-950/30', border: 'border-cyan-900/40', icon: FileText, accent: 'bg-cyan-600' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Final': return 'text-green-400 bg-green-950/40 border-green-500/30';
      case 'Draft': return 'text-yellow-400 bg-yellow-950/40 border-yellow-500/30';
      case 'Archived': return 'text-slate-500 bg-slate-900 border-slate-700';
      default: return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
             <FileText className="text-cyan-400" /> Operational Intelligence
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Aggregated system audits and multi-agent synthesis reports.</p>
        </div>
        <div className="flex gap-2">
            <button
                onClick={onManageTemplates}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-all text-xs font-bold tracking-widest"
            >
                <BookOpen size={14} /> Templates
            </button>
            <button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all text-xs font-bold tracking-widest shadow-lg shadow-cyan-900/20">
                <Zap size={14} /> Auto-generate
            </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 shrink-0">
         <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
            <div className="relative w-full sm:w-72">
               <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
               <input
                  type="text"
                  placeholder="Filter by title, tag, or metadata..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/60 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200 transition-all"
               />
            </div>
            <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800 overflow-x-auto no-scrollbar">
                {['All', 'Diagnosis', 'Security', 'Performance', 'Audit'].map(type => (
                   <button
                      key={type}
                      onClick={() => handleTypeFilterChange(type)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all whitespace-nowrap ${localTypeFilter === type ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     {type}
                   </button>
                ))}
            </div>
         </div>
         <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                    <LayoutList size={16} />
                </button>
                <button onClick={() => setViewMode('card')} className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                    <LayoutGrid size={16} />
                </button>
            </div>
            <div className="hidden sm:block text-[10px] font-black text-slate-500 tracking-widest">
                Total: <span className="text-white">{total}</span> reports
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
          {/* Loading State */}
          {loading && (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                 <Loader2 size={48} className="animate-spin text-cyan-400 mb-4" />
                 <p className="text-sm font-medium">Loading reports...</p>
             </div>
          )}

          {/* Error State */}
          {!loading && error && (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-red-950/10 border border-dashed border-red-900/40 rounded-2xl">
                 <AlertCircle size={48} className="text-red-400 mb-4" />
                 <p className="text-sm font-bold text-red-400 mb-4">{error}</p>
                 <button
                    onClick={refresh}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all text-sm font-medium"
                 >
                    <RefreshCw size={16} /> Retry
                 </button>
             </div>
          )}

          {/* Content */}
          {!loading && !error && reports.length > 0 ? (
             viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6 auto-rows-fr">
                    {reports.map(report => {
                        const style = getTypeStyle(report.type);
                        return (
                            <div 
                                key={report.id} 
                                className="relative bg-slate-900 border border-slate-800/80 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all group flex flex-col min-h-[240px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-950/10 cursor-pointer"
                                onClick={() => onViewReport(report)}
                            >
                               {/* Type Accent */}
                               <div className={`h-1 w-full ${style.accent} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
                               
                               <div className="p-5 flex flex-col flex-1">
                                   <div className="flex justify-between items-start mb-4">
                                       <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                           <div className={`p-2 rounded-lg shrink-0 ${style.bg} border ${style.border} ${style.color}`}>
                                               <style.icon size={20} />
                                           </div>
                                           <div className="min-w-0 overflow-hidden">
                                               <h3 className="text-base font-bold text-white mb-0.5 truncate group-hover:text-cyan-400 transition-colors leading-tight" title={report.title}>{report.title}</h3>
                                               <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] opacity-80">{report.type} ANALYSIS</div>
                                           </div>
                                       </div>
                                       <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${getStatusColor(report.status)}`}>
                                           {report.status === 'Final' && <span className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>}
                                           {report.status}
                                       </div>
                                   </div>

                                   <p className="text-xs text-slate-400 line-clamp-3 mb-5 flex-1 leading-relaxed italic opacity-80">
                                       "{report.summary}"
                                   </p>

                                   <div className="flex flex-wrap gap-1.5 mb-5">
                                       {(report.tags || []).map(tag => (
                                           <span key={tag} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-tighter hover:text-cyan-400 transition-colors">
                                               #{tag}
                                           </span>
                                       ))}
                                   </div>

                                   {/* Card Footer */}
                                   <div className="mt-auto pt-4 border-t border-slate-800/40 flex justify-between items-center shrink-0">
                                       <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                                                <Calendar size={10} /> {new Date(report.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                                                <User size={10} /> {report.author.split(' ')[0]}
                                            </div>
                                       </div>
                                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                           <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(report); }} className="p-1.5 hover:bg-red-950/50 rounded-lg text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                           <button onClick={(e) => { e.stopPropagation(); onViewReport(report); }} className="p-1.5 bg-cyan-600/10 text-cyan-400 rounded-lg"><ArrowRight size={14}/></button>
                                       </div>
                                   </div>
                               </div>
                            </div>
                        );
                    })}
                </div>
             ) : (
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Report Entity</th>
                                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Status</th>
                                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-center">System Tags</th>
                                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                            {reports.map(report => {
                                const style = getTypeStyle(report.type);
                                return (
                                <tr key={report.id} className="hover:bg-slate-800/40 transition-colors group cursor-pointer" onClick={() => onViewReport(report)}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg border ${style.bg} ${style.border} ${style.color}`}>
                                                <style.icon size={18} />
                                            </div>
                                            <div className="min-w-0 overflow-hidden">
                                                <div className="font-bold text-white group-hover:text-cyan-400 transition-colors text-sm truncate max-w-xs" title={report.title}>{report.title}</div>
                                                <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                    <span className="font-mono">{report.id}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                    <span className="uppercase tracking-widest font-black">{report.author}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border tracking-widest ${getStatusColor(report.status)}`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {(report.tags || []).slice(0, 2).map(tag => (
                                                <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                                                    {tag}
                                                </span>
                                            ))}
                                            {(report.tags || []).length > 2 && <span className="text-[8px] text-slate-600 font-bold">+{(report.tags || []).length - 2}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-[10px] text-slate-600 font-mono hidden md:inline">{new Date(report.createdAt).toLocaleDateString()}</span>
                                            <button onClick={(e) => { e.stopPropagation(); onViewReport(report); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400"><Eye size={16} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(report); }} className="p-2 hover:bg-red-950/50 rounded-lg text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
             )
          ) : null}

          {/* Empty State */}
          {!loading && !error && reports.length === 0 && (
             <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
                 <FileText size={48} className="opacity-10 mb-4" />
                 <p className="text-sm font-bold tracking-wide">No specialized intelligence reports found in archive.</p>
             </div>
          )}
      </div>

      {/* Pagination */}
      {!loading && !error && reports.length > 0 && (
      <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
          <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
          >
              <ChevronLeft size={14} /> Prev
          </button>
          <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 tracking-widest">Library segment</span>
              <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{page}</span>
              <span className="text-[10px] text-slate-500 font-bold">/</span>
              <span className="text-xs text-slate-400 font-mono font-bold">{Math.max(1, totalPages)}</span>
          </div>
          <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
          >
              Next <ChevronRight size={14} />
          </button>
      </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-5 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 size={20} className="text-red-400" />
                Delete Report
              </h3>
              <button onClick={() => setDeleteConfirm(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-slate-300 text-sm mb-2">
                Are you sure you want to delete this report?
              </p>
              <p className="text-slate-400 text-xs bg-slate-950 px-3 py-2 rounded border border-slate-800 font-medium">
                "{deleteConfirm.title}"
              </p>
              <p className="text-red-400/80 text-xs mt-3">
                This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const success = await handleDelete(deleteConfirm.id);
                  if (success) {
                    setDeleteConfirm(null);
                  }
                }}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition-all text-sm font-bold flex items-center gap-2"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;
