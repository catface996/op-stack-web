
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  INITIAL_TOPOLOGY,
  generateTeamForNode,
  GLOBAL_SUPERVISOR,
  INITIAL_TOPOLOGY_GROUPS,
  INITIAL_PROMPT_TEMPLATES,
  INITIAL_MODELS,
  INITIAL_TOOLS,
  INITIAL_REPORTS,
  INITIAL_SESSIONS,
  INITIAL_REPORT_TEMPLATES,
  INITIAL_DISCOVERY_SOURCES,
  INITIAL_DISCOVERED_DELTA,
  RAW_SCAN_PAYLOADS
} from './services/mockData';
import {
  Team,
  Agent,
  LogMessage,
  AgentStatus,
  TopologyNode,
  TopologyGroup,
  DiagnosisSession,
  DiscoverySource,
  TopologyLink,
  AgentRole,
  Report,
  ReportTemplate
} from './types';
import {
  analyzeInfrastructureDelta,
  generateGlobalPlan,
  generateTeamDelegation,
  streamWorkerTask,
  generateStructuredReport,
  streamGlobalThinking,
  streamTeamLeadThinking,
  generateTeamReport,
  streamGlobalSummary
} from './services/geminiService';
import TopologyGraph from './components/TopologyGraph';
import AgentHierarchy from './components/AgentHierarchy';
import LogStream from './components/LogStream';
import ResourceManagement from './components/ResourceManagement';
import TopologiesManagement from './components/TopologiesManagement';
import SubGraphCanvas from './components/SubGraphCanvas';
import { TopologyDetailView } from './components/topology';
import Dashboard from './components/Dashboard';
import ResourceDetailView from './components/ResourceDetailView';
import ApiResourceDetailView from './components/ApiResourceDetailView';
import AgentManagement from './components/AgentManagement';
import ReportManagement from './components/ReportManagement';
import ReportDetailView from './components/ReportDetailView';
import ReportTemplateManagement from './components/ReportTemplateManagement';
import PromptManagement from './components/PromptManagement';
import { PromptDetailView, UsageManagement } from './components/prompt';
import ModelManagement from './components/ModelManagement';
import ToolManagement from './components/ToolManagement';
import DiscoveryManagement from './components/DiscoveryManagement';
import DiscoveryInbox from './components/DiscoveryInbox';
import ScannerView from './components/ScannerView';
import AuthPage, { UserInfo } from './components/AuthPage';
import { SettingsModal, AppSettings } from './components/SettingsModal';
import GlobalChat from './components/GlobalChat';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import { ROUTES } from './services/routes';
import { Activity, Brain, Database, Network, FileText, LogOut, Settings, Play, Square, Home, Radar, Users, Sparkles, X, FileSearch, Check, Wand2 } from 'lucide-react';

// 本地存储的键名
const AUTH_STORAGE_KEY = 'entropyops_auth';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Wrapper components for route-based rendering with useParams
const TopologyDetailWrapper: React.FC<{
  onViewResource: (resourceId: number) => void;
  topologyGroups: TopologyGroup[];
  topology: { nodes: TopologyNode[]; links: TopologyLink[] };
  diagnosisScope: TopologyGroup | null;
  isSimulating: boolean;
  onDiagnose: (group: TopologyGroup) => void;
  onAddNode: (nodeId: string) => void;
  onRemoveNode: (nodeId: string) => void;
  onCreateLink: (link: { source: string; target: string; type: string }) => void;
}> = ({ onViewResource, topologyGroups, topology, diagnosisScope, isSimulating, onDiagnose, onAddNode, onRemoveNode, onCreateLink }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <NotFound />;

  const topologyIdNum = parseInt(id, 10);

  // If numeric ID, use API-based detail view
  if (!isNaN(topologyIdNum)) {
    return (
      <TopologyDetailView
        topologyId={topologyIdNum}
        onBack={() => navigate(-1)}
        onViewResource={onViewResource}
      />
    );
  }

  // Fallback to legacy SubGraphCanvas for non-numeric IDs (mock data)
  const activeTg = topologyGroups.find(tg => tg.id === id);
  if (!activeTg) return <NotFound />;

  return (
    <SubGraphCanvas
      topologyGroup={activeTg}
      globalTopology={topology}
      activeScopeId={diagnosisScope?.id}
      isSimulating={isSimulating}
      onBack={() => navigate(-1)}
      onDiagnose={() => onDiagnose(activeTg)}
      onNavigateToDiagnosis={() => navigate('/diagnosis')}
      onAddNode={onAddNode}
      onRemoveNode={onRemoveNode}
      onViewResource={(n) => navigate(`/resources/${n.id}`)}
      onCreateLink={onCreateLink}
    />
  );
};

const ResourceDetailWrapper: React.FC<{
  topology: { nodes: TopologyNode[]; links: TopologyLink[] };
  teams: Team[];
  topologyGroups: TopologyGroup[];
  onUpdateNode: (node: TopologyNode) => void;
  onAddWorker: (teamId: string, workerTemplate: { name: string; specialty: string }) => void;
  onRemoveWorker: (teamId: string, agentId: string) => void;
}> = ({ topology, teams, topologyGroups, onUpdateNode, onAddWorker, onRemoveWorker }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <NotFound />;

  const rNode = topology.nodes.find(n => n.id === id);
  if (!rNode) return <NotFound />;

  return (
    <ResourceDetailView
      node={rNode}
      team={teams.find(t => t.resourceId === rNode.id)}
      associatedTopologyGroups={topologyGroups.filter(tg => tg.nodeIds.includes(rNode.id))}
      onBack={() => navigate(-1)}
      onNavigateToTopology={(topologyId) => navigate(`/topologies/${topologyId}`)}
      onUpdateNode={onUpdateNode}
      onUpdateAgentConfig={() => {}}
      onAddWorker={onAddWorker}
      onRemoveWorker={onRemoveWorker}
    />
  );
};

const ApiResourceDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <NotFound />;

  const resourceId = parseInt(id, 10);
  if (isNaN(resourceId)) return <NotFound />;

  return (
    <ApiResourceDetailView
      resourceId={resourceId}
      onBack={() => navigate(-1)}
      onNavigateToTopology={(topologyId) => navigate(`/topologies/${topologyId}`)}
    />
  );
};

const ReportDetailWrapper: React.FC<{ reports: Report[] }> = ({ reports }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <NotFound />;

  const report = reports.find(r => r.id === id);
  if (!report) return <NotFound />;

  return <ReportDetailView report={report} onBack={() => navigate(-1)} />;
};

const PromptDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <NotFound />;

  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return <NotFound />;

  return (
    <PromptDetailView
      templateId={templateId}
      onBack={() => navigate(-1)}
      onEdit={() => navigate('/agents/prompts')}
    />
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({ language: 'en', theme: 'dark' });

  // Check if standalone chat mode is requested via URL parameter
  const isStandaloneChatMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'chat';
  }, []);

  // 初始化时检查本地缓存的登录状态
  useEffect(() => {
    try {
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        const userData: UserInfo = JSON.parse(cached);
        // 可选：检查登录是否过期（例如7天）
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - userData.loginTime < sevenDays) {
          setCurrentUser(userData);
          setIsAuthenticated(true);
        } else {
          // 登录已过期，清除缓存
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to restore auth state:', e);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  // 登录处理
  const handleLogin = useCallback((user: UserInfo) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    // 保存到本地缓存
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }, []);

  // 退出登录
  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    // 清除本地缓存
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const [discoverySubView, setDiscoverySubView] = useState<'connectors' | 'inbox'>('connectors');

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [diagnosisScope, setDiagnosisScope] = useState<TopologyGroup | null>(null);
  const [scannerLogs, setScannerLogs] = useState<LogMessage[]>([]);

  // 报告生成状态
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // 数据状态
  const [topology, setTopology] = useState(INITIAL_TOPOLOGY);
  const [teams, setTeams] = useState<Team[]>([]);
  const [topologyGroups, setTopologyGroups] = useState<TopologyGroup[]>(INITIAL_TOPOLOGY_GROUPS);
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [discoverySources, setDiscoverySources] = useState<DiscoverySource[]>(INITIAL_DISCOVERY_SOURCES);
  const [discoveredDelta, setDiscoveredDelta] = useState<{nodes: TopologyNode[], links: TopologyLink[]}>(INITIAL_DISCOVERED_DELTA);

  const [globalAgent, setGlobalAgent] = useState<Agent>(GLOBAL_SUPERVISOR);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [userQuery, setUserQuery] = useState("Analyze system state and health status.");
  const [isSimulating, setIsSimulating] = useState(false);
  const [focusTarget, setFocusTarget] = useState<{ agentId: string; ts: number } | null>(null);
  const abortRef = useRef(false);

  const [leftSidebarWidth, setLeftSidebarWidth] = useState(280);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(340);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // 拖拽调整宽度的处理函数
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizingLeft) {
      const newWidth = Math.max(200, Math.min(500, e.clientX));
      setLeftSidebarWidth(newWidth);
    }
    if (isResizingRight) {
      const newWidth = Math.max(250, Math.min(600, window.innerWidth - e.clientX));
      setRightSidebarWidth(newWidth);
    }
  }, [isResizingLeft, isResizingRight]);

  const handleMouseUp = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  useEffect(() => {
    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    setTeams(prevTeams => topology.nodes.map(node => {
        const existingTeam = prevTeams.find(t => t.resourceId === node.id);
        return existingTeam || generateTeamForNode(node.id, node.label, node.type);
    }));
  }, [topology]);

  const activeTeams = useMemo(() => {
      if (!diagnosisScope) return teams;
      return teams.filter(t => diagnosisScope.nodeIds.includes(t.resourceId));
  }, [teams, diagnosisScope]);

  // 计算当前正在工作的 agent 对应的资源节点 ID（用于拓扑图高亮）
  const activeNodeIds = useMemo(() => {
    const nodeIds = new Set<string>();
    teams.forEach(team => {
      const isTeamActive =
        team.supervisor.status === AgentStatus.THINKING ||
        team.supervisor.status === AgentStatus.WORKING ||
        team.members.some(m => m.status === AgentStatus.THINKING || m.status === AgentStatus.WORKING);
      if (isTeamActive) {
        nodeIds.add(team.resourceId);
      }
    });
    return nodeIds;
  }, [teams]);

  const dashboardTopology = useMemo(() => {
    const base = diagnosisScope ? {
      nodes: topology.nodes.filter(n => diagnosisScope.nodeIds.includes(n.id)),
      links: topology.links.filter(l => {
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return diagnosisScope.nodeIds.includes(s) && diagnosisScope.nodeIds.includes(t);
      })
    } : topology;

    return {
        nodes: [...base.nodes, ...discoveredDelta.nodes.map(n => ({...n, isShadow: true}))],
        links: [...base.links, ...discoveredDelta.links.map(l => ({...l, type: 'inferred' as any}))]
    };
  }, [topology, diagnosisScope, discoveredDelta]);

  // --- 中断诊断 ---
  const handleAbortDiagnosis = () => {
    abortRef.current = true;
    setLogs(prev => [...prev, {
      id: `sys-abort-${Date.now()}`,
      timestamp: Date.now(),
      fromAgentId: 'sys',
      fromAgentName: 'SYSTEM',
      content: '⚠️ MISSION ABORTED - Diagnosis interrupted by user.',
      type: 'system'
    }]);
    // 重置所有 agent 状态
    setGlobalAgent(p => ({ ...p, status: AgentStatus.IDLE, findings: undefined }));
    setTeams(prev => prev.map(t => ({
      ...t,
      supervisor: { ...t.supervisor, status: AgentStatus.IDLE, findings: undefined },
      members: t.members.map(m => ({ ...m, status: AgentStatus.IDLE, currentTask: undefined, findings: undefined }))
    })));
    setIsSimulating(false);
  };

  // --- 执行诊断逻辑：分级协作流 ---
  const handleExecuteDiagnosis = async () => {
    if (isSimulating || !userQuery.trim()) return;

    abortRef.current = false;
    setIsSimulating(true);
    const teamResults: { teamName: string; warnings: number; critical: number }[] = [];

    // 系统启动消息
    setLogs([{
      id: `sys-${Date.now()}`,
      timestamp: Date.now(),
      fromAgentId: 'sys',
      fromAgentName: 'SYSTEM',
      content: `╔════════════════════════════════════════════════════════╗\n║  MISSION INITIATED                                     ║\n╠════════════════════════════════════════════════════════╣\n║  Directive: "${userQuery.substring(0, 40)}${userQuery.length > 40 ? '...' : ''}"  \n║  Scope: ${diagnosisScope?.name || 'GLOBAL INFRASTRUCTURE'}  \n║  Timestamp: ${new Date().toISOString()}  \n╚════════════════════════════════════════════════════════╝`,
      type: 'system'
    }]);

    await delay(800);
    if (abortRef.current) return;

    // 1. Global Orchestrator 开始思考
    setGlobalAgent(p => ({ ...p, status: AgentStatus.THINKING }));

    // 流式输出 Global Orchestrator 的思考过程
    const globalThinkLogId = `gs-think-${Date.now()}`;
    setLogs(prev => [...prev, {
      id: globalThinkLogId,
      timestamp: Date.now(),
      fromAgentId: globalAgent.id,
      fromAgentName: globalAgent.name,
      content: '',
      type: 'thought',
      isStreaming: true
    }]);

    let globalThinkContent = '';
    for await (const chunk of streamGlobalThinking(userQuery, activeTeams)) {
      if (abortRef.current) return;
      globalThinkContent += chunk;
      setLogs(prev => prev.map(l => l.id === globalThinkLogId ? { ...l, content: globalThinkContent } : l));
    }
    setLogs(prev => prev.map(l => l.id === globalThinkLogId ? { ...l, isStreaming: false } : l));
    if (abortRef.current) return;

    // 生成执行计划
    const plan = await generateGlobalPlan(userQuery, topology, activeTeams);
    setGlobalAgent(p => ({ ...p, status: AgentStatus.WORKING }));

    // 输出任务分配
    const planSummary = plan.map(p => {
      const team = teams.find(t => t.id === p.teamId);
      return `  → ${team?.name || 'Unknown'} [${p.priority}]`;
    }).join('\n');

    setLogs(prev => [...prev, {
      id: `gs-plan-${Date.now()}`,
      timestamp: Date.now(),
      fromAgentId: globalAgent.id,
      fromAgentName: globalAgent.name,
      content: `Task Distribution Matrix:\n${planSummary}\n\nInitiating parallel team coordination...`,
      type: 'instruction'
    }]);

    await delay(500);
    if (abortRef.current) return;

    // 2. 逐级分发到各 Team Supervisor
    for (const step of plan) {
      if (abortRef.current) return;
      const team = teams.find(t => t.id === step.teamId);
      if (!team) continue;

      // 更新 Team Supervisor 状态
      setTeams(prev => prev.map(t =>
        t.id === team.id
          ? { ...t, supervisor: { ...t.supervisor, status: AgentStatus.THINKING } }
          : t
      ));

      // Global -> Team Lead 指令
      setLogs(prev => [...prev, {
        id: `to-team-${team.id}-${Date.now()}`,
        timestamp: Date.now(),
        fromAgentId: globalAgent.id,
        fromAgentName: globalAgent.name,
        toAgentId: team.supervisor.id,
        content: step.instruction,
        type: 'instruction'
      }]);

      await delay(400);
      if (abortRef.current) return;

      // Team Lead 思考过程
      const leadThinkLogId = `lead-think-${team.id}-${Date.now()}`;
      setLogs(prev => [...prev, {
        id: leadThinkLogId,
        timestamp: Date.now(),
        fromAgentId: team.supervisor.id,
        fromAgentName: team.supervisor.name,
        content: '',
        type: 'thought',
        isStreaming: true
      }]);

      let leadThinkContent = '';
      for await (const chunk of streamTeamLeadThinking(team, step.instruction)) {
        if (abortRef.current) return;
        leadThinkContent += chunk;
        setLogs(prev => prev.map(l => l.id === leadThinkLogId ? { ...l, content: leadThinkContent } : l));
      }
      setLogs(prev => prev.map(l => l.id === leadThinkLogId ? { ...l, isStreaming: false } : l));
      if (abortRef.current) return;

      // Team Lead 状态变为工作中
      setTeams(prev => prev.map(t =>
        t.id === team.id
          ? { ...t, supervisor: { ...t.supervisor, status: AgentStatus.WORKING } }
          : t
      ));

      // 3. Team Supervisor 下发给 Worker
      const delegations = await generateTeamDelegation(team, step.instruction);
      const workerResults: { warnings: number; critical: number }[] = [];

      for (const del of delegations) {
        if (abortRef.current) return;
        const worker = team.members.find(m => m.id === del.agentId);
        if (!worker) continue;

        // 更新 Worker 状态
        setTeams(prev => prev.map(t =>
          t.id === team.id
            ? {
                ...t,
                members: t.members.map(m =>
                  m.id === worker.id ? { ...m, status: AgentStatus.WORKING, currentTask: del.task.substring(0, 50) } : m
                )
              }
            : t
        ));

        // Team Lead -> Worker 指令
        setLogs(prev => [...prev, {
          id: `to-worker-${worker.id}-${Date.now()}`,
          timestamp: Date.now(),
          fromAgentId: team.supervisor.id,
          fromAgentName: team.supervisor.name,
          toAgentId: worker.id,
          content: del.task,
          type: 'instruction'
        }]);

        await delay(300);
        if (abortRef.current) return;

        // 4. Worker 任务执行（流式输出）
        const stream = streamWorkerTask(worker, del.task, team.name);
        let fullContent = '';
        const logId = `worker-run-${worker.id}-${Date.now()}`;
        setLogs(prev => [...prev, {
          id: logId,
          timestamp: Date.now(),
          fromAgentId: worker.id,
          fromAgentName: worker.name,
          content: '',
          type: 'thought',
          isStreaming: true
        }]);

        for await (const chunk of stream) {
          if (abortRef.current) return;
          fullContent += chunk;
          setLogs(prev => prev.map(l => l.id === logId ? { ...l, content: fullContent } : l));
        }
        setLogs(prev => prev.map(l => l.id === logId ? { ...l, isStreaming: false } : l));
        if (abortRef.current) return;

        // 解析 Worker 结果
        const warningMatch = fullContent.match(/Warnings:\s*(\d+)/);
        const criticalMatch = fullContent.match(/Critical:\s*(\d+)/);
        const warnings = warningMatch ? parseInt(warningMatch[1]) : 0;
        const critical = criticalMatch ? parseInt(criticalMatch[1]) : 0;
        workerResults.push({ warnings, critical });

        // 更新 Worker 状态和发现
        setTeams(prev => prev.map(t =>
          t.id === team.id
            ? {
                ...t,
                members: t.members.map(m =>
                  m.id === worker.id
                    ? { ...m, status: AgentStatus.COMPLETED, findings: { warnings, critical } }
                    : m
                )
              }
            : t
        ));

        await delay(200);
      }

      // Team Lead 汇总报告
      const totalWarnings = workerResults.reduce((sum, r) => sum + r.warnings, 0);
      const totalCritical = workerResults.reduce((sum, r) => sum + r.critical, 0);
      teamResults.push({ teamName: team.name, warnings: totalWarnings, critical: totalCritical });

      // 更新 Team Supervisor 状态和发现
      setTeams(prev => prev.map(t =>
        t.id === team.id
          ? {
              ...t,
              supervisor: {
                ...t.supervisor,
                status: AgentStatus.COMPLETED,
                findings: { warnings: totalWarnings, critical: totalCritical }
              }
            }
          : t
      ));

      // Team Lead -> Global Orchestrator 报告
      const teamReport = generateTeamReport(team.name, workerResults);
      setLogs(prev => [...prev, {
        id: `rep-${team.id}-${Date.now()}`,
        timestamp: Date.now(),
        fromAgentId: team.supervisor.id,
        fromAgentName: team.supervisor.name,
        toAgentId: globalAgent.id,
        content: teamReport,
        type: 'report'
      }]);

      await delay(300);
      if (abortRef.current) return;
    }

    // 5. Global Orchestrator 最终汇总
    if (abortRef.current) return;
    setGlobalAgent(p => ({ ...p, status: AgentStatus.THINKING }));

    const summaryLogId = `gs-summary-${Date.now()}`;
    setLogs(prev => [...prev, {
      id: summaryLogId,
      timestamp: Date.now(),
      fromAgentId: globalAgent.id,
      fromAgentName: globalAgent.name,
      content: '',
      type: 'report',
      isStreaming: true
    }]);

    let summaryContent = '';
    for await (const chunk of streamGlobalSummary(teamResults)) {
      if (abortRef.current) return;
      summaryContent += chunk;
      setLogs(prev => prev.map(l => l.id === summaryLogId ? { ...l, content: summaryContent } : l));
    }
    setLogs(prev => prev.map(l => l.id === summaryLogId ? { ...l, isStreaming: false } : l));
    if (abortRef.current) return;

    // 更新 Global Orchestrator 状态
    const globalWarnings = teamResults.reduce((sum, r) => sum + r.warnings, 0);
    const globalCritical = teamResults.reduce((sum, r) => sum + r.critical, 0);
    setGlobalAgent(p => ({
      ...p,
      status: AgentStatus.COMPLETED,
      findings: { warnings: globalWarnings, critical: globalCritical }
    }));

    // 系统结束消息
    setLogs(prev => [...prev, {
      id: `sys-end-${Date.now()}`,
      timestamp: Date.now(),
      fromAgentId: 'sys',
      fromAgentName: 'SYSTEM',
      content: `Mission sequence complete. Diagnostics archived. Ready for next directive.`,
      type: 'system'
    }]);

    setIsSimulating(false);
  };

  const handleCreateFinalReport = (newReport: Report) => {
      setReports(prev => [...prev, newReport]);
      navigate(ROUTES.REPORTS);
      setIsGeneratingReport(false);
  };

  const handleScan = (sourceId: string) => {
    const source = discoverySources.find(s => s.id === sourceId);
    if (!source) return;

    // Navigate to scanner view - don't auto-scan, just show welcome message
    setSelectedSourceId(sourceId);
    navigate('/scanner');
    setScannerLogs([
      {
        id: 'sys-welcome',
        timestamp: Date.now(),
        fromAgentId: 'scouter',
        fromAgentName: 'Scouter Agent',
        content: `Successfully connected to ${source.name} (${source.type}).\n\nI'm ready to help you discover and manage your infrastructure. You can:\n- Ask me to "scan" for new resources\n- Query about the current topology\n- Get help understanding discovered nodes\n\nWhat would you like to do?`,
        type: 'report'
      }
    ]);
  };

  // Handle scanner chat message
  const handleScannerMessage = async (message: string) => {
    const source = discoverySources.find(s => s.id === selectedSourceId);
    if (!source) return;

    // Add user message
    setScannerLogs(prev => [...prev, {
      id: `user-${Date.now()}`,
      timestamp: Date.now(),
      fromAgentId: 'user',
      fromAgentName: 'You',
      content: message,
      type: 'user' as any
    }]);

    setIsSimulating(true);

    // Simulate agent thinking
    await delay(1000);

    // Check if user wants to scan again
    if (message.toLowerCase().includes('scan') || message.toLowerCase().includes('refresh')) {
      setScannerLogs(prev => [...prev, {
        id: `scouter-${Date.now()}`,
        timestamp: Date.now(),
        fromAgentId: 'scouter',
        fromAgentName: 'Scouter Agent',
        content: `Initiating a fresh scan of ${source.name}...`,
        type: 'system'
      }]);

      await delay(1200);
      const rawPayload = source.type === 'K8s' ? RAW_SCAN_PAYLOADS.k8s : RAW_SCAN_PAYLOADS.trace;
      const delta = await analyzeInfrastructureDelta(rawPayload);

      setScannerLogs(prev => [...prev, {
        id: `scouter-result-${Date.now()}`,
        timestamp: Date.now(),
        fromAgentId: 'scouter',
        fromAgentName: 'Scouter Agent',
        content: `Re-scan complete. Found ${delta.nodes.length} resource(s).\n\n${delta.reasoning}`,
        type: 'report'
      }]);

      setDiscoveredDelta(prev => ({ nodes: [...prev.nodes, ...delta.nodes], links: [...prev.links, ...delta.links] }));
    } else {
      // Generic response
      setScannerLogs(prev => [...prev, {
        id: `scouter-${Date.now()}`,
        timestamp: Date.now(),
        fromAgentId: 'scouter',
        fromAgentName: 'Scouter Agent',
        content: `I'm monitoring the ${source.type} infrastructure at ${source.endpoint}.\n\nCurrently tracking ${topology.nodes.length} managed resources and ${discoveredDelta.nodes.length} pending discovery.\n\nYou can ask me to:\n- Scan for new resources\n- Explain discovered nodes\n- Check connection status`,
        type: 'report'
      }]);
    }

    setIsSimulating(false);
  };

  const handleApproveNode = (node: TopologyNode) => {
    setTopology(prev => ({ ...prev, nodes: [...prev.nodes, {...node, isShadow: false}] }));
    setDiscoveredDelta(prev => ({ ...prev, nodes: prev.nodes.filter(n => n.id !== node.id) }));
  };

  // 创建新链接
  const handleCreateLink = useCallback((link: { source: string; target: string; type: string }) => {
    setTopology(prev => ({
      ...prev,
      links: [...prev.links, {
        source: link.source,
        target: link.target,
        type: link.type as any
      }]
    }));
  }, []);

  // Worker management handlers
  const handleAddWorker = useCallback((teamId: string, workerTemplate: { name: string, specialty: string }) => {
    const newWorker: Agent = {
      id: `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: workerTemplate.name,
      role: AgentRole.WORKER,
      specialty: workerTemplate.specialty,
      status: AgentStatus.IDLE,
      findings: { warnings: 0, critical: 0 },
      config: {
        model: 'gemini-2.0-flash',
        temperature: 0.3,
        systemInstruction: `You are a specialized ${workerTemplate.specialty} worker agent.`
      }
    };
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, members: [...t.members, newWorker] } : t
    ));
  }, []);

  const handleRemoveWorker = useCallback((teamId: string, agentId: string) => {
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, members: t.members.filter(m => m.id !== agentId) } : t
    ));
  }, []);

  const handleDeleteAgent = useCallback((teamId: string, agentId: string) => {
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, members: t.members.filter(m => m.id !== agentId) } : t
    ));
  }, []);

  const handleUpdateAgentConfig = useCallback((teamId: string, agentId: string, config: any) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      if (t.supervisor.id === agentId) {
        return { ...t, supervisor: { ...t.supervisor, config } };
      }
      return { ...t, members: t.members.map(m => m.id === agentId ? { ...m, config } : m) };
    }));
  }, []);

  // Diagnosis view component
  const DiagnosisView = () => (
    <div className="flex-1 flex h-full overflow-hidden">
        <aside style={{ width: leftSidebarWidth }} className="bg-slate-900/20 p-2 overflow-y-auto custom-scrollbar text-xs shrink-0">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-2 flex justify-between items-center">
                <span>Hierarchy Stack</span>
                {diagnosisScope && <button onClick={() => setDiagnosisScope(null)} className="text-cyan-400 hover:text-white transition-colors">Global View</button>}
            </div>
            <AgentHierarchy globalAgent={globalAgent} teams={activeTeams} activeTeamIds={new Set()} onAgentClick={(agentId) => setFocusTarget({ agentId, ts: Date.now() })} />
        </aside>
        {/* 左侧拖拽分隔条 */}
        <div
          className="w-1 bg-slate-800 hover:bg-cyan-500 cursor-col-resize transition-colors shrink-0"
          onMouseDown={() => setIsResizingLeft(true)}
        />
        <section className="flex-1 flex flex-col bg-slate-950 min-w-0">
            <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-cyan-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time collaboration stream</span>
                </div>
                {diagnosisScope && <div className="text-[9px] px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-bold uppercase">Focus: {diagnosisScope.name}</div>}
            </div>
            <div className="flex-1 overflow-hidden"><LogStream logs={logs} focusTarget={focusTarget} /></div>
            <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 bg-slate-950 border border-slate-700 rounded-xl px-4">
                    <Sparkles size={16} className="text-cyan-500" />
                    <input className="flex-1 h-12 bg-transparent text-sm text-slate-200 focus:outline-none" value={userQuery} onChange={e => setUserQuery(e.target.value)} placeholder="Submit directive for hierarchical execution..." />
                </div>

                <div className="flex gap-2">
                    {logs.length > 0 && !isSimulating && diagnosisScope && (
                       <button
                          onClick={() => setIsGeneratingReport(true)}
                          className="h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
                       >
                          <FileSearch size={14} /> GENERATE REPORT
                       </button>
                    )}
                    {isSimulating ? (
                      <button onClick={handleAbortDiagnosis} className="h-12 px-8 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 animate-pulse">
                        <Square size={14} fill="currentColor" /> ABORT
                      </button>
                    ) : (
                      <button onClick={handleExecuteDiagnosis} className="h-12 px-8 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95">
                        <Play size={14} fill="currentColor" /> EXECUTE
                      </button>
                    )}
                </div>
            </div>
        </section>
        {/* 右侧拖拽分隔条 */}
        <div
          className="w-1 bg-slate-800 hover:bg-cyan-500 cursor-col-resize transition-colors shrink-0"
          onMouseDown={() => setIsResizingRight(true)}
        />
        <aside style={{ width: rightSidebarWidth }} className="bg-slate-900/20 relative shrink-0">
            <div className="absolute top-0 left-0 w-full h-10 border-b border-slate-800 bg-slate-900/40 z-10 flex items-center px-4 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Topology Monitor</div>
            <TopologyGraph data={dashboardTopology} activeNodeIds={activeNodeIds} onNodeClick={() => {}} onCreateLink={handleCreateLink} showLegend={false} />
        </aside>
    </div>
  );

  // Discovery view component
  const DiscoveryView = () => (
    <div className="flex flex-col h-full bg-slate-950">
       <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-6">
          <button onClick={() => setDiscoverySubView('connectors')} className={`py-3 text-sm font-bold border-b-2 transition-all ${discoverySubView === 'connectors' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>Connectors</button>
          <button onClick={() => setDiscoverySubView('inbox')} className={`py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${discoverySubView === 'inbox' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
              Inbox {discoveredDelta.nodes.length > 0 && <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>}
          </button>
       </div>
       <div className="flex-1 overflow-hidden">
          {discoverySubView === 'connectors' ? <DiscoveryManagement sources={discoverySources} agents={[globalAgent, ...teams.flatMap(t => [t.supervisor, ...t.members])]} onAdd={(s) => setDiscoverySources(p => [...p, s])} onUpdate={(s) => setDiscoverySources(p => p.map(x => x.id === s.id ? s : x))} onDelete={(id) => setDiscoverySources(p => p.filter(x => x.id !== id))} onScan={handleScan} /> : <DiscoveryInbox discoveredNodes={discoveredDelta.nodes} discoveredLinks={discoveredDelta.links} onApproveNode={handleApproveNode} onRejectNode={(id) => setDiscoveredDelta(p => ({...p, nodes: p.nodes.filter(n => n.id !== id)}))} onClear={() => setDiscoveredDelta({nodes: [], links: []})} />}
       </div>
    </div>
  );

  // Scanner view component
  const ScannerViewWrapper = () => {
    const selectedSource = discoverySources.find(s => s.id === selectedSourceId);
    if (!selectedSource) return <Navigate to={ROUTES.DISCOVERY} replace />;

    return (
      <ScannerView
        source={selectedSource}
        managedNodes={topology.nodes}
        managedLinks={topology.links}
        discoveredNodes={discoveredDelta.nodes}
        discoveredLinks={discoveredDelta.links}
        logs={scannerLogs}
        isScanning={isSimulating}
        onBack={() => navigate(ROUTES.DISCOVERY)}
        onSendMessage={handleScannerMessage}
        onApproveNode={handleApproveNode}
        onRejectNode={(id) => setDiscoveredDelta(p => ({...p, nodes: p.nodes.filter(n => n.id !== id)}))}
      />
    );
  };

  if (!isAuthenticated) {
      return <AuthPage onLogin={handleLogin} />;
  }

  // Render standalone chat mode if requested via URL parameter
  if (isStandaloneChatMode) {
    return <GlobalChat nodes={topology.nodes} groups={topologyGroups} teams={teams} isStandalone={true} />;
  }

  return (
    <>
      <Routes>
        <Route element={<Layout currentUser={currentUser} onLogout={handleLogout} onOpenSettings={() => setIsSettingsOpen(true)} />}>
          {/* Dashboard */}
          <Route index element={<Dashboard nodes={topology.nodes} teams={teams} recentSessions={INITIAL_SESSIONS} isSimulating={isSimulating} onNavigateToDiagnosis={() => navigate('/diagnosis')} onLoadSession={(s) => { navigate('/diagnosis'); setUserQuery(s.query); }} />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />

          {/* Topologies */}
          <Route path="topologies" element={<TopologiesManagement activeScopeId={diagnosisScope?.id} isSimulating={isSimulating} onEnter={(id) => navigate(`/topologies/${id}`)} onNavigateToDiagnosis={() => navigate('/diagnosis')} />} />
          <Route path="topologies/:id" element={
            <TopologyDetailWrapper
              onViewResource={(resourceId) => navigate(`/resources/${resourceId}`)}
              topologyGroups={topologyGroups}
              topology={topology}
              diagnosisScope={diagnosisScope}
              isSimulating={isSimulating}
              onDiagnose={(group) => { setDiagnosisScope(group); navigate('/diagnosis'); }}
              onAddNode={(nid) => setTopologyGroups(p => p.map(g => g.nodeIds.includes(nid) ? g : {...g, nodeIds: [...g.nodeIds, nid]}))}
              onRemoveNode={(nid) => setTopologyGroups(p => p.map(g => ({...g, nodeIds: g.nodeIds.filter(i => i !== nid)})))}
              onCreateLink={handleCreateLink}
            />
          } />

          {/* Resources */}
          <Route path="resources" element={<ResourceManagement onViewDetail={(resource) => navigate(`/resources/${resource.id}`)} />} />
          <Route path="resources/:id" element={<ApiResourceDetailWrapper />} />

          {/* Legacy resource detail for mock data */}
          <Route path="legacy-resources/:id" element={
            <ResourceDetailWrapper
              topology={topology}
              teams={teams}
              topologyGroups={topologyGroups}
              onUpdateNode={(n) => setTopology(prev => ({...prev, nodes: prev.nodes.map(x => x.id === n.id ? n : x)}))}
              onAddWorker={handleAddWorker}
              onRemoveWorker={handleRemoveWorker}
            />
          } />

          {/* Agents */}
          <Route path="agents" element={<AgentManagement teams={teams} onUpdateAgentConfig={handleUpdateAgentConfig} onDeleteAgent={handleDeleteAgent} onManagePrompts={() => navigate('/agents/prompts')} onManageModels={() => navigate('/agents/models')} onManageTools={() => navigate('/agents/tools')} />} />
          <Route path="agents/prompts" element={<PromptManagement onBack={() => navigate(-1)} />} />
          <Route path="prompts/:id" element={<PromptDetailWrapper />} />
          <Route path="prompts/usages" element={<UsageManagement onBack={() => navigate(-1)} />} />
          <Route path="agents/models" element={<ModelManagement onBack={() => navigate(-1)} />} />
          <Route path="agents/tools" element={<ToolManagement tools={INITIAL_TOOLS} onAdd={() => {}} onUpdate={() => {}} onDelete={() => {}} onBack={() => navigate(-1)} />} />

          {/* Reports */}
          <Route path="reports" element={<ReportManagement reports={reports} onViewReport={(r) => navigate(`/reports/${r.id}`)} onManageTemplates={() => navigate('/reports/templates')} />} />
          <Route path="reports/templates" element={<ReportTemplateManagement templates={INITIAL_REPORT_TEMPLATES} onAdd={() => {}} onUpdate={() => {}} onDelete={() => {}} onBack={() => navigate(-1)} />} />
          <Route path="reports/:id" element={<ReportDetailWrapper reports={reports} />} />

          {/* Discovery */}
          <Route path="discovery" element={<DiscoveryView />} />
          <Route path="scanner" element={<ScannerViewWrapper />} />

          {/* Diagnosis */}
          <Route path="diagnosis" element={<DiagnosisView />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      {isSettingsOpen && <SettingsModal settings={appSettings} onClose={() => setIsSettingsOpen(false)} onSave={(s) => { setAppSettings(s); setIsSettingsOpen(false); }} />}
      {isGeneratingReport && diagnosisScope && (
          <ReportGenerationModal
            topology={diagnosisScope}
            logs={logs}
            query={userQuery}
            onClose={() => setIsGeneratingReport(false)}
            onSave={handleCreateFinalReport}
          />
      )}
      {/* Global Chatbot - appears on all pages */}
      <GlobalChat nodes={topology.nodes} groups={topologyGroups} teams={teams} />
    </>
  );
};

// --- Report Generation Modal Helper ---

const ReportGenerationModal: React.FC<{
    topology: TopologyGroup,
    logs: LogMessage[],
    query: string,
    onClose: () => void,
    onSave: (report: Report) => void
}> = ({ topology, logs, query, onClose, onSave }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(topology.templateIds?.[0] || null);
    const [isThinking, setIsThinking] = useState(false);
    const [previewContent, setPreviewContent] = useState<string | null>(null);

    const boundTemplates = useMemo(() => {
        return INITIAL_REPORT_TEMPLATES.filter(tpl => topology.templateIds?.includes(tpl.id));
    }, [topology.templateIds]);

    const handleGeneratePreview = async () => {
        const tpl = INITIAL_REPORT_TEMPLATES.find(x => x.id === selectedTemplateId);
        if (!tpl) return;

        setIsThinking(true);
        const content = await generateStructuredReport(tpl, logs, topology, query);
        setPreviewContent(content);
        setIsThinking(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-950/40 rounded-xl text-indigo-400 border border-indigo-500/20 shadow-lg">
                            <Wand2 size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">AI Report Generator</h3>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Context: {topology.name}</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Template Selector */}
                    <div className="w-72 border-r border-slate-800 bg-slate-950/30 p-5 flex flex-col overflow-y-auto">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">Select bound template</label>
                        <div className="space-y-2">
                            {boundTemplates.length > 0 ? boundTemplates.map(tpl => (
                                <button
                                    key={tpl.id}
                                    onClick={() => setSelectedTemplateId(tpl.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTemplateId === tpl.id ? 'bg-indigo-600 border-indigo-500 shadow-xl' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                                >
                                    <div className={`text-xs font-bold ${selectedTemplateId === tpl.id ? 'text-white' : 'text-slate-300'}`}>{tpl.name}</div>
                                    <div className={`text-[9px] mt-1 line-clamp-2 ${selectedTemplateId === tpl.id ? 'text-indigo-100' : 'text-slate-500'}`}>{tpl.description}</div>
                                </button>
                            )) : (
                                <div className="p-4 bg-red-950/20 border border-red-900/30 rounded text-[10px] text-red-400 italic font-bold">
                                    No templates bound to this topology. Go to Management to link schemas.
                                </div>
                            )}
                        </div>

                        {selectedTemplateId && !previewContent && !isThinking && (
                            <button
                                onClick={handleGeneratePreview}
                                className="mt-8 w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
                            >
                                <Sparkles size={14} /> Generate Preview
                            </button>
                        )}
                    </div>

                    {/* Right: Preview Area */}
                    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
                        {isThinking ? (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Generating report content...</p>
                            </div>
                        ) : previewContent ? (
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar prose prose-invert prose-sm max-w-none">
                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 pb-2 border-b border-slate-800">Draft Document Generated</div>
                                <div className="font-sans leading-relaxed text-slate-300 whitespace-pre-wrap">{previewContent}</div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-800">
                                <FileSearch size={64} className="mb-4 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Select Template to Begin</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-bold">Cancel</button>
                    <button
                        disabled={!previewContent}
                        onClick={() => {
                            const tpl = INITIAL_REPORT_TEMPLATES.find(x => x.id === selectedTemplateId);
                            onSave({
                                id: `rep-${Date.now()}`,
                                title: `${topology.name} - Post Diagnosis Audit`,
                                type: tpl?.category === 'Security' ? 'Security' : 'Diagnosis',
                                status: 'Final',
                                createdAt: Date.now(),
                                author: 'AI Orchestrator',
                                summary: `Automated synthesis report based on inquiry: "${query}"`,
                                content: previewContent || '',
                                tags: ['Automated', 'Diagnosis', topology.name],
                                topologyId: topology.id
                            });
                        }}
                        className="px-8 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-30 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-2"
                    >
                        <Check size={16} /> Finalize & Store Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;
