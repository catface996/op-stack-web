
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useReport } from '../services/hooks/useReport';
import type { ReportDTO } from '../services/api/types';
import {
  ArrowLeft,
  Printer,
  Download,
  Calendar,
  User,
  FileText,
  BarChart,
  FileCheck,
  Lock,
  PieChart as PieChartIcon,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import html2pdf from 'html2pdf.js';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ReportDetailViewProps {
  reportId: number;
  onBack: () => void;
}

// --- Helper Components ---

// 1. Mermaid Diagram Renderer
const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    const renderDiagram = async () => {
      if (containerRef.current) {
        try {
          mermaid.initialize({ 
             startOnLoad: false, 
             theme: 'dark',
             securityLevel: 'loose',
             fontFamily: 'ui-sans-serif, system-ui, sans-serif'
          });
          
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          // Mermaid's render function returns an object { svg: string }
          const { svg } = await mermaid.render(id, chart);
          setSvg(svg);
        } catch (error) {
          console.error("Mermaid render error:", error);
          setSvg(`<div class="text-red-500 text-xs p-2 border border-red-900 rounded bg-red-950/20">Failed to render diagram. Syntax error?</div>`);
        }
      }
    };
    renderDiagram();
  }, [chart]);

  return (
    <div 
        ref={containerRef} 
        className="my-6 flex justify-center bg-slate-950/50 p-4 rounded-lg border border-slate-800"
        dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};

// 2. Chart Renderer (Recharts via JSON)
const DataChart: React.FC<{ configString: string }> = ({ configString }) => {
    let config: any = {};
    try {
        config = JSON.parse(configString);
    } catch (e) {
        return <div className="text-red-500 text-xs">Invalid Chart JSON</div>;
    }

    const COLORS = ['#22d3ee', '#818cf8', '#34d399', '#f472b6', '#fbbf24'];

    const renderChart = () => {
        if (config.type === 'bar') {
            return (
                <ReBarChart data={config.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey={config.xKey} stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} />
                    <Legend />
                    {config.series.map((s: any, i: number) => (
                        <Bar key={s.key} dataKey={s.key} fill={s.color || COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                    ))}
                </ReBarChart>
            );
        }
        if (config.type === 'line') {
             return (
                <LineChart data={config.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey={config.xKey} stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} />
                    <Legend />
                    {config.series.map((s: any, i: number) => (
                        <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color || COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    ))}
                </LineChart>
            );
        }
        if (config.type === 'area') {
            return (
               <AreaChart data={config.data}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                   <XAxis dataKey={config.xKey} stroke="#94a3b8" fontSize={12} />
                   <YAxis stroke="#94a3b8" fontSize={12} />
                   <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} />
                   <Legend />
                   {config.series.map((s: any, i: number) => (
                       <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color || COLORS[i % COLORS.length]} fill={s.color || COLORS[i % COLORS.length]} fillOpacity={0.3} />
                   ))}
               </AreaChart>
           );
       }
       if (config.type === 'pie') {
           return (
               <PieChart>
                   <Pie
                      data={config.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label
                   >
                     {config.data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} />
                   <Legend />
               </PieChart>
           );
       }
       return <div>Unknown chart type</div>;
    };

    return (
        <div className="w-full h-[300px] my-6 bg-slate-950/30 rounded-xl border border-slate-800 p-4">
             <ResponsiveContainer width="100%" height="100%">
                 {renderChart()}
             </ResponsiveContainer>
        </div>
    );
};


const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200];
const DEFAULT_ZOOM = 100;

const ReportDetailView: React.FC<ReportDetailViewProps> = ({ reportId, onBack }) => {
  const { report, loading, error, notFound, refresh } = useReport({ id: reportId });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle fullscreen change events (including ESC key exit)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const zoomIn = useCallback(() => {
    setZoomLevel(prev => {
      const currentIndex = ZOOM_LEVELS.indexOf(prev);
      if (currentIndex < ZOOM_LEVELS.length - 1) {
        return ZOOM_LEVELS[currentIndex + 1];
      }
      return prev;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const currentIndex = ZOOM_LEVELS.indexOf(prev);
      if (currentIndex > 0) {
        return ZOOM_LEVELS[currentIndex - 1];
      }
      return prev;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(DEFAULT_ZOOM);
  }, []);

  const exportPDF = useCallback(async () => {
    if (!contentRef.current || isExporting || !report) return;

    setIsExporting(true);

    // Store current zoom and reset to 100% for export
    const previousZoom = zoomLevel;
    setZoomLevel(100);

    // Wait for React to re-render with 100% zoom
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const element = contentRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#0f172a'
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (pdfError) {
      console.error('PDF export error:', pdfError);
    } finally {
      // Restore previous zoom level
      setZoomLevel(previousZoom);
      setIsExporting(false);
    }
  }, [report, isExporting, zoomLevel]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Security': return <Lock size={20} className="text-red-400" />;
      case 'Performance': return <BarChart size={20} className="text-orange-400" />;
      case 'Audit': return <FileCheck size={20} className="text-blue-400" />;
      default: return <FileText size={20} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Final': return 'bg-green-950/30 text-green-400 border-green-900';
      case 'Draft': return 'bg-yellow-950/30 text-yellow-400 border-yellow-900';
      case 'Archived': return 'bg-slate-800 text-slate-400 border-slate-700';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-slate-500">Loading report...</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={48} className="animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  // Error state (including not found)
  if (error || notFound) {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-slate-500">{notFound ? 'Report not found' : 'Error loading report'}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <AlertCircle size={48} className="text-red-400 mb-4" />
          <p className="text-red-400 font-bold mb-4">{error}</p>
          {!notFound && (
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all"
            >
              <RefreshCw size={16} /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // No report data
  if (!report) {
    return null;
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="flex justify-between items-center mb-6 shrink-0">
           <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
                title="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                 <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                    {getTypeIcon(report.type)}
                    {report.title}
                 </h2>
                 <div className="text-xs text-slate-500 font-mono mt-1">ID: {report.id}</div>
              </div>
           </div>
           <div className="flex gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-900 border border-slate-800 rounded">
                <button
                  onClick={zoomOut}
                  disabled={zoomLevel === ZOOM_LEVELS[0]}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  onClick={resetZoom}
                  className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors min-w-[48px]"
                  title="Reset Zoom"
                >
                  {zoomLevel}%
                </button>
                <button
                  onClick={zoomIn}
                  disabled={zoomLevel === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs font-bold text-slate-300 hover:text-white transition-colors"
                title="Fullscreen"
              >
                  <Maximize2 size={14} /> Fullscreen
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs font-bold text-slate-300 hover:text-white transition-colors">
                  <Printer size={14} /> Print
              </button>
              <button
                onClick={exportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white rounded text-xs font-bold transition-colors shadow-lg shadow-cyan-900/20"
              >
                  {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
           </div>
        </div>
      )}

      {/* Fullscreen Controls - Only shown in fullscreen */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-900/90 border border-slate-700 rounded-lg backdrop-blur-sm shadow-lg">
            <button
              onClick={zoomOut}
              disabled={zoomLevel === ZOOM_LEVELS[0]}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={resetZoom}
              className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors min-w-[48px]"
              title="Reset Zoom"
            >
              {zoomLevel}%
            </button>
            <button
              onClick={zoomIn}
              disabled={zoomLevel === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>
          {/* Exit Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all backdrop-blur-sm shadow-lg"
            title="Exit Fullscreen (ESC)"
          >
            <Minimize2 size={14} /> Exit
          </button>
        </div>
      )}

      {/* Main Content Scrollable Area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
         <div
           ref={contentRef}
           className={`mx-auto space-y-6 ${isFullscreen ? 'max-w-5xl' : 'max-w-4xl'} pdf-content`}
           style={{
             transform: `scale(${zoomLevel / 100})`,
             transformOrigin: 'top center',
             width: `${100 / (zoomLevel / 100)}%`,
           }}
         >

            {/* Metadata Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</div>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(report.status)}`}>
                           {report.status}
                        </span>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date Generated</div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                           <Calendar size={14} /> {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Author</div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                           <User size={14} /> {report.author}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tags</div>
                        <div className="flex flex-wrap gap-1">
                           {(report.tags || []).map(tag => (
                               <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-400">
                                   {tag}
                               </span>
                           ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Body (Rich Markdown Rendering) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-sm min-h-[500px]">
                 <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({node, inline, className, children, ...props}: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const lang = match ? match[1] : '';
                                
                                if (!inline && lang === 'mermaid') {
                                    return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                                }
                                
                                if (!inline && lang === 'json') {
                                    // Check if this is a chart definition by trying to parse it
                                    // simple heuristic: check if user wrote something that looks like our chart config
                                    const content = String(children);
                                    if (content.includes('"type":') && content.includes('"data":')) {
                                         return <DataChart configString={content} />;
                                    }
                                }

                                return !inline && match ? (
                                    <pre className={className}>
                                        <code {...props} className={className}>
                                            {children}
                                        </code>
                                    </pre>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                );
                            }
                        }}
                    >
                        {report.content}
                    </ReactMarkdown>
                 </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ReportDetailView;
