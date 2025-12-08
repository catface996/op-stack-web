
import { Topology, Team, Agent, AgentRole, AgentStatus, TopologyGroup, PromptTemplate, AIModel, AgentTool } from '../types';

export const INITIAL_TOPOLOGY: Topology = {
  nodes: [
    { id: 'gateway-01', label: 'API Gateway', type: 'Gateway', properties: { region: 'us-east-1', throughput: '10k' } },
    { id: 'auth-svc', label: 'Auth Service', type: 'Service', properties: { replicas: '3', version: 'v1.4.2' } },
    { id: 'payment-svc', label: 'Payment API', type: 'Service', properties: { replicas: '5', version: 'v2.0.1' } },
    { id: 'order-db', label: 'Order DB (PostgreSQL)', type: 'Database', properties: { size: '500GB' } },
    { id: 'redis-cache', label: 'Session Cache', type: 'Cache' },
    { id: 'k8s-cluster', label: 'K8s Cluster', type: 'Infrastructure' }, // Representing infra
    { id: 'legacy-monolith', label: 'Legacy Core', type: 'Service', properties: { replicas: '1', deprecated: 'true' } }
  ],
  links: [
    // Call Relationships (Traffic Flow)
    { source: 'gateway-01', target: 'auth-svc', type: 'call' },
    { source: 'gateway-01', target: 'payment-svc', type: 'call' },
    { source: 'auth-svc', target: 'redis-cache', type: 'call' },
    { source: 'payment-svc', target: 'order-db', type: 'call' },
    
    // Deployment Relationships (Solid, No Arrow)
    { source: 'k8s-cluster', target: 'gateway-01', type: 'deployment' },
    { source: 'k8s-cluster', target: 'auth-svc', type: 'deployment' },
    { source: 'k8s-cluster', target: 'payment-svc', type: 'deployment' },
    { source: 'k8s-cluster', target: 'redis-cache', type: 'deployment' },

    // Dependency Relationships (Dashed)
    { source: 'payment-svc', target: 'legacy-monolith', type: 'dependency' },
    { source: 'auth-svc', target: 'legacy-monolith', type: 'dependency' }
  ]
};

export const INITIAL_TOPOLOGY_GROUPS: TopologyGroup[] = [
  { 
    id: 'sg-payment-flow', 
    name: 'Payment Processing Flow', 
    description: 'Core transaction path including Gateway, Payment Service, and Order DB.', 
    nodeCount: 3, 
    createdAt: '2023-10-15T08:30:00Z',
    tags: ['Critical', 'Finance'],
    nodeIds: ['gateway-01', 'payment-svc', 'order-db']
  },
  { 
    id: 'sg-auth-cluster', 
    name: 'Authentication Cluster', 
    description: 'User session management and token verification infrastructure.', 
    nodeCount: 2, 
    createdAt: '2023-11-02T14:15:00Z',
    tags: ['Security'],
    nodeIds: ['auth-svc', 'redis-cache']
  },
  { 
    id: 'sg-infra-view', 
    name: 'Infrastructure Map', 
    description: 'Kubernetes cluster deployment topology.', 
    nodeCount: 5, 
    createdAt: '2023-09-10T09:00:00Z',
    tags: ['Infra', 'K8s'],
    nodeIds: ['k8s-cluster', 'gateway-01', 'auth-svc', 'payment-svc', 'redis-cache']
  }
];

export const INITIAL_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'pt-sys-coord',
    name: 'Standard Coordinator Persona',
    description: 'System instruction for Team Supervisors to ensure effective delegation.',
    category: 'System',
    content: 'You are the Team Supervisor. Coordinate your workers effectively, aggregate their findings, and report a summarized status to the Global Supervisor. Ensure all tasks are completed.',
    tags: ['Persona', 'Supervisor'],
    updatedAt: Date.now() - 10000000
  },
  {
    id: 'pt-sys-sec',
    name: 'Security Auditor Persona',
    description: 'Strict persona for security-focused worker agents.',
    category: 'System',
    content: 'You are a Security-Focused Agent. Scrutinize all reports for potential vulnerabilities. Prioritize security warnings over performance metrics. Flag any anomalies immediately.',
    tags: ['Persona', 'Security', 'Critical'],
    updatedAt: Date.now() - 8000000
  },
  {
    id: 'pt-usr-perf',
    name: 'Performance Audit Request',
    description: 'Standard user query to trigger a performance check.',
    category: 'User',
    content: 'Analyze the current throughput and latency metrics for the Payment Service. Identify any bottlenecks in the database connection pool.',
    tags: ['Performance', 'Audit'],
    updatedAt: Date.now() - 5000000
  },
  {
    id: 'pt-rep-json',
    name: 'JSON Findings Format',
    description: 'Instruction to enforce structured JSON output for findings.',
    category: 'Reporting',
    content: 'Output your final analysis as a JSON object with the following schema: { "warnings": number, "critical": number, "summary": "string" }.',
    tags: ['Format', 'JSON'],
    updatedAt: Date.now() - 2000000
  },
  {
    id: 'pt-ana-sql',
    name: 'Slow Query Analysis',
    description: 'Specific instruction for DB agents to analyze slow logs.',
    category: 'Analysis',
    content: 'Review the PostgreSQL slow query log for the last hour. Identify the top 3 queries by total execution time and suggest index improvements.',
    tags: ['Database', 'SQL'],
    updatedAt: Date.now() - 1000000
  }
];

export const INITIAL_MODELS: AIModel[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', contextWindow: 1000000, type: 'Multimodal', status: 'Active' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Preview)', provider: 'Google', contextWindow: 2000000, type: 'Multimodal', status: 'Active' },
  { id: 'gemini-2.5-flash-thinking', name: 'Gemini 2.5 Flash (Thinking)', provider: 'Google', contextWindow: 32000, type: 'Text', status: 'Active' },
];

export const INITIAL_TOOLS: AgentTool[] = [
  { id: 'tool-search', name: 'Google Search', description: 'Web search for real-time information.', type: 'Integration', createdAt: Date.now() - 5000000 },
  { id: 'tool-db-query', name: 'SQL Client', description: 'Execute readonly SQL queries against registered DBs.', type: 'Function', createdAt: Date.now() - 4000000 },
  { id: 'tool-k8s-api', name: 'Kubernetes API', description: 'Fetch pod status and logs from K8s clusters.', type: 'Integration', createdAt: Date.now() - 3000000 },
];

const defaultFindings = { warnings: 0, critical: 0 };

// Helper to generate a team based on a node
export const generateTeamForNode = (nodeId: string, nodeLabel: string, nodeType: string): Team => {
  const teamId = `team-${nodeId}`;
  
  // Define workers based on resource type
  const members: Agent[] = [];
  
  const workerConfig = {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    systemInstruction: 'You are a specialized worker agent. Execute tasks precisely and report findings.',
    defaultContext: ''
  };

  if (nodeType === 'Database') {
    members.push(
      { id: `${teamId}-w1`, name: 'DB Perf Monitor', role: AgentRole.WORKER, specialty: 'Query Optimization', status: AgentStatus.IDLE, findings: defaultFindings, config: workerConfig },
      { id: `${teamId}-w2`, name: 'Data Integrity Bot', role: AgentRole.WORKER, specialty: 'Consistency Check', status: AgentStatus.IDLE, findings: defaultFindings, config: workerConfig }
    );
  } else if (nodeType === 'Service' || nodeType === 'Gateway') {
    members.push(
      { id: `${teamId}-w1`, name: 'Log Analyzer', role: AgentRole.WORKER, specialty: 'Error Tracking', status: AgentStatus.IDLE, findings: defaultFindings, config: workerConfig },
      { id: `${teamId}-w2`, name: 'Traffic Inspector', role: AgentRole.WORKER, specialty: 'Load Analysis', status: AgentStatus.IDLE, findings: defaultFindings, config: workerConfig }
    );
  } else if (nodeType === 'Infrastructure') {
    members.push(
      { id: `${teamId}-w1`, name: 'Node Scaler', role: AgentRole.WORKER, specialty: 'Resource Provisioning', status: AgentStatus.IDLE, findings: defaultFindings, config: workerConfig },
      { id: `${teamId}-w2`, name: 'Cluster Health', role: AgentRole.WORKER, specialty: 'Node Health', status: AgentStatus.IDLE, findings: defaultFindings, config: workerConfig }
    );
  } else {
    members.push(
      { id: `${teamId}-w1`, name: 'Health Check', role: AgentRole.WORKER, specialty: 'Uptime', status: AgentStatus.IDLE, findings: defaultFindings, config: workerConfig }
    );
  }

  return {
    id: teamId,
    resourceId: nodeId,
    name: `${nodeLabel} Team`,
    supervisor: {
      id: `${teamId}-sup`,
      name: `${nodeLabel} Lead`,
      role: AgentRole.TEAM_SUPERVISOR,
      status: AgentStatus.IDLE,
      findings: defaultFindings,
      config: {
        model: 'gemini-3-pro-preview',
        temperature: 0.5,
        systemInstruction: `You are the Team Supervisor for ${nodeLabel}. Coordinate your workers to ensure system stability.`,
        defaultContext: 'Always prioritize critical error paths.'
      }
    },
    members
  };
};

export const GLOBAL_SUPERVISOR: Agent = {
  id: 'global-sup',
  name: 'Global Orchestrator',
  role: AgentRole.GLOBAL_SUPERVISOR,
  status: AgentStatus.IDLE,
  findings: defaultFindings,
  config: {
    model: 'gemini-3-pro-preview',
    temperature: 0.2,
    systemInstruction: 'You are the Global System Orchestrator. Break down complex user requests into sub-tasks for specific resource teams.',
    defaultContext: ''
  }
};
