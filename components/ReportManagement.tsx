
import React, { useState, useMemo } from 'react';
import { Report } from '../types';
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
  Lock
} from 'lucide-react';

interface ReportManagementProps {
  reports: Report[];
  onViewReport: (report: Report) => void;
}

const ITEMS_PER_PAGE = 8;

const ReportManagement: React.FC<ReportManagementProps> = ({ reports, onViewReport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.summary.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All' || r.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [reports, searchTerm, typeFilter]);

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = filteredReports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Security': return <Lock size={16} className="text-red-400" />;
      case 'Performance': return <BarChart size={16} className="text-orange-400" />;
      case 'Audit': return <FileCheck size={16} className="text-blue-400" />;
      default: return <FileText size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div><h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><FileText className="text-cyan-400" /> Reports Management</h2><p className="text-slate-400 text-sm mt-1">Access generated diagnosis logs and audits.</p></div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between mb-4 gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800 shrink-0">
         <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
            <div className="relative w-full sm:w-64">
               <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
               <input type="text" placeholder="Search reports..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-slate-200" />
            </div>
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700">
                {['All', 'Diagnosis', 'Security', 'Performance', 'Audit'].map(type => (
                   <button key={type} onClick={() => { setTypeFilter(type); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${typeFilter === type ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>{type}</button>
                ))}
            </div>
         </div>
         <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutList size={16} /></button>
                <button onClick={() => setViewMode('card')} className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={16} /></button>
            </div>
            <div className="text-xs text-slate-500 font-mono"><span className="text-white font-bold">{paginatedReports.length}</span> / {filteredReports.length}</div>
         </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative">
          {paginatedReports.length > 0 ? (
             viewMode === 'list' ? (
                <div className="bg-slate-900/30 border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Title</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Type</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-900">
                            {paginatedReports.map(report => (
                            <tr key={report.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => onViewReport(report)}>
                                <td className="p-4"><div className="font-bold text-slate-200">{report.title}</div><div className="text-xs text-slate-500">{report.id}</div></td>
                                <td className="p-4"><div className="flex items-center gap-2 text-sm text-slate-300">{getTypeIcon(report.type)}<span>{report.type}</span></div></td>
                                <td className="p-4 text-right"><button onClick={(e) => { e.stopPropagation(); onViewReport(report); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-cyan-400"><Eye size={16} /></button></td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                    {paginatedReports.map(report => (
                        <div key={report.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/30 hover:bg-slate-800/80 transition-all group flex flex-col h-[220px] cursor-pointer" onClick={() => onViewReport(report)}>
                           <div className="flex justify-between items-start mb-4">
                               <div className="p-2.5 rounded-lg bg-slate-950 text-slate-400 border border-slate-800">{getTypeIcon(report.type)}</div>
                               <button onClick={(e) => { e.stopPropagation(); onViewReport(report); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all"><Eye size={18} /></button>
                           </div>
                           <h3 className="text-base font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">{report.title}</h3>
                           <p className="text-xs text-slate-400 line-clamp-2 mb-4 flex-1">{report.summary}</p>
                           <div className="mt-auto pt-4 border-t border-slate-800/50 flex justify-between text-[10px] text-slate-500"><span className="flex items-center gap-1.5 font-medium"><Calendar size={12}/> {new Date(report.createdAt).toLocaleDateString()}</span><span className="flex items-center gap-1.5 font-medium"><User size={12}/> {report.author}</span></div>
                        </div>
                    ))}
                </div>
             )
          ) : (
             <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl"><FileText size={48} className="opacity-20 mb-4" /><p>No reports found.</p></div>
          )}
      </div>

      <div className="mt-4 flex justify-center items-center gap-4 pt-2 border-t border-slate-900 shrink-0">
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm text-slate-400">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{Math.max(1, totalPages)}</span></span>
          <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

export default ReportManagement;
