
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  INITIAL_TOPOLOGY, 
  generateTeamForNode, 
  GLOBAL_SUPERVISOR,
  INITIAL_TOPOLOGY_GROUPS,
  INITIAL_PROMPT_TEMPLATES,
  INITIAL_MODELS,
  INITIAL_TOOLS
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
  AgentTool
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
import SubGraphManagement from './components/SubGraphManagement';
import SubGraphCanvas from './components/SubGraphCanvas';
import Dashboard from './components/Dashboard';
import ResourceDetailView from './components/ResourceDetailView';
import AgentManagement from './components/AgentManagement';
import PromptManagement from './components/PromptManagement';
import ModelManagement from './components/ModelManagement';
import ToolManagement from './components/ToolManagement';
import { RotateCcw, Activity, Terminal, Map, Send, Zap, GripVertical, LayoutDashboard, Database, Network, X, Stethoscope, Home, Users, FileText } from 'lucide-react';

const App: React.FC = () => {
  // Navigation State
  // 'dashboard' is now the new High Level Dashboard
  // 'diagnosis' is the old interactive Command Center view
  const [currentView, setCurrentView] = useState<'dashboard' | 'diagnosis' | 'resources' | 'resource-detail' | 'topologies' | 'topology-detail' | 'agents' | 'prompts' | 'models' | 'tools'>('dashboard');
  const [selectedTopologyId, setSelectedTopologyId] = useState<string | null>(null);
  
  // Resource Detail State
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  // Diagnosis State (Scopes the dashboard to a specific topology)
  const [diagnosisScope, setDiagnosisScope] = useState<TopologyGroup | null>(null);

  // State
  const [topology, setTopology] = useState(INITIAL_TOPOLOGY);
  const [teams, setTeams] = useState<Team[]>([]);
  const [topologyGroups, setTopologyGroups] = useState<TopologyGroup[]>(INITIAL_TOPOLOGY_GROUPS);
  const [prompts, setPrompts] = useState<PromptTemplate[]>(INITIAL_PROMPT_TEMPLATES);
  const [models, setModels] = useState<AIModel[]>(INITIAL_MODELS);
  const [tools, setTools] = useState<AgentTool[]>(INITIAL_TOOLS);

  const [globalAgent, setGlobalAgent] = useState<Agent>(GLOBAL_SUPERVISOR);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [userQuery, setUserQuery] = useState("Run a security audit on the Payment Service and check Order DB consistency.");
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeNodeIds, setActiveNodeIds] = useState<Set<string>>(new Set());
  const [activeTeamIds, setActiveTeamIds] = useState<Set<string>>(new Set());
  const [focusTarget, setFocusTarget] = useState<{ agentId: string; ts: number } | null>(null);

  // History State for Dashboard
  const [sessionHistory, setSessionHistory] = useState<DiagnosisSession[]>([]);

  // Layout State
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(280);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(288); // Default w-72 equivalent
  const [resizingSide, setResizingSide] = useState<'left' | 'right' | null>(null);
  
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Initialization - Auto-generate teams when topology changes
  useEffect(() => {
    // Only generate teams for new nodes to preserve state of existing teams
    // Or just regenerate all if simplifed. For now, let's just regenerate to sync with topology updates (Delete/Add)
    // In a real app, we would diff. Here we reconstruct but try to preserve IDs if possible or just reset.
    // To allow persistence of agent config, we should map existing teams.
    
    setTeams(prevTeams => {
        return topology.nodes.map(node => {
            const existingTeam = prevTeams.find(t => t.resourceId === node.id);
            if (existingTeam) {
                 // Update name if label changed, but keep agents
                 return { ...existingTeam, name: `${node.label} Team` };
            }
            return generateTeamForNode(node.id, node.label, node.type);
        });
    });
    
    // Note: This effect runs on every topology change (add/remove node).
  }, [topology]);

  // Derived State for Dashboard (Filtered by Diagnosis Scope)
  const dashboardTeams = useMemo(() => {
    if (!diagnosisScope) return teams;
    return teams.filter(t => diagnosisScope.nodeIds.includes(t.resourceId));
  }, [teams, diagnosisScope]);

  const dashboardTopology = useMemo(() => {
    if (!diagnosisScope) return topology;
    // Filter to only nodes/links in the scope
    const localNodes = topology.nodes.filter(n => diagnosisScope.nodeIds.includes(n.id));
    const localLinks = topology.links.filter(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return diagnosisScope.nodeIds.includes(sourceId) && diagnosisScope.nodeIds.includes(targetId);
    });
    return { nodes: localNodes, links: localLinks };
  }, [topology, diagnosisScope]);


  // Logging Helpers
  const addLog = (fromId: string, fromName: string, content: string, type: LogMessage['type'], to?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      fromAgentName: fromName,
      fromAgentId: fromId, 
      toAgentId: to,
      content,
      type
    }]);
  };

  const streamLogMessage = async (
    fromName: string,
    fromId: string,
    type: LogMessage['type'],
    toId: string | undefined,
    streamGenerator: AsyncGenerator<string>
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    // Init empty streaming log
    setLogs(prev => [...prev, {
      id,
      timestamp: Date.now(),
      fromAgentName: fromName,
      fromAgentId: fromId, 
      toAgentId: toId,
      content: '',
      type,
      isStreaming: true
    }]);

    let fullContent = '';
    for await (const chunk of streamGenerator) {
       if (chunk) {
           fullContent += chunk;
           setLogs(prev => prev.map(log => 
               log.id === id ? { ...log, content: fullContent } : log
           ));
       }
    }
    
    // Finish streaming
    setLogs(prev => prev.map(log => 
        log.id === id ? { ...log, isStreaming: false } : log
    ));
    
    return fullContent;
  };

  // --- CRUD Logic for Resources ---
  const handleAddNode = (newNode: TopologyNode) => {
    setTopology(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    addLog("system-admin", "System", `Resource added: ${newNode.label}`, "system");
  };

  const handleUpdateNode = (updatedNode: TopologyNode) => {
    setTopology(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    setTopology(prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      links: prev.links.filter(l => {
        // Handle both string IDs and D3 object references (just in case)
        const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return sourceId !== nodeId && targetId !== nodeId;
      })
    }));
    
    // Also remove from topology groups
    setTopologyGroups(prev => prev.map(tg => ({
        ...tg,
        nodeIds: tg.nodeIds.filter(id => id !== nodeId)
    })));
    addLog("system-admin", "System", `Resource deleted: ${nodeId}`, "system");
  };

  const handleUpdateAgentConfig = (teamId: string, agentId: string, config: AgentConfig) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;

      // Check Supervisor
      if (t.supervisor.id === agentId) {
        return { ...t, supervisor: { ...t.supervisor, config } };
      }

      // Check Members
      return {
        ...t,
        members: t.members.map(m => m.id === agentId ? { ...m, config } : m)
      };
    }));
    addLog("system-admin", "System", `Updated configuration for Agent ID: ${agentId}`, "system");
  };

  const handleAddWorker = (teamId: string, workerTemplate: { name: string, specialty: string }) => {
      setTeams(prev => prev.map(t => {
          if (t.id !== teamId) return t;
          
          const newId = `${teamId}-w-${Math.floor(Math.random() * 10000)}`;
          const newWorker: Agent = {
              id: newId,
              name: workerTemplate.name,
              role: AgentRole.WORKER,
              specialty: workerTemplate.specialty,
              status: AgentStatus.IDLE,
              findings: { warnings: 0, critical: 0 },
              config: {
                  model: 'gemini-2.5-flash',
                  temperature: 0.7,
                  systemInstruction: `You are a ${workerTemplate.name} specialized in ${workerTemplate.specialty}. Report findings concisely.`,
                  defaultContext: ''
              }
          };

          return { ...t, members: [...t.members, newWorker] };
      }));
      addLog("system-admin", "System", `Deployed new worker "${workerTemplate.name}" to team.`, "system");
  };

  const handleRemoveWorker = (teamId: string, agentId: string) => {
      setTeams(prev => prev.map(t => {
          if (t.id !== teamId) return t;
          const removedAgent = t.members.find(m => m.id === agentId);
          if (removedAgent) {
              addLog("system-admin", "System", `Decommissioned worker "${removedAgent.name}" from team.`, "system");
          }
          return {
              ...t,
              members: t.members.filter(m => m.id !== agentId)
          };
      }));
  };

  const handleViewResourceDetail = (node: TopologyNode) => {
    setSelectedResourceId(node.id);
    setCurrentView('resource-detail');
  };

  // --- CRUD Logic for Topologies ---
  const handleAddTopologyGroup = (tg: TopologyGroup) => {
      setTopologyGroups(prev => [...prev, tg]);
      addLog("system-admin", "System", `Topology created: ${tg.name}`, "system");
  };

  const handleUpdateTopologyGroup = (updatedTg: TopologyGroup) => {
      setTopologyGroups(prev => prev.map(tg => tg.id === updatedTg.id ? updatedTg : tg));
      addLog("system-admin", "System", `Topology updated: ${updatedTg.name}`, "system");
  };

  const handleDeleteTopologyGroup = (id: string) => {
      setTopologyGroups(prev => prev.filter(tg => tg.id !== id));
      addLog("system-admin", "System", `Topology deleted: ${id}`, "system");
  };

  const handleEnterTopology = (id: string) => {
      setSelectedTopologyId(id);
      setCurrentView('topology-detail');
  };

  const handleDiagnoseFromTopology = () => {
    const tg = topologyGroups.find(s => s.id === selectedTopologyId);
    if (tg) {
        setDiagnosisScope(tg);
        setCurrentView('diagnosis'); // Switch to Diagnosis View
        setUserQuery(`Run a full diagnosis on ${tg.name} subsystem.`);
        setLogs([]); // Clear logs for a fresh start
        addLog("system-diag", "System", `Entered Diagnosis Mode for Topology: ${tg.name}`, "system");
    }
  };

  const clearDiagnosisScope = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent bubbling if clicked inside the clickable scope badge
    setDiagnosisScope(null);
    setUserQuery("");
    addLog("system-diag", "System", "Diagnosis scope cleared. Returning to Global view.", "system");
  };

  const handleAddNodeToTopology = (nodeId: string) => {
      if (!selectedTopologyId) return;
      setTopologyGroups(prev => prev.map(tg => {
          if (tg.id === selectedTopologyId && !tg.nodeIds.includes(nodeId)) {
              return { ...tg, nodeIds: [...tg.nodeIds, nodeId] };
          }
          return tg;
      }));
  };

  const handleRemoveNodeFromTopology = (nodeId: string) => {
      if (!selectedTopologyId) return;
      setTopologyGroups(prev => prev.map(tg => {
          if (tg.id === selectedTopologyId) {
              return { ...tg, nodeIds: tg.nodeIds.filter(id => id !== nodeId) };
          }
          return tg;
      }));
  };

  const handleLoadSession = (session: DiagnosisSession) => {
      // Restore Scope
      if (session.scopeId) {
          const tg = topologyGroups.find(g => g.id === session.scopeId);
          setDiagnosisScope(tg || null);
      } else {
          setDiagnosisScope(null);
      }
      
      // Restore Query
      setUserQuery(session.query);
      
      // Reset logs/status for re-run preparation
      setLogs([]); 
      addLog("system", "System", `Restored context from session: ${session.id}`, "system");

      setCurrentView('diagnosis');
  };

  // --- CRUD Logic for Prompts ---
  const handleAddPrompt = (prompt: PromptTemplate) => {
      setPrompts(prev => [...prev, prompt]);
      addLog("system-admin", "System", `Prompt template created: ${prompt.name}`, "system");
  };

  const handleUpdatePrompt = (prompt: PromptTemplate) => {
      setPrompts(prev => prev.map(p => p.id === prompt.id ? prompt : p));
      addLog("system-admin", "System", `Prompt template updated: ${prompt.name}`, "system");
  };

  const handleDeletePrompt = (id: string) => {
      setPrompts(prev => prev.filter(p => p.id !== id));
      addLog("system-admin", "System", `Prompt template deleted: ${id}`, "system");
  };

  // --- CRUD Logic for Models ---
  const handleAddModel = (model: AIModel) => {
    setModels(prev => [...prev, model]);
    addLog("system-admin", "System", `Model added: ${model.name}`, "system");
  };

  const handleUpdateModel = (model: AIModel) => {
    setModels(prev => prev.map(m => m.id === model.id ? model : m));
    addLog("system-admin", "System", `Model updated: ${model.name}`, "system");
  };

  const handleDeleteModel = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
    addLog("system-admin", "System", `Model deleted: ${id}`, "system");
  };

  // --- CRUD Logic for Tools ---
  const handleAddTool = (tool: AgentTool) => {
    setTools(prev => [...prev, tool]);
    addLog("system-admin", "System", `Tool created: ${tool.name}`, "system");
  };

  const handleUpdateTool = (tool: AgentTool) => {
    setTools(prev => prev.map(t => t.id === tool.id ? tool : t));
    addLog("system-admin", "System", `Tool updated: ${tool.name}`, "system");
  };

  const handleDeleteTool = (id: string) => {
    setTools(prev => prev.filter(t => t.id !== id));
    addLog("system-admin", "System", `Tool deleted: ${id}`, "system");
  };


  // --- Resizing Logic ---
  const startResizingLeft = useCallback(() => {
    setResizingSide('left');
  }, []);

  const startResizingRight = useCallback(() => {
    setResizingSide('right');
  }, []);

  const stopResizing = useCallback(() => {
    setResizingSide(null);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (resizingSide === 'left') {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth > 200 && newWidth < 600) {
          setLeftSidebarWidth(newWidth);
        }
      } else if (resizingSide === 'right') {
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        if (newWidth > 200 && newWidth < 800) {
          setRightSidebarWidth(newWidth);
        }
      }
    },
    [resizingSide]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    
    if (resizingSide) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing, resizingSide]);

  // --- Simulation Logic ---

  const runSimulation = async () => {
    setIsSimulating(true);
    setLogs([]);
    setActiveNodeIds(new Set());
    setActiveTeamIds(new Set());
    setFocusTarget(null);
    resetAllAgentStats();

    // Create a new session entry
    const sessionId = Math.random().toString(36).substr(2, 9);
    setSessionHistory(prev => [...prev, {
      id: sessionId,
      query: userQuery,
      timestamp: Date.now(),
      status: 'Running',
      findings: { warnings: 0, critical: 0 },
      scope: diagnosisScope ? diagnosisScope.name : 'Global System',
      scopeId: diagnosisScope?.id
    }]);
    
    // Determine context (Global or Scoped)
    // If diagnosisScope is active, we act as if only the scoped teams exist.
    const teamsToConsider = diagnosisScope ? dashboardTeams : teams;

    // 1. Global Supervisor Planning
    setGlobalAgent(prev => ({ ...prev, status: AgentStatus.THINKING }));
    addLog(globalAgent.id, globalAgent.name, `Analyzing request: "${userQuery}"... ${diagnosisScope ? `[Scope: ${diagnosisScope.name}]` : ''}`, 'thought');
    
    await new Promise(r => setTimeout(r, 1000));
    
    const globalPlan = await generateGlobalPlan(userQuery, topology, teamsToConsider); // Pass filtered teams
    
    if (globalPlan.length === 0) {
      addLog(globalAgent.id, globalAgent.name, "No relevant teams found within current scope for this request.", "report");
      setGlobalAgent(prev => ({ ...prev, status: AgentStatus.IDLE }));
      setIsSimulating(false);
      updateSessionStatus(sessionId, 'Failed');
      return;
    }

    setGlobalAgent(prev => ({ ...prev, status: AgentStatus.WAITING }));
    addLog(globalAgent.id, globalAgent.name, `Identified ${globalPlan.length} teams for execution. Delegating...`, 'instruction');

    // Highlight active nodes
    const planNodeIds = new Set<string>();
    const planTeamIds = new Set<string>();
    globalPlan.forEach(p => {
        const team = teams.find(t => t.id === p.teamId);
        if (team) {
            planNodeIds.add(team.resourceId);
            planTeamIds.add(team.id);
        }
    });
    setActiveNodeIds(planNodeIds);
    setActiveTeamIds(planTeamIds);

    let sessionWarnings = 0;
    let sessionCritical = 0;

    // 2. Execute per Team (Sequential for better visualization)
    for (const planItem of globalPlan) {
      const team = teams.find(t => t.id === planItem.teamId);
      if (!team) continue;

      updateAgentStatus(team.id, team.supervisor.id, AgentStatus.THINKING);
      addLog(globalAgent.id, globalAgent.name, `Instruction for ${team.name}: ${planItem.instruction}`, 'instruction', team.supervisor.name);
      
      await new Promise(r => setTimeout(r, 800));

      const assignments = await generateTeamDelegation(team, planItem.instruction);
      updateAgentStatus(team.id, team.supervisor.id, AgentStatus.WAITING);
      
      addLog(team.supervisor.id, team.supervisor.name, `Breaking down tasks for ${assignments.length} agents...`, 'thought');
      await new Promise(r => setTimeout(r, 800));

      const workerResults: { agentName: string, result: string }[] = [];

      // 3. Workers Execute
      for (const assignment of assignments) {
        const worker = team.members.find(m => m.id === assignment.agentId);
        if (!worker) continue;

        updateAgentStatus(team.id, worker.id, AgentStatus.WORKING);
        addLog(team.supervisor.id, team.supervisor.name, `Assigning task: "${assignment.task}"`, 'instruction', worker.name);
        
        const rawResult = await streamLogMessage(
          worker.name,
          worker.id,
          'report',
          team.supervisor.name,
          streamWorkerTask(worker, assignment.task, `Node ${team.resourceId} is online.`)
        );
        
        let cleanResult = rawResult;
        const summaryMatch = rawResult.match(/SUMMARY:\s*({.*?})/);
        if (summaryMatch) {
            try {
                const findings = JSON.parse(summaryMatch[1]);
                updateAgentFindings(team.id, worker.id, findings);
                sessionWarnings += findings.warnings;
                sessionCritical += findings.critical;
                cleanResult = rawResult.replace(summaryMatch[0], '').trim();
                setLogs(prev => {
                    const lastLog = prev[prev.length - 1];
                    if (lastLog.fromAgentId === worker.id) {
                        return prev.map(l => l.id === lastLog.id ? { ...l, content: cleanResult } : l);
                    }
                    return prev;
                });
            } catch (e) {
                console.error("Failed to parse findings", e);
            }
        }

        updateAgentStatus(team.id, worker.id, AgentStatus.COMPLETED);
        workerResults.push({ agentName: worker.name, result: cleanResult });
      }

      // 4. Team Supervisor Reports Back
      updateAgentStatus(team.id, team.supervisor.id, AgentStatus.WORKING); 
      
      await streamLogMessage(
        team.supervisor.name,
        team.supervisor.id,
        'report',
        globalAgent.name,
        streamTeamReport(team, planItem.instruction, workerResults)
      );
      
      updateAgentStatus(team.id, team.supervisor.id, AgentStatus.COMPLETED);
    }

    setGlobalAgent(prev => ({ ...prev, status: AgentStatus.COMPLETED }));
    addLog(globalAgent.id, globalAgent.name, "All team reports received. Mission accomplished.", "report");
    setIsSimulating(false);
    updateSessionStatus(sessionId, 'Completed', { warnings: sessionWarnings, critical: sessionCritical });
    
    setTimeout(() => {
        setActiveNodeIds(new Set());
        setActiveTeamIds(new Set());
    }, 4000);
  };

  // State Helpers
  const updateAgentStatus = (teamId: string, agentId: string, status: AgentStatus) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      if (t.supervisor.id === agentId) {
        return { ...t, supervisor: { ...t.supervisor, status } };
      }
      return {
        ...t,
        members: t.members.map(m => m.id === agentId ? { ...m, status } : m)
      };
    }));
  };

  const updateAgentFindings = (teamId: string, agentId: string, findings: AgentFindings) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      if (t.supervisor.id === agentId) {
        return { ...t, supervisor: { ...t.supervisor, findings } };
      }
      return {
        ...t,
        members: t.members.map(m => m.id === agentId ? { ...m, findings } : m)
      };
    }));
  };

  const updateSessionStatus = (sessionId: string, status: 'Completed' | 'Failed', findings?: { warnings: number, critical: number }) => {
     setSessionHistory(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status, findings: findings || s.findings } : s
     ));
  };

  const resetAllAgentStats = () => {
      setTeams(prev => prev.map(t => ({
          ...t,
          supervisor: { ...t.supervisor, status: AgentStatus.IDLE, findings: { warnings: 0, critical: 0 } },
          members: t.members.map(m => ({ ...m, status: AgentStatus.IDLE, findings: { warnings: 0, critical: 0 } }))
      })));
      setGlobalAgent(prev => ({ ...prev, status: AgentStatus.IDLE, findings: { warnings: 0, critical: 0 } }));
  };

  const handleNodeClick = useCallback((nodeId: string) => {
    const team = teams.find(t => t.resourceId === nodeId);
    if(team) addLog("system-nav", "System", `Inspecting ${team.name} (ID: ${team.id})`, "system");
  }, [teams]);

  const handleAgentClick = useCallback((agentId: string) => {
    setFocusTarget({ agentId, ts: Date.now() });
  }, []);

  // Determine Main Content based on View
  const renderMainContent = () => {
    // New Dashboard View
    if (currentView === 'dashboard') {
      return (
        <Dashboard 
          nodes={topology.nodes}
          teams={teams}
          recentSessions={sessionHistory}
          isSimulating={isSimulating}
          onNavigateToDiagnosis={() => setCurrentView('diagnosis')}
          onLoadSession={handleLoadSession}
        />
      );
    }

    if (currentView === 'resources') {
      return (
        <ResourceManagement 
          nodes={topology.nodes}
          onAdd={handleAddNode}
          onUpdate={handleUpdateNode}
          onDelete={handleDeleteNode}
          onViewDetail={handleViewResourceDetail}
        />
      );
    } 

    if (currentView === 'resource-detail' && selectedResourceId) {
       const node = topology.nodes.find(n => n.id === selectedResourceId);
       if (node) {
          // Find associated data
          const team = teams.find(t => t.resourceId === node.id);
          const associatedTopologyGroups = topologyGroups.filter(tg => tg.nodeIds.includes(node.id));

          return (
             <ResourceDetailView 
               node={node}
               team={team}
               associatedTopologyGroups={associatedTopologyGroups}
               onBack={() => setCurrentView('resources')}
               onNavigateToTopology={handleEnterTopology}
               onUpdateNode={handleUpdateNode}
               onUpdateAgentConfig={handleUpdateAgentConfig}
               onAddWorker={handleAddWorker}
               onRemoveWorker={handleRemoveWorker}
             />
          );
       }
       setCurrentView('resources'); // Fallback
       return null;
    }
    
    if (currentView === 'topologies') {
      return (
        <SubGraphManagement 
          topologyGroups={topologyGroups}
          activeScopeId={diagnosisScope?.id}
          isSimulating={isSimulating}
          onAdd={handleAddTopologyGroup}
          onUpdate={handleUpdateTopologyGroup}
          onDelete={handleDeleteTopologyGroup}
          onEnter={handleEnterTopology}
          onNavigateToDiagnosis={() => setCurrentView('diagnosis')}
        />
      );
    }

    if (currentView === 'topology-detail' && selectedTopologyId) {
        const activeTopologyGroup = topologyGroups.find(tg => tg.id === selectedTopologyId);
        if (activeTopologyGroup) {
            return (
                <SubGraphCanvas 
                    topologyGroup={activeTopologyGroup}
                    globalTopology={topology}
                    activeScopeId={diagnosisScope?.id}
                    isSimulating={isSimulating}
                    onBack={() => setCurrentView('topologies')}
                    onDiagnose={handleDiagnoseFromTopology}
                    onNavigateToDiagnosis={() => setCurrentView('diagnosis')}
                    onAddNode={handleAddNodeToTopology}
                    onRemoveNode={handleRemoveNodeFromTopology}
                    onViewResource={handleViewResourceDetail}
                />
            );
        }
        // Fallback if not found
        setCurrentView('topologies');
        return null;
    }

    if (currentView === 'agents') {
        return (
            <AgentManagement 
                teams={teams}
                onUpdateAgentConfig={handleUpdateAgentConfig}
                onManagePrompts={() => setCurrentView('prompts')}
                onManageModels={() => setCurrentView('models')}
                onManageTools={() => setCurrentView('tools')}
            />
        );
    }

    if (currentView === 'prompts') {
        return (
            <PromptManagement 
                prompts={prompts}
                onAdd={handleAddPrompt}
                onUpdate={handleUpdatePrompt}
                onDelete={handleDeletePrompt}
                onBack={() => setCurrentView('agents')}
            />
        );
    }

    if (currentView === 'models') {
      return (
        <ModelManagement 
          models={models}
          onAdd={handleAddModel}
          onUpdate={handleUpdateModel}
          onDelete={handleDeleteModel}
          onBack={() => setCurrentView('agents')}
        />
      );
    }

    if (currentView === 'tools') {
      return (
        <ToolManagement 
          tools={tools}
          onAdd={handleAddTool}
          onUpdate={handleUpdateTool}
          onDelete={handleDeleteTool}
          onBack={() => setCurrentView('agents')}
        />
      );
    }

    // Default Diagnosis / Command Center View (Formerly Dashboard)
    return (
      <main className="flex-1 flex h-full overflow-hidden">
          
          {/* Left: Sidebar (Command Structure) - Resizable */}
          <aside 
          ref={sidebarRef}
          style={{ width: leftSidebarWidth }}
          className="border-r border-slate-800 bg-slate-900/30 flex flex-col shrink-0 transition-none will-change-[width]"
          >
          <div className="p-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm whitespace-nowrap overflow-hidden">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity size={14} /> Active Agents {diagnosisScope && <span className="text-cyan-400">({dashboardTeams.length})</span>}
              </h2>
          </div>
          <div className="flex-1 overflow-hidden p-3 custom-scrollbar">
              <AgentHierarchy 
                  globalAgent={globalAgent} 
                  teams={dashboardTeams} 
                  activeTeamIds={activeTeamIds}
                  onAgentClick={handleAgentClick}
              />
          </div>
          </aside>

          {/* Left Resizer Handle */}
          <div
          className={`w-1 cursor-col-resize hover:bg-cyan-500 transition-colors z-50 flex flex-col justify-center items-center group relative ${resizingSide === 'left' ? 'bg-cyan-500' : 'bg-slate-800'}`}
          onMouseDown={startResizingLeft}
          >
          <div className="absolute w-4 h-full bg-transparent -left-1.5 cursor-col-resize"></div>
          </div>

          {/* Center: Main Analysis & Input */}
          <section className="flex-1 flex flex-col min-w-0 bg-slate-950 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] z-0">
              {/* Log Stream Header */}
              <div className="h-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center px-4 justify-between shrink-0 z-10">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Terminal size={14} className="text-cyan-500" /> 
                  Live Reasoning & Execution Log
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">SECURE CHANNEL // ENCRYPTED</span>
              </div>

              {/* Log Stream Body */}
              <div className="flex-1 overflow-hidden relative">
                  <LogStream logs={logs} focusTarget={focusTarget} />
                  <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
              </div>
              
              {/* Input Controls Area */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 z-20">
                  <div className="flex gap-4 max-w-4xl mx-auto">
                      <div className="flex-1 relative">
                          <Zap className="absolute top-3 left-3 text-slate-500" size={16} />
                          <textarea 
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none text-slate-200 placeholder-slate-600 h-12 transition-all focus:h-24 shadow-inner"
                              value={userQuery}
                              onChange={e => setUserQuery(e.target.value)}
                              disabled={isSimulating}
                              placeholder="Enter a complex mission for the Global Supervisor..."
                          />
                      </div>
                      <button 
                          onClick={runSimulation}
                          disabled={isSimulating}
                          className={`
                              h-12 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-lg
                              ${isSimulating 
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                                  : 'bg-cyan-600 hover:bg-cyan-500 text-white hover:shadow-cyan-500/20 active:scale-95 border border-cyan-500'}
                          `}
                      >
                          {isSimulating ? <RotateCcw className="animate-spin" size={18} /> : <Send size={18} />}
                          <span>{isSimulating ? 'Processing...' : 'Execute Mission'}</span>
                      </button>
                  </div>
              </div>
          </section>

          {/* Right Resizer Handle */}
          <div
          className={`w-1 cursor-col-resize hover:bg-cyan-500 transition-colors z-50 flex flex-col justify-center items-center group relative ${resizingSide === 'right' ? 'bg-cyan-500' : 'bg-slate-800'}`}
          onMouseDown={startResizingRight}
          >
          <div className="absolute w-4 h-full bg-transparent -left-1.5 cursor-col-resize"></div>
          </div>

          {/* Right: Sidebar (Topology) - Resizable */}
          <aside 
              style={{ width: rightSidebarWidth }}
              className="border-l border-slate-800 bg-slate-900/30 flex flex-col shrink-0 transition-none will-change-[width]"
          >
              <div className="p-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <Map size={14} /> Resource Map {diagnosisScope && <span className="text-cyan-400">({dashboardTopology.nodes.length})</span>}
                  </span>
              </div>
              <div className="flex-1 relative min-h-[200px] overflow-hidden">
                  <TopologyGraph 
                      data={dashboardTopology} 
                      activeNodeIds={activeNodeIds} 
                      onNodeClick={handleNodeClick}
                      onNodeDoubleClick={(id) => {
                          const node = topology.nodes.find(n => n.id === id);
                          if (node) handleViewResourceDetail(node);
                      }}
                  />
              </div>
              <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 leading-relaxed">
                  Nodes pulse when their assigned team is active. Click a node to inspect its linked team details in the system log. Double-click to view resource details.
              </div>
          </aside>
      </main>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between shadow-md z-10 shrink-0">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
                <Activity className="text-cyan-400" size={20} />
                <h1 className="text-lg font-bold tracking-tight text-white">NexusOps <span className="text-slate-500 font-normal text-sm ml-2 hidden sm:inline">Hierarchical Multi-Agent System</span></h1>
            </div>
            
            {/* Nav Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 ml-4 overflow-x-auto">
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap ${currentView === 'dashboard' ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Home size={14} /> Dashboard
                </button>
                <button 
                  onClick={() => setCurrentView('topologies')}
                  className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap ${['topologies', 'topology-detail'].includes(currentView) ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Network size={14} /> Topology
                </button>
                <button 
                  onClick={() => setCurrentView('resources')}
                  className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap ${['resources', 'resource-detail'].includes(currentView) ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Database size={14} /> Resources
                </button>
                <button 
                  onClick={() => setCurrentView('agents')}
                  className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap ${['agents', 'prompts', 'models', 'tools'].includes(currentView) ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Users size={14} /> Agents
                </button>
                
                {currentView === 'diagnosis' && (
                  <button 
                    onClick={() => setCurrentView('diagnosis')}
                    className="flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all bg-indigo-900/50 text-indigo-400 ml-2 whitespace-nowrap"
                  >
                      <Terminal size={14} /> Command Center
                  </button>
                )}
            </div>
        </div>

        <div className="flex items-center gap-4">
            {/* Diagnosis Scope Indicator */}
            {diagnosisScope && (
                <div className="flex items-center gap-2 px-3 py-1 rounded bg-indigo-950/50 border border-indigo-500/30 text-xs text-indigo-200 animate-in fade-in cursor-pointer hover:bg-indigo-900/80 transition-colors group hidden md:flex"
                     onClick={() => setCurrentView('diagnosis')}
                     title="Return to Diagnosis View"
                >
                    <Stethoscope size={14} className="text-indigo-400" />
                    <span className="font-semibold group-hover:text-white">Scope: {diagnosisScope.name}</span>
                    <button onClick={clearDiagnosisScope} className="hover:text-white p-0.5 rounded hover:bg-indigo-900 ml-1">
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${isSimulating ? 'border-cyan-500/50 bg-cyan-950 text-cyan-400 animate-pulse' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>
                <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-cyan-400' : 'bg-slate-500'}`}></span>
                {isSimulating ? 'SIMULATION ACTIVE' : 'SYSTEM IDLE'}
            </div>
        </div>
      </header>

      {/* View Switching */}
      <div className="flex-1 overflow-hidden">
        {renderMainContent()}
      </div>
    </div>
  );
};

export default App;
