
import { Topology, Team, Agent, AgentRole, AgentStatus, TopologyGroup, PromptTemplate, AIModel, AgentTool, Report, DiagnosisSession, AgentExecutionRecord } from '../types';

export const INITIAL_TOPOLOGY: Topology = {
  nodes: [
    { id: 'gateway-01', label: 'API Gateway', type: 'Gateway', properties: { region: 'us-east-1', throughput: '10k' } },
    { id: 'auth-svc', label: 'Auth Service', type: 'Service', properties: { replicas: '3', version: 'v1.4.2' } },
    { id: 'payment-svc', label: 'Payment API', type: 'Service', properties: { replicas: '5', version: 'v2.0.1' } },
    { id: 'order-db', label: 'Order DB (PostgreSQL)', type: 'Database', properties: { size: '500GB' } },
    { id: 'redis-cache', label: 'Session Cache', type: 'Cache' },
    { id: 'k8s-cluster', label: 'K8s Cluster', type: 'Infrastructure' }, 
    { id: 'legacy-monolith', label: 'Legacy Core', type: 'Service', properties: { replicas: '1', deprecated: 'true' } },
    { id: 'cdn-edge', label: 'Global CDN', type: 'Gateway', properties: { provider: 'CloudFlare', cacheHit: '94%' } },
    { id: 'web-client', label: 'Web Storefront', type: 'Service', properties: { framework: 'Next.js', replicas: '8' } },
    { id: 'event-stream', label: 'Kafka Cluster', type: 'Infrastructure', properties: { partitions: '64', retention: '7d' } },
    { id: 'analytics-dw', label: 'Data Warehouse', type: 'Database', properties: { engine: 'Snowflake', size: '20TB' } },
    { id: 'ml-model-v1', label: 'Fraud Detection Model', type: 'Service', properties: { framework: 'PyTorch', latency: '45ms' } }
  ],
  links: [
    { source: 'gateway-01', target: 'auth-svc', type: 'call' },
    { source: 'gateway-01', target: 'payment-svc', type: 'call' },
    { source: 'auth-svc', target: 'redis-cache', type: 'call' },
    { source: 'payment-svc', target: 'order-db', type: 'call' },
    { source: 'cdn-edge', target: 'web-client', type: 'call' },
    { source: 'web-client', target: 'gateway-01', type: 'call' },
    { source: 'payment-svc', target: 'event-stream', type: 'call' },
    { source: 'event-stream', target: 'analytics-dw', type: 'call' },
    { source: 'payment-svc', target: 'ml-model-v1', type: 'call' },
    { source: 'k8s-cluster', target: 'gateway-01', type: 'deployment' },
    { source: 'k8s-cluster', target: 'auth-svc', type: 'deployment' },
    { source: 'k8s-cluster', target: 'payment-svc', type: 'deployment' },
    { source: 'k8s-cluster', target: 'redis-cache', type: 'deployment' },
    { source: 'k8s-cluster', target: 'web-client', type: 'deployment' },
    { source: 'k8s-cluster', target: 'ml-model-v1', type: 'deployment' },
    { source: 'payment-svc', target: 'legacy-monolith', type: 'dependency' },
    { source: 'auth-svc', target: 'legacy-monolith', type: 'dependency' },
    { source: 'ml-model-v1', target: 'analytics-dw', type: 'dependency' }
  ]
};

export const INITIAL_TOPOLOGY_GROUPS: TopologyGroup[] = [
  { id: 'sg-payment-flow', name: 'Payment Processing Flow', description: 'Core transaction path including Gateway, Payment Service, and Order DB.', nodeCount: 3, createdAt: '2023-10-15T08:30:00Z', tags: ['Critical', 'Finance'], nodeIds: ['gateway-01', 'payment-svc', 'order-db'] },
  { id: 'sg-auth-cluster', name: 'Authentication Cluster', description: 'User session management and token verification infrastructure.', nodeCount: 2, createdAt: '2023-11-02T14:15:00Z', tags: ['Security'], nodeIds: ['auth-svc', 'redis-cache'] }
];

export const INITIAL_SESSIONS: DiagnosisSession[] = [
  { id: 'sess-001', query: "Investigate critical latency spikes in Payment API during high load.", timestamp: Date.now() - 7200000, status: 'Completed', findings: { warnings: 1, critical: 2 }, scope: 'Payment Processing Flow', scopeId: 'sg-payment-flow', relatedNodeIds: ['payment-svc', 'order-db', 'gateway-01'] }
];

// Mock historical traces for agents
export const generateMockHistory = (agentId: string): AgentExecutionRecord[] => {
    return [
        {
            id: `tr-${Math.random().toString(36).substr(2, 6)}`,
            agentId,
            sessionId: 'sess-001',
            teamName: 'Payment API Team',
            resourceLabel: 'Payment API',
            startTime: Date.now() - 3600000 * 2,
            duration: 12400,
            status: 'Warning',
            summary: 'Detected p99 latency spike above 200ms threshold.',
            steps: [
                { id: 's1', timestamp: Date.now() - 7200000, type: 'thought', content: 'Received directive to audit Payment API performance. Initializing connection pool scan.' },
                { id: 's2', timestamp: Date.now() - 7198000, type: 'action', content: 'Executing function: query_metrics("payment-svc", "latency", "1h")' },
                { id: 's3', timestamp: Date.now() - 7195000, type: 'observation', content: 'Observed 2400ms spike at 14:05 UTC. Correlating with database lock logs.' },
                { id: 's4', timestamp: Date.now() - 7190000, type: 'thought', content: 'Connection pool saturation confirmed. Database contention is likely source.' },
                { id: 's5', timestamp: Date.now() - 7185000, type: 'output', content: 'Final Report: Bottleneck identified in Order DB connection pool. Suggesting horizontal scale.' }
            ]
        },
        {
            id: `tr-${Math.random().toString(36).substr(2, 6)}`,
            agentId,
            sessionId: 'sess-002',
            teamName: 'Payment API Team',
            resourceLabel: 'Payment API',
            startTime: Date.now() - 3600000 * 24,
            duration: 5600,
            status: 'Success',
            summary: 'System health audit completed. All metrics within nominal range.',
            steps: [
                { id: 's1', timestamp: Date.now() - 86400000, type: 'thought', content: 'Periodic health check initiated.' },
                { id: 's2', timestamp: Date.now() - 86398000, type: 'observation', content: 'CPU: 12%, Memory: 45%. Nominal.' },
                { id: 's3', timestamp: Date.now() - 86395000, type: 'output', content: 'No anomalies detected.' }
            ]
        }
    ];
};

export const INITIAL_PROMPT_TEMPLATES: PromptTemplate[] = [
  { id: 'pt-sys-coord', name: 'Standard Coordinator Persona', description: 'System instruction for Team Supervisors.', category: 'System', content: '...', tags: ['Persona'], updatedAt: Date.now() }
];

export const INITIAL_MODELS: AIModel[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', contextWindow: 1000000, type: 'Multimodal', status: 'Active' }
];

export const INITIAL_TOOLS: AgentTool[] = [
  { id: 'tool-search', name: 'Google Search', description: 'Web search.', type: 'Integration', createdAt: Date.now() }
];

export const INITIAL_REPORTS: Report[] = [
  { id: 'rep-001', title: 'Audit Report', type: 'Security', status: 'Final', createdAt: Date.now(), author: 'Global Sup', summary: '...', tags: [], content: 'Markdown content' }
];

export const GLOBAL_SUPERVISOR: Agent = {
  id: 'global-sup',
  name: 'Global Orchestrator',
  role: AgentRole.GLOBAL_SUPERVISOR,
  status: AgentStatus.IDLE,
  findings: { warnings: 0, critical: 0 },
  config: { model: 'gemini-3-pro-preview', temperature: 0.2, systemInstruction: '...' }
};

export const generateTeamForNode = (nodeId: string, nodeLabel: string, nodeType: string): Team => {
  const teamId = `team-${nodeId}`;
  return {
    id: teamId,
    resourceId: nodeId,
    name: `${nodeLabel} Team`,
    supervisor: { id: `${teamId}-sup`, name: `${nodeLabel} Lead`, role: AgentRole.TEAM_SUPERVISOR, status: AgentStatus.IDLE, findings: { warnings: 0, critical: 0 } },
    members: [{ id: `${teamId}-w1`, name: 'Log Analyzer', role: AgentRole.WORKER, specialty: 'Error Tracking', status: AgentStatus.IDLE, findings: { warnings: 0, critical: 0 } }]
  };
};
