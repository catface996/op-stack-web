
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  INITIAL_TOPOLOGY, 
  generateTeamForNode, 
  GLOBAL_SUPERVISOR,
  INITIAL_TOPOLOGY_GROUPS,
  INITIAL_PROMPT_TEMPLATES,
  INITIAL_MODELS,
  INITIAL_TOOLS,
  INITIAL_REPORTS,
  INITIAL_SESSIONS
} from './services/mockData';
import { 
  Team, 
  Agent, 
  LogMessage, 
  AgentStatus,
  AgentFindings,
  AgentConfig,
  TopologyNode,
  TopologyGroup,
  DiagnosisSession,
  AgentRole,
  PromptTemplate,
  AIModel,
  AgentTool,
  Report
} from './types';
import { 
  generateGlobalPlan, 
  generateTeamDelegation, 
  streamWorkerTask, 
  streamTeamReport 
} from './services/geminiService';
import TopologyGraph from './components/TopologyGraph';
import AgentHierarchy from './components/AgentHierarchy';
import LogStream from './components/LogStream';
import ResourceManagement from './components/ResourceManagement';
import TopologiesManagement from './components/TopologiesManagement';
import SubGraphCanvas from './components/SubGraphCanvas';
import Dashboard from './components/Dashboard';
import ResourceDetailView from './components/ResourceDetailView';
import AgentManagement from './components/AgentManagement';
import PromptManagement from './components/PromptManagement';
import ModelManagement from './components/ModelManagement';
import ToolManagement from './components/ToolManagement';
import ReportManagement from './components/ReportManagement';
import ReportDetailView from './components/ReportDetailView';
import AuthPage from './components/AuthPage';
import GlobalChat from './components/GlobalChat';
import { SettingsModal, AppSettings } from './components/SettingsModal';
import { RotateCcw, Activity, Terminal, Map, Send, Zap, LayoutDashboard, Database, Network, X, Stethoscope, Home, Users, FileText, LogOut, Settings, Play } from 'lucide-react';

const App: React.FC = () => {
  const isChatOnly = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'chat';
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({ language: 'en', theme: 'dark' });

  const [currentView, setCurrentView] = useState<'dashboard' | 'diagnosis' | 'resources' | 'resource-detail' | 'topologies' | 'topology-detail' | 'agents' | 'prompts' | 'models' | 'tools' | 'reports' | 'report-detail'>('dashboard');
  const [selectedTopologyId, setSelectedTopologyId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [diagnosisScope, setDiagnosisScope] = useState<TopologyGroup | null>(null);

  const [topology, setTopology] = useState(INITIAL_TOPOLOGY);
  const [teams, setTeams] = useState<Team[]>([]);
  const [topologyGroups, setTopologyGroups] = useState<TopologyGroup[]>(INITIAL_TOPOLOGY_GROUPS);
  const [prompts, setPrompts] = useState<PromptTemplate[]>(INITIAL_PROMPT_TEMPLATES);
  const [models, setModels] = useState<AIModel[]>(INITIAL_MODELS);
  const [tools, setTools] = useState<AgentTool[]>(INITIAL_TOOLS);
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);

  const [globalAgent, setGlobalAgent] = useState<Agent>(GLOBAL_SUPERVISOR);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [userQuery, setUserQuery] = useState("Run a security audit on the Payment Service and check Order DB consistency.");
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeNodeIds, setActiveNodeIds] = useState<Set<string>>(new Set());
  const [activeTeamIds, setActiveTeamIds] = useState<Set<string>>(new Set());
  const [focusTarget, setFocusTarget] = useState<{ agentId: string; ts: number } | null>(null);

  const [sessionHistory, setSessionHistory] = useState<DiagnosisSession[]>(INITIAL_SESSIONS);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(280);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(288);
  const [resizingSide, setResizingSide] = useState<'left' | 'right' | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTeams(prevTeams => {
        return topology.nodes.map(node => {
            const existingTeam = prevTeams.find(t => t.resourceId === node.id);
            if (existingTeam) return { ...existingTeam, name: `${node.label} Team` };
            return generateTeamForNode(node.id, node.label, node.type);
        });
    });
  }, [topology]);

  const dashboardTeams = useMemo(() => {
    if (!diagnosisScope) return teams;
    return teams.filter(t => diagnosisScope.nodeIds.includes(t.resourceId));
  }, [teams, diagnosisScope]);

  const dashboardTopology = useMemo(() => {
    if (!diagnosisScope) return topology;
    const localNodes = topology.nodes.filter(n => diagnosisScope.nodeIds.includes(n.id));
    const localLinks = topology.links.filter(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return diagnosisScope.nodeIds.includes(sourceId) && diagnosisScope.nodeIds.includes(targetId);
    });
    return { nodes: localNodes, links: localLinks };
  }, [topology, diagnosisScope]);

  const addLog = (fromId: string, fromName: string, content: string, type: LogMessage['type'], to?: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), fromAgentName: fromName, fromAgentId: fromId, toAgentId: to, content, type }]);
  };

  const streamLogMessage = async (fromName: string, fromId: string, type: LogMessage['type'], toId: string | undefined, streamGenerator: AsyncGenerator<string>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev, { id, timestamp: Date.now(), fromAgentName: fromName, fromAgentId: fromId, toAgentId: toId, content: '', type, isStreaming: true }]);
    let fullContent = '';
    for await (const chunk of streamGenerator) { if (chunk) { fullContent += chunk; setLogs(prev => prev.map(log => log.id === id ? { ...log, content: fullContent } : log)); } }
    setLogs(prev => prev.map(log => log.id === id ? { ...log, isStreaming: false } : log));
    return fullContent;
  };

  const handleUpdateNode = (updatedNode: TopologyNode) => { setTopology(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n) })); };
  const handleDeleteNode = (nodeId: string) => { setTopology(prev => ({ nodes: prev.nodes.filter(n => n.id !== nodeId), links: prev.links.filter(l => { const s = typeof l.source === 'object' ? (l.source as any).id : l.source; const t = typeof l.target === 'object' ? (l.target as any).id : l.target; return s !== nodeId && t !== nodeId; }) })); setTopologyGroups(prev => prev.map(tg => ({ ...tg, nodeIds: tg.nodeIds.filter(id => id !== nodeId) }))); };

  const handleUpdateAgentConfig = (teamId: string, agentId: string, config: AgentConfig) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      if (t.supervisor.id === agentId) return { ...t, supervisor: { ...t.supervisor, config } };
      return { ...t, members: t.members.map(m => m.id === agentId ? { ...m, config } : m) };
    }));
  };

  const handleDeleteAgent = (teamId: string, agentId: string) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      return { ...t, members: t.members.filter(m => m.id !== agentId) };
    }));
  };

  const handleTraceAgent = (agentId: string) => {
    setFocusTarget({ agentId, ts: Date.now() });
    setCurrentView('diagnosis');
  };

  const handleEnterTopology = (id: string) => { setSelectedTopologyId(id); setCurrentView('topology-detail'); };
  const handleLoadSession = (session: DiagnosisSession) => { if (session.scopeId) { const tg = topologyGroups.find(g => g.id === session.scopeId); setDiagnosisScope(tg || null); } else { setDiagnosisScope(null); } setUserQuery(session.query); setLogs([]); setCurrentView('diagnosis'); };

  const startResizingLeft = useCallback(() => setResizingSide('left'), []);
  const startResizingRight = useCallback(() => setResizingSide('right'), []);
  const stopResizing = useCallback(() => setResizingSide(null), []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
      if (resizingSide === 'left') { const newWidth = mouseMoveEvent.clientX; if (newWidth > 200 && newWidth < 600) setLeftSidebarWidth(newWidth); }
      else if (resizingSide === 'right') { const newWidth = window.innerWidth - mouseMoveEvent.clientX; if (newWidth > 200 && newWidth < 800) setRightSidebarWidth(newWidth); }
    }, [resizingSide]);

  useEffect(() => {
    window.addEventListener("mousemove", resize); window.addEventListener("mouseup", stopResizing);
    if (resizingSide) { document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }
    else { document.body.style.cursor = ""; document.body.style.userSelect = ""; }
    return () => { window.removeEventListener("mousemove", resize); window.removeEventListener("mouseup", stopResizing); };
  }, [resize, stopResizing, resizingSide]);

  const runSimulation = async () => {
    setIsSimulating(true); setLogs([]); setActiveNodeIds(new Set()); setActiveTeamIds(new Set()); setFocusTarget(null);
    const sessionId = Math.random().toString(36).substr(2, 9);
    setSessionHistory(prev => [...prev, { id: sessionId, query: userQuery, timestamp: Date.now(), status: 'Running', findings: { warnings: 0, critical: 0 }, scope: diagnosisScope ? diagnosisScope.name : 'Global System', scopeId: diagnosisScope?.id, relatedNodeIds: [] }]);
    const teamsToConsider = diagnosisScope ? dashboardTeams : teams;
    setGlobalAgent(prev => ({ ...prev, status: AgentStatus.THINKING }));
    const globalPlan = await generateGlobalPlan(userQuery, topology, teamsToConsider);
    if (globalPlan.length === 0) { setGlobalAgent(prev => ({ ...prev, status: AgentStatus.IDLE })); setIsSimulating(false); return; }
    setGlobalAgent(prev => ({ ...prev, status: AgentStatus.WAITING }));
    const planNodeIds = new Set<string>(); const planTeamIds = new Set<string>();
    globalPlan.forEach(p => { const team = teams.find(t => t.id === p.teamId); if (team) { planNodeIds.add(team.resourceId); planTeamIds.add(team.id); } });
    setActiveNodeIds(planNodeIds); setActiveTeamIds(planTeamIds);
    let sessionWarnings = 0; let sessionCritical = 0;
    for (const planItem of globalPlan) {
      const team = teams.find(t => t.id === planItem.teamId); if (!team) continue;
      updateAgentStatus(team.id, team.supervisor.id, AgentStatus.THINKING);
      const assignments = await generateTeamDelegation(team, planItem.instruction);
      updateAgentStatus(team.id, team.supervisor.id, AgentStatus.WAITING);
      const workerResults: any[] = [];
      for (const assignment of assignments) {
        const worker = team.members.find(m => m.id === assignment.agentId); if (!worker) continue;
        updateAgentStatus(team.id, worker.id, AgentStatus.WORKING);
        const rawResult = await streamLogMessage(worker.name, worker.id, 'report', team.supervisor.name, streamWorkerTask(worker, assignment.task, `Node ${team.resourceId} online.`));
        const summaryMatch = rawResult.match(/SUMMARY:\s*({.*?})/);
        if (summaryMatch) { try { const findings = JSON.parse(summaryMatch[1]); updateAgentFindings(team.id, worker.id, findings); sessionWarnings += findings.warnings; sessionCritical += findings.critical; } catch (e) {} }
        updateAgentStatus(team.id, worker.id, AgentStatus.COMPLETED);
        workerResults.push({ agentName: worker.name, result: rawResult });
      }
      updateAgentStatus(team.id, team.supervisor.id, AgentStatus.WORKING); 
      await streamLogMessage(team.supervisor.name, team.supervisor.id, 'report', globalAgent.name, streamTeamReport(team, planItem.instruction, workerResults));
      updateAgentStatus(team.id, team.supervisor.id, AgentStatus.COMPLETED);
    }
    setGlobalAgent(prev => ({ ...prev, status: AgentStatus.COMPLETED })); setIsSimulating(false);
    setSessionHistory(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'Completed', findings: { warnings: sessionWarnings, critical: sessionCritical } } : s));
  };

  const updateAgentStatus = (teamId: string, agentId: string, status: AgentStatus) => { setTeams(prev => prev.map(t => { if (t.id !== teamId) return t; if (t.supervisor.id === agentId) return { ...t, supervisor: { ...t.supervisor, status } }; return { ...t, members: t.members.map(m => m.id === agentId ? { ...m, status } : m) }; })); };
  const updateAgentFindings = (teamId: string, agentId: string, findings: AgentFindings) => { setTeams(prev => prev.map(t => { if (t.id !== teamId) return t; if (t.supervisor.id === agentId) return { ...t, supervisor: { ...t.supervisor, findings } }; return { ...t, members: t.members.map(m => m.id === agentId ? { ...m, findings } : m) }; })); };

  if (isChatOnly) return <GlobalChat nodes={topology.nodes} groups={topologyGroups} teams={teams} isStandalone={true} />;
  if (!isAuthenticated) return <AuthPage onLogin={() => setIsAuthenticated(true)} />;

  const renderMainContent = () => {
    if (currentView === 'dashboard') return <Dashboard nodes={topology.nodes} teams={teams} recentSessions={sessionHistory} isSimulating={isSimulating} onNavigateToDiagnosis={() => setCurrentView('diagnosis')} onLoadSession={handleLoadSession} />;
    if (currentView === 'resources') return <ResourceManagement nodes={topology.nodes} onAdd={(n) => setTopology(prev => ({...prev, nodes: [...prev.nodes, n]}))} onUpdate={handleUpdateNode} onDelete={handleDeleteNode} onViewDetail={(node) => { setSelectedResourceId(node.id); setCurrentView('resource-detail'); }} />;
    if (currentView === 'resource-detail' && selectedResourceId) {
       const node = topology.nodes.find(n => n.id === selectedResourceId);
       if (node) return <ResourceDetailView node={node} team={teams.find(t => t.resourceId === node.id)} associatedTopologyGroups={topologyGroups.filter(tg => tg.nodeIds.includes(node.id))} analysisHistory={sessionHistory.filter(s => s.relatedNodeIds?.includes(node.id))} onLoadSession={handleLoadSession} onBack={() => setCurrentView('resources')} onNavigateToTopology={handleEnterTopology} onUpdateNode={handleUpdateNode} onUpdateAgentConfig={handleUpdateAgentConfig} onAddWorker={() => {}} onRemoveWorker={handleDeleteAgent} />;
    }
    if (currentView === 'topologies') return <TopologiesManagement topologyGroups={topologyGroups} activeScopeId={diagnosisScope?.id} isSimulating={isSimulating} onAdd={(tg) => setTopologyGroups(p => [...p, tg])} onUpdate={(u) => setTopologyGroups(p => p.map(g => g.id === u.id ? u : g))} onDelete={(id) => setTopologyGroups(p => p.filter(g => g.id !== id))} onEnter={handleEnterTopology} onNavigateToDiagnosis={() => setCurrentView('diagnosis')} />;
    if (currentView === 'topology-detail' && selectedTopologyId) {
        const activeTg = topologyGroups.find(tg => tg.id === selectedTopologyId);
        if (activeTg) return <SubGraphCanvas topologyGroup={activeTg} globalTopology={topology} activeScopeId={diagnosisScope?.id} isSimulating={isSimulating} onBack={() => setCurrentView('topologies')} onDiagnose={() => { setDiagnosisScope(activeTg); setCurrentView('diagnosis'); }} onNavigateToDiagnosis={() => setCurrentView('diagnosis')} onAddNode={(nid) => setTopologyGroups(p => p.map(g => g.id === selectedTopologyId ? {...g, nodeIds: [...g.nodeIds, nid]} : g))} onRemoveNode={(nid) => setTopologyGroups(p => p.map(g => g.id === selectedTopologyId ? {...g, nodeIds: g.nodeIds.filter(i => i !== nid)} : g))} onViewResource={(n) => { setSelectedResourceId(n.id); setCurrentView('resource-detail'); }} />;
    }
    if (currentView === 'agents') return <AgentManagement teams={teams} onUpdateAgentConfig={handleUpdateAgentConfig} onDeleteAgent={handleDeleteAgent} onTraceAgent={handleTraceAgent} onManagePrompts={() => setCurrentView('prompts')} onManageModels={() => setCurrentView('models')} onManageTools={() => setCurrentView('tools')} />;
    if (currentView === 'reports') return <ReportManagement reports={reports} onViewReport={(r) => { setSelectedReportId(r.id); setCurrentView('report-detail'); }} />;
    if (currentView === 'report-detail' && selectedReportId) { const report = reports.find(r => r.id === selectedReportId); if (report) return <ReportDetailView report={report} onBack={() => setCurrentView('reports')} />; }

    return (
      <main className="flex-1 flex h-full overflow-hidden">
          <aside ref={sidebarRef} style={{ width: leftSidebarWidth }} className="border-r border-slate-800 bg-slate-900/30 flex flex-col shrink-0 p-3"><AgentHierarchy globalAgent={globalAgent} teams={dashboardTeams} activeTeamIds={activeTeamIds} onAgentClick={(id) => setFocusTarget({ agentId: id, ts: Date.now() })} /></aside>
          <div className="w-1 cursor-col-resize hover:bg-cyan-500 z-50 bg-slate-800" onMouseDown={startResizingLeft}></div>
          <section className="flex-1 flex flex-col min-w-0 bg-slate-950">
              <div className="h-10 border-b border-slate-800 bg-slate-900/80 flex items-center px-4 shrink-0 font-bold text-xs text-slate-400 uppercase tracking-wider">Live Log</div>
              <div className="flex-1 overflow-hidden"><LogStream logs={logs} focusTarget={focusTarget} /></div>
              <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-4"><textarea className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:border-cyan-500 text-slate-200" value={userQuery} onChange={e => setUserQuery(e.target.value)} disabled={isSimulating} /><button onClick={runSimulation} disabled={isSimulating} className="h-12 px-6 bg-cyan-600 rounded-lg font-bold text-white shadow-lg">{isSimulating ? '...' : 'Execute'}</button></div>
          </section>
          <div className="w-1 cursor-col-resize hover:bg-cyan-500 z-50 bg-slate-800" onMouseDown={startResizingRight}></div>
          <aside style={{ width: rightSidebarWidth }} className="border-l border-slate-800 bg-slate-900/30 flex flex-col shrink-0 overflow-hidden"><TopologyGraph data={dashboardTopology} activeNodeIds={activeNodeIds} onNodeClick={() => {}} /></aside>
      </main>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden relative">
      <header className="h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-6 flex-1">
            <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setCurrentView('dashboard')}><Activity className="text-cyan-400" size={20} /><h1 className="text-lg font-bold tracking-tight text-white">EntropyOps</h1></div>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto no-scrollbar max-w-2xl">
                <button onClick={() => setCurrentView('dashboard')} className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md ${currentView === 'dashboard' ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500'}`}><Home size={14} /> Dashboard</button>
                <button onClick={() => setCurrentView('topologies')} className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md ${['topologies', 'topology-detail'].includes(currentView) ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500'}`}><Network size={14} /> Topologies</button>
                <button onClick={() => setCurrentView('resources')} className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md ${['resources', 'resource-detail'].includes(currentView) ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500'}`}><Database size={14} /> Resources</button>
                <button onClick={() => setCurrentView('agents')} className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md ${['agents', 'prompts', 'models', 'tools'].includes(currentView) ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500'}`}><Users size={14} /> Agents</button>
                <button onClick={() => setCurrentView('reports')} className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md ${['reports', 'report-detail'].includes(currentView) ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500'}`}><FileText size={14} /> Reports</button>
            </div>
        </div>
        <div className="flex items-center gap-3 shrink-0"><button onClick={() => setIsSettingsOpen(true)} className="p-1.5 text-slate-500 hover:text-white"><Settings size={16} /></button><button onClick={() => setIsAuthenticated(false)} className="p-1.5 text-slate-500 hover:text-white"><LogOut size={16} /></button></div>
      </header>
      <div className="flex-1 overflow-hidden">{renderMainContent()}</div>
      <GlobalChat nodes={topology.nodes} groups={topologyGroups} teams={teams} />
      {isSettingsOpen && <SettingsModal settings={appSettings} onClose={() => setIsSettingsOpen(false)} onSave={(s) => { setAppSettings(s); setIsSettingsOpen(false); }} />}
    </div>
  );
};

export default App;
