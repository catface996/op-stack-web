
import { Topology, Team, Agent, AgentRole, AgentStatus, TopologyGroup, PromptTemplate, AIModel, AgentTool, Report, DiagnosisSession, AgentExecutionRecord, TraceStep, ReportTemplate, DiscoverySource } from '../types';

export const INITIAL_DISCOVERY_SOURCES: DiscoverySource[] = [
  { id: 'src-k8s-prod', name: 'Production K8s Cluster', type: 'K8s', endpoint: 'https://api.k8s.prod.entropy.io', status: 'Connected', lastScan: Date.now() - 3600000 },
  { id: 'src-prom-global', name: 'Global Prometheus', type: 'Prometheus', endpoint: 'http://prometheus.monitoring:9090', status: 'Connected', lastScan: Date.now() - 86400000 },
  { id: 'src-aws-us-east', name: 'AWS us-east-1 (FinOps)', type: 'Cloud', endpoint: 'arn:aws:iam::12345678:role/OpsBot', status: 'Connected' }
];

// 初始发现的节点和链接（模拟 AI 扫描后发现的新资源）
export const INITIAL_DISCOVERED_DELTA = {
  nodes: [
    { id: 'billing-svc', label: 'Billing Service', type: 'Service', properties: { replicas: '3', version: 'v2.1.0', namespace: 'finance' } },
    { id: 'notification-svc', label: 'Notification Hub', type: 'Service', properties: { replicas: '2', channels: 'email,sms,push' } },
    { id: 'audit-log-db', label: 'Audit Log Store', type: 'Database', properties: { engine: 'MongoDB', size: '120GB' } },
    { id: 'config-server', label: 'Config Server', type: 'Service', properties: { provider: 'Spring Cloud Config', version: 'v3.0' } },
  ],
  links: [
    { source: 'payment-svc', target: 'billing-svc', type: 'inferred', confidence: 0.92 },
    { source: 'billing-svc', target: 'notification-svc', type: 'inferred', confidence: 0.78 },
    { source: 'auth-svc', target: 'audit-log-db', type: 'inferred', confidence: 0.85 },
    { source: 'gateway-01', target: 'config-server', type: 'inferred', confidence: 0.88 },
  ]
};

export const RAW_SCAN_PAYLOADS = {
  k8s: `
apiVersion: v1
kind: Service
metadata:
  name: billing-svc
  namespace: finance
spec:
  selector:
    app: billing-v2
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: billing-v2
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: billing
        image: entropy/billing:v2.1.0
        env:
        - name: DB_URL
          value: "postgresql://order-db:5432/billing"
  `,
  trace: `
{
  "traceId": "9b1deb4d",
  "spans": [
    {"service": "payment-svc", "operation": "authorize", "target": "billing-svc", "latency": "45ms", "status": 200},
    {"service": "gateway-01", "operation": "dispatch", "target": "payment-svc", "latency": "12ms", "status": 200}
  ]
}
  `
};

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
  { id: 'sg-payment-flow', name: 'Payment Processing Flow', description: 'Core transaction path including Gateway, Payment Service, and Order DB.', nodeCount: 3, createdAt: '2023-10-15T08:30:00Z', tags: ['Critical', 'Finance'], nodeIds: ['gateway-01', 'payment-svc', 'order-db'], templateIds: ['rtp-01', 'rtp-02'] },
  { id: 'sg-auth-cluster', name: 'Authentication Cluster', description: 'User session management and token verification infrastructure.', nodeCount: 2, createdAt: '2023-11-02T14:15:00Z', tags: ['Security'], nodeIds: ['auth-svc', 'redis-cache'], templateIds: ['rtp-01'] },
  { id: 'sg-edge-global', name: 'Global Edge Network', description: 'CDN nodes and initial entry points for global traffic.', nodeCount: 2, createdAt: '2023-11-05T09:00:00Z', tags: ['Edge', 'Networking'], nodeIds: ['cdn-edge', 'web-client'] },
  { id: 'sg-analytics', name: 'Big Data Pipeline', description: 'Kafka streams feeding into the Snowflake Data Warehouse.', nodeCount: 2, createdAt: '2023-11-10T11:20:00Z', tags: ['Data', 'ETL'], nodeIds: ['event-stream', 'analytics-dw'] },
  { id: 'sg-ai-fraud', name: 'AI Fraud Detection', description: 'Real-time inference stack for identifying suspicious transactions.', nodeCount: 2, createdAt: '2023-11-12T16:45:00Z', tags: ['ML', 'Security'], nodeIds: ['ml-model-v1', 'payment-svc'] }
];

export const INITIAL_PROMPT_TEMPLATES: PromptTemplate[] = [
  { id: 'pt-sys-01', name: 'Standard Coordinator Persona', description: 'System instruction for Team Supervisors.', category: 'System', content: 'You are an EntropyOps Coordinator. Your role is to bridge the gap between global strategic objectives and localized resource tactical execution. Maintain clear communication lines, aggregate findings without loss of context, and ensure your team operates within defined SLAs.', tags: ['Persona', 'Core'], updatedAt: Date.now() },
  { id: 'pt-ana-01', name: 'Root Cause Investigator', description: 'Analysis prompt for tracking deep failures.', category: 'Analysis', content: 'Scan log trace sequences for 5xx errors. Correlate with upstream latency spikes and downstream connection pool exhaustion. Priority: Identify if it is a transient network blip or a persistent resource leak.', tags: ['Diagnosis', 'Failures'], updatedAt: Date.now() },
  { id: 'pt-rep-01', name: 'Executive Summary Architect', description: 'Reporting prompt for high-level stakeholders.', category: 'Reporting', content: 'Synthesize the technical audit into a 3-bullet point executive summary. Focus on Business Impact, Risk Mitigation, and Remediation Cost.', tags: ['Executive', 'Summary'], updatedAt: Date.now() }
];

export const INITIAL_MODELS: AIModel[] = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', provider: 'Google', contextWindow: 1000000, type: 'Multimodal', status: 'Active' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Preview)', provider: 'Google', contextWindow: 2000000, type: 'Multimodal', status: 'Active' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite', provider: 'Google', contextWindow: 1000000, type: 'Multimodal', status: 'Active' }
];

export const INITIAL_TOOLS: AgentTool[] = [
  { id: 'tool-search', name: 'Google Search', description: 'Real-time web search for latest infrastructure best practices and CVEs.', type: 'Integration', createdAt: Date.now() },
  { id: 'tool-metrics', name: 'Metrics Query', description: 'Deep query tool for Prometheus/Grafana style telemetry data.', type: 'Function', createdAt: Date.now() },
  { id: 'tool-k8s-api', name: 'K8s Control Plane', description: 'Interact with the cluster API to inspect pods, deployments and logs.', type: 'Integration', createdAt: Date.now() }
];

export const GLOBAL_SUPERVISOR: Agent = {
  id: 'global-sup',
  name: 'Global Orchestrator',
  role: AgentRole.GLOBAL_SUPERVISOR,
  status: AgentStatus.IDLE,
  findings: { warnings: 0, critical: 0 },
  config: { model: 'gemini-3-pro-preview', temperature: 0.2, systemInstruction: 'You are the ultimate decision-making node in the hierarchy. Your goal is the stability of the entire cluster.' }
};

export const INITIAL_REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'rtp-01',
    name: 'Root Cause Analysis (RCA)',
    description: 'A structured template for post-incident investigations and technical forensics.',
    category: 'Incident',
    content: `# Root Cause Analysis: {{Incident_Title}}

## 1. Incident Overview
- **Impact Duration**: {{Duration}}
- **Severity**: {{Severity}}
- **Services Affected**: {{Affected_Nodes}}

## 2. Technical Findings
| Metric | Baseline | Peak | Deviation |
| :--- | :--- | :--- | :--- |
| Latency | {{Baseline_Latency}} | {{Peak_Latency}} | {{Latency_Diff}} |

## 3. Sequence of Events
\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant G as Gateway
    participant S as Service
    U->>G: Request
    G->>S: Call
    Note over S: Error Occurred
    S-->>G: 5xx Error
\`\`\`

## 4. Remediation Plan
- [ ] Task 1
- [ ] Task 2`,
    tags: ['Forensics', 'PostMortem'],
    updatedAt: Date.now()
  },
  {
    id: 'rtp-02',
    name: 'Performance Optimization Scan',
    description: 'Standard report for identifying bottlenecks and resource saturation.',
    category: 'Performance',
    content: `# Performance Audit: {{Service_Name}}

## 1. Resource Saturation
\`\`\`json
{
  "type": "area",
  "xKey": "hour",
  "series": [{"key": "cpu", "color": "#fbbf24"}, {"key": "mem", "color": "#818cf8"}],
  "data": [
    {"hour": "00:00", "cpu": 10, "mem": 45},
    {"hour": "12:00", "cpu": 85, "mem": 92}
  ]
}
\`\`\`

## 2. Optimization Proposals
- **Recommendation 1**: {{Proposal_1}}
- **Recommendation 2**: {{Proposal_2}}`,
    tags: ['Optimization', 'Benchmark'],
    updatedAt: Date.now()
  }
];

export const INITIAL_REPORTS: Report[] = [
  {
    id: 'rep-01',
    title: 'Global Edge Security Nexus Audit',
    type: 'Security',
    status: 'Final',
    createdAt: Date.now() - 86400000 * 0.5,
    author: 'Security Sentinel Agent',
    summary: 'Verification of zero-trust headers, WAF bypass vulnerability assessment, and TLS 1.3 compliance across edge clusters.',
    content: `# Security Nexus Audit Report`,
    tags: ['Security', 'WAF', 'Edge']
  },
  {
    id: 'rep-02',
    title: 'Payment Gateway Performance Audit',
    type: 'Performance',
    status: 'Final',
    createdAt: Date.now() - 86400000 * 1.2,
    author: 'Performance Analyst Bot',
    summary: 'Analysis of 99th percentile latency during peak hours. Identified bottleneck in downstream order-db connection pool.',
    content: `# Latency Benchmark: Payment Flow`,
    tags: ['Performance', 'Bottleneck']
  },
  {
    id: 'rep-03',
    title: 'Multi-Region Disaster Recovery Sync',
    type: 'Audit',
    status: 'Final',
    createdAt: Date.now() - 86400000 * 2.5,
    author: 'Compliance Guardian',
    summary: 'Verification of cross-region database replication lag. RPO/RTO targets met for us-east-1 and eu-central-1.',
    content: `# DR Compliance Status`,
    tags: ['Compliance', 'DR']
  },
  {
    id: 'rep-04',
    title: 'Fraud Detection Model Drift Report',
    type: 'Diagnosis',
    status: 'Draft',
    createdAt: Date.now() - 3600000 * 4,
    author: 'Data Scientist Agent',
    summary: 'Detected 12% accuracy drop in fraud-v2 model compared to last week baseline. Correlation with seasonal spending patterns.',
    content: `# Model Health Alert`,
    tags: ['ML', 'Accuracy']
  },
  {
    id: 'rep-05',
    title: 'K8s Cluster Resource Saturation Scan',
    type: 'Performance',
    status: 'Final',
    createdAt: Date.now() - 86400000 * 3,
    author: 'Ops Automator',
    summary: 'Node group auto-scaling efficiency audit. CPU utilization remains under 65% across all workers.',
    content: `# Cluster Utilization Summary`,
    tags: ['Infrastructure', 'K8s']
  },
  {
    id: 'rep-06',
    title: 'API Version Deprecation Compliance',
    type: 'Audit',
    status: 'Final',
    createdAt: Date.now() - 86400000 * 5,
    author: 'Archivist Agent',
    summary: 'Inventory of v1-legacy calls. Identified 12 remaining consumers requiring migration notice.',
    content: `# API Lifecycle Audit`,
    tags: ['API', 'Migration']
  },
  {
    id: 'rep-07',
    title: 'TLS Certificate Expiry Watch',
    type: 'Security',
    status: 'Final',
    createdAt: Date.now() - 86400000 * 0.1,
    author: 'Security Sentinel',
    summary: 'Scan of 42 frontend endpoints. All certificates verified; next expiry in 45 days.',
    content: `# SSL/TLS Inventory`,
    tags: ['Security', 'Certificates']
  },
  {
    id: 'rep-08',
    title: 'Kafka Consumer Group Lag Diagnosis',
    type: 'Diagnosis',
    status: 'Final',
    createdAt: Date.now() - 86400000 * 0.5,
    author: 'Stream Inspector',
    summary: 'Investigated lag spikes in billing-worker group. Fixed by increasing partition count to 128.',
    content: `# Streaming Data Health`,
    tags: ['Kafka', 'Latency']
  }
];

export const INITIAL_SESSIONS: DiagnosisSession[] = [
  { id: 'sess-01', query: 'Inspect payment latency spikes during BFCM', timestamp: Date.now() - 3600000 * 1, status: 'Completed', findings: { warnings: 2, critical: 0 }, scope: 'Payment Processing Flow' },
  { id: 'sess-02', query: 'Database connection pool exhaustion analysis', timestamp: Date.now() - 3600000 * 3, status: 'Completed', findings: { warnings: 1, critical: 1 }, scope: 'Core Database Cluster' },
  { id: 'sess-03', query: 'API Gateway timeout investigation for /checkout endpoint', timestamp: Date.now() - 3600000 * 6, status: 'Completed', findings: { warnings: 3, critical: 0 }, scope: 'API Gateway' },
  { id: 'sess-04', query: 'Memory leak detection in order-service pods', timestamp: Date.now() - 3600000 * 12, status: 'Completed', findings: { warnings: 0, critical: 2 }, scope: 'Order Processing' },
  { id: 'sess-05', query: 'Redis cache hit ratio optimization', timestamp: Date.now() - 3600000 * 24, status: 'Completed', findings: { warnings: 4, critical: 0 }, scope: 'Cache Layer' },
  { id: 'sess-06', query: 'Kafka consumer lag spike during peak hours', timestamp: Date.now() - 3600000 * 36, status: 'Completed', findings: { warnings: 2, critical: 1 }, scope: 'Message Queue' },
  { id: 'sess-07', query: 'Authentication service failure root cause analysis', timestamp: Date.now() - 3600000 * 48, status: 'Failed', findings: { warnings: 1, critical: 3 }, scope: 'Auth Service' },
  { id: 'sess-08', query: 'Load balancer health check failures', timestamp: Date.now() - 3600000 * 72, status: 'Completed', findings: { warnings: 0, critical: 0 }, scope: 'Infrastructure' },
  { id: 'sess-09', query: 'Real-time inventory sync latency investigation', timestamp: Date.now() - 100000, status: 'Running', findings: { warnings: 1, critical: 0 }, scope: 'Inventory System' }
];

export const generateMockHistory = (agentId: string): AgentExecutionRecord[] => {
  return [
    {
      id: 'exec-01',
      agentId,
      sessionId: 'sess-01',
      teamName: 'Diagnostic Team',
      resourceLabel: 'Payment API',
      startTime: Date.now() - 3600000,
      duration: 1250,
      status: 'Success',
      summary: 'Analyzed log traces for latency spikes.',
      steps: [
        { id: 'step-1', timestamp: Date.now() - 3600000, type: 'thought', content: 'Starting log analysis...' },
        { id: 'step-2', timestamp: Date.now() - 3599000, type: 'action', content: 'Fetched last 1000 lines.' }
      ]
    }
  ];
};

export const generateTeamForNode = (nodeId: string, nodeLabel: string, nodeType: string): Team => {
  const teamId = `team-${nodeId}`;
  return {
    id: teamId,
    resourceId: nodeId,
    name: `${nodeLabel} Team`,
    supervisor: { 
      id: `${teamId}-sup`, 
      name: `${nodeLabel} Lead`, 
      role: AgentRole.TEAM_SUPERVISOR, 
      status: AgentStatus.IDLE, 
      findings: { warnings: 0, critical: 0 },
      config: { model: 'gemini-3-flash-preview', temperature: 0.3, systemInstruction: `You lead the diagnostics for ${nodeLabel}.` }
    },
    members: [{ 
      id: `${teamId}-w1`, 
      name: 'Log Analyzer', 
      role: AgentRole.WORKER, 
      specialty: 'Error Tracking', 
      status: AgentStatus.IDLE, 
      findings: { warnings: 0, critical: 0 } 
    }]
  };
};
