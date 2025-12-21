
import { Topology, Team, Agent, AgentRole, AgentStatus, TopologyGroup, PromptTemplate, AIModel, AgentTool, Report, DiagnosisSession, AgentExecutionRecord, TraceStep, ReportTemplate, DiscoverySource, TopologyNode, TopologyLink } from '../types';

export const INITIAL_DISCOVERY_SOURCES: DiscoverySource[] = [
  { id: 'src-k8s-prod', name: 'Production K8s Cluster', type: 'K8s', endpoint: 'https://api.k8s.prod.entropy.io', status: 'Connected', lastScan: Date.now() - 3600000 },
  { id: 'src-prom-global', name: 'Global Prometheus', type: 'Prometheus', endpoint: 'http://prometheus.monitoring:9090', status: 'Connected', lastScan: Date.now() - 86400000 },
  { id: 'src-aws-us-east', name: 'AWS us-east-1 (FinOps)', type: 'Cloud', endpoint: 'arn:aws:iam::12345678:role/OpsBot', status: 'Connected' }
];

// 初始发现的节点和链接（模拟 AI 扫描后发现的新资源）
export const INITIAL_DISCOVERED_DELTA: { nodes: TopologyNode[]; links: TopologyLink[] } = {
  nodes: [
    { id: 'billing-svc', label: 'Billing Service', type: 'Service', layer: 'application', properties: { replicas: '3', version: 'v2.1.0', namespace: 'finance' } },
    { id: 'notification-svc', label: 'Notification Hub', type: 'Service', layer: 'application', properties: { replicas: '2', channels: 'email,sms,push' } },
    { id: 'audit-log-db', label: 'Audit Log Store', type: 'Database', layer: 'infrastructure', properties: { engine: 'MongoDB', size: '120GB' } },
    { id: 'config-server', label: 'Config Server', type: 'Service', layer: 'middleware', properties: { provider: 'Spring Cloud Config', version: 'v3.0' } },
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
    // Business Scenario Layer
    { id: 'web-client', label: 'Web Storefront', type: 'Service', layer: 'scenario', properties: { framework: 'Next.js', replicas: '8' } },
    // Business Flow Layer
    { id: 'cdn-edge', label: 'Global CDN', type: 'Gateway', layer: 'flow', properties: { provider: 'CloudFlare', cacheHit: '94%' } },
    { id: 'gateway-01', label: 'API Gateway', type: 'Gateway', layer: 'flow', properties: { region: 'us-east-1', throughput: '10k' } },
    // Business Application Layer
    { id: 'auth-svc', label: 'Auth Service', type: 'Service', layer: 'application', properties: { replicas: '3', version: 'v1.4.2' } },
    { id: 'payment-svc', label: 'Payment API', type: 'Service', layer: 'application', properties: { replicas: '5', version: 'v2.0.1' } },
    { id: 'ml-model-v1', label: 'Fraud Detection Model', type: 'Service', layer: 'application', properties: { framework: 'PyTorch', latency: '45ms' } },
    { id: 'legacy-monolith', label: 'Legacy Core', type: 'Service', layer: 'application', properties: { replicas: '1', deprecated: 'true' } },
    // Middleware Layer
    { id: 'redis-cache', label: 'Session Cache', type: 'Cache', layer: 'middleware' },
    { id: 'event-stream', label: 'Kafka Cluster', type: 'Infrastructure', layer: 'middleware', properties: { partitions: '64', retention: '7d' } },
    // Infrastructure Layer
    { id: 'order-db', label: 'Order DB (PostgreSQL)', type: 'Database', layer: 'infrastructure', properties: { size: '500GB' } },
    { id: 'analytics-dw', label: 'Data Warehouse', type: 'Database', layer: 'infrastructure', properties: { engine: 'Snowflake', size: '20TB' } },
    { id: 'k8s-cluster', label: 'K8s Cluster', type: 'Infrastructure', layer: 'infrastructure' }
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
    updatedAt: Date.now() - 86400000 * 2
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
    updatedAt: Date.now() - 86400000 * 5
  },
  {
    id: 'rtp-03',
    name: 'Security Vulnerability Assessment',
    description: 'Comprehensive security scan results with CVE tracking and remediation guidance.',
    category: 'Security',
    content: `# Security Assessment: {{Target_System}}

## 1. Executive Summary
- **Scan Date**: {{Scan_Date}}
- **Total Vulnerabilities**: {{Total_Count}}
- **Critical/High**: {{Critical_Count}}

## 2. Vulnerability Distribution
\`\`\`json
{
  "type": "pie",
  "dataKey": "count",
  "nameKey": "severity",
  "data": [
    {"severity": "Critical", "count": 3, "color": "#ef4444"},
    {"severity": "High", "count": 12, "color": "#f97316"},
    {"severity": "Medium", "count": 28, "color": "#eab308"},
    {"severity": "Low", "count": 45, "color": "#22c55e"}
  ]
}
\`\`\`

## 3. Top Findings
| CVE ID | Severity | Component | Status |
| :--- | :--- | :--- | :--- |
| {{CVE_1}} | Critical | {{Component_1}} | Open |
| {{CVE_2}} | High | {{Component_2}} | Mitigated |

## 4. Remediation Timeline
\`\`\`mermaid
gantt
    title Remediation Schedule
    dateFormat  YYYY-MM-DD
    section Critical
    CVE-2024-001 :crit, 2024-01-15, 3d
    section High
    CVE-2024-002 :2024-01-18, 5d
\`\`\``,
    tags: ['CVE', 'Vulnerability', 'Compliance'],
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    id: 'rtp-04',
    name: 'Compliance Audit Report',
    description: 'Regulatory compliance verification for SOC2, GDPR, and HIPAA requirements.',
    category: 'Audit',
    content: `# Compliance Audit: {{Framework}}

## 1. Audit Scope
- **Framework**: {{Framework}}
- **Period**: {{Audit_Period}}
- **Auditor**: {{Auditor_Name}}

## 2. Compliance Score
\`\`\`json
{
  "type": "bar",
  "xKey": "control",
  "series": [{"key": "score", "color": "#06b6d4"}],
  "data": [
    {"control": "Access Control", "score": 95},
    {"control": "Data Protection", "score": 88},
    {"control": "Audit Logging", "score": 92},
    {"control": "Incident Response", "score": 85}
  ]
}
\`\`\`

## 3. Control Assessment
| Control ID | Description | Status | Evidence |
| :--- | :--- | :--- | :--- |
| CC6.1 | Logical Access | ✅ Pass | {{Evidence_1}} |
| CC7.2 | System Operations | ⚠️ Partial | {{Evidence_2}} |

## 4. Recommendations
- [ ] {{Recommendation_1}}
- [ ] {{Recommendation_2}}`,
    tags: ['SOC2', 'GDPR', 'Compliance'],
    updatedAt: Date.now() - 86400000 * 3
  },
  {
    id: 'rtp-05',
    name: 'Incident Response Playbook',
    description: 'Step-by-step incident handling procedures with escalation matrix.',
    category: 'Incident',
    content: `# Incident Response: {{Incident_Type}}

## 1. Classification
- **Severity**: {{Severity_Level}}
- **Category**: {{Category}}
- **SLA**: {{Response_SLA}}

## 2. Response Flow
\`\`\`mermaid
flowchart TD
    A[Incident Detected] --> B{Severity?}
    B -->|Critical| C[Page On-Call]
    B -->|High| D[Notify Team Lead]
    B -->|Medium/Low| E[Create Ticket]
    C --> F[War Room]
    D --> F
    F --> G[Root Cause Analysis]
    G --> H[Remediation]
    H --> I[Post-Mortem]
\`\`\`

## 3. Escalation Matrix
| Level | Contact | Response Time |
| :--- | :--- | :--- |
| L1 | {{L1_Contact}} | 15 min |
| L2 | {{L2_Contact}} | 30 min |
| L3 | {{L3_Contact}} | 1 hour |

## 4. Checklist
- [ ] Acknowledge incident
- [ ] Assess impact scope
- [ ] Engage stakeholders
- [ ] Document timeline`,
    tags: ['Playbook', 'Escalation', 'SLA'],
    updatedAt: Date.now() - 86400000 * 7
  },
  {
    id: 'rtp-06',
    name: 'Capacity Planning Report',
    description: 'Resource utilization trends and scaling recommendations.',
    category: 'Performance',
    content: `# Capacity Planning: {{Service_Cluster}}

## 1. Current Utilization
\`\`\`json
{
  "type": "line",
  "xKey": "week",
  "series": [
    {"key": "cpu_avg", "color": "#f59e0b", "name": "CPU"},
    {"key": "mem_avg", "color": "#8b5cf6", "name": "Memory"},
    {"key": "disk_avg", "color": "#10b981", "name": "Disk"}
  ],
  "data": [
    {"week": "W1", "cpu_avg": 45, "mem_avg": 62, "disk_avg": 38},
    {"week": "W2", "cpu_avg": 52, "mem_avg": 65, "disk_avg": 41},
    {"week": "W3", "cpu_avg": 58, "mem_avg": 71, "disk_avg": 45},
    {"week": "W4", "cpu_avg": 67, "mem_avg": 78, "disk_avg": 52}
  ]
}
\`\`\`

## 2. Growth Projection
| Resource | Current | 30-Day | 90-Day | Threshold |
| :--- | :--- | :--- | :--- | :--- |
| CPU | {{CPU_Current}}% | {{CPU_30d}}% | {{CPU_90d}}% | 80% |
| Memory | {{Mem_Current}}% | {{Mem_30d}}% | {{Mem_90d}}% | 85% |

## 3. Scaling Recommendations
- **Immediate**: {{Immediate_Action}}
- **Short-term**: {{Short_Term_Action}}
- **Long-term**: {{Long_Term_Action}}`,
    tags: ['Capacity', 'Scaling', 'Forecast'],
    updatedAt: Date.now() - 86400000 * 4
  },
  {
    id: 'rtp-07',
    name: 'API Health Check Report',
    description: 'Endpoint availability, latency percentiles, and error rate analysis.',
    category: 'Performance',
    content: `# API Health: {{API_Name}}

## 1. Availability Summary
- **Uptime**: {{Uptime_Percentage}}%
- **Total Requests**: {{Total_Requests}}
- **Error Rate**: {{Error_Rate}}%

## 2. Latency Distribution
\`\`\`json
{
  "type": "bar",
  "xKey": "endpoint",
  "series": [
    {"key": "p50", "color": "#22c55e", "name": "P50"},
    {"key": "p95", "color": "#f59e0b", "name": "P95"},
    {"key": "p99", "color": "#ef4444", "name": "P99"}
  ],
  "data": [
    {"endpoint": "/users", "p50": 45, "p95": 120, "p99": 250},
    {"endpoint": "/orders", "p50": 78, "p95": 180, "p99": 420},
    {"endpoint": "/products", "p50": 32, "p95": 85, "p99": 150}
  ]
}
\`\`\`

## 3. Error Breakdown
| Status Code | Count | Percentage | Trend |
| :--- | :--- | :--- | :--- |
| 4xx | {{4xx_Count}} | {{4xx_Pct}}% | {{4xx_Trend}} |
| 5xx | {{5xx_Count}} | {{5xx_Pct}}% | {{5xx_Trend}} |

## 4. Recommendations
- {{Recommendation_1}}
- {{Recommendation_2}}`,
    tags: ['API', 'Latency', 'SLO'],
    updatedAt: Date.now() - 86400000 * 6
  },
  {
    id: 'rtp-08',
    name: 'Database Health Assessment',
    description: 'Query performance, connection pool metrics, and index optimization.',
    category: 'Audit',
    content: `# Database Assessment: {{DB_Instance}}

## 1. Connection Metrics
- **Active Connections**: {{Active_Conn}}
- **Pool Utilization**: {{Pool_Util}}%
- **Wait Events**: {{Wait_Events}}

## 2. Query Performance
\`\`\`json
{
  "type": "area",
  "xKey": "time",
  "series": [
    {"key": "queries", "color": "#06b6d4", "name": "Queries/sec"},
    {"key": "slow_queries", "color": "#ef4444", "name": "Slow Queries"}
  ],
  "data": [
    {"time": "00:00", "queries": 1200, "slow_queries": 5},
    {"time": "06:00", "queries": 800, "slow_queries": 2},
    {"time": "12:00", "queries": 3500, "slow_queries": 45},
    {"time": "18:00", "queries": 2800, "slow_queries": 28}
  ]
}
\`\`\`

## 3. Top Slow Queries
| Query Hash | Avg Time | Calls | Impact |
| :--- | :--- | :--- | :--- |
| {{Hash_1}} | {{Time_1}}ms | {{Calls_1}} | High |
| {{Hash_2}} | {{Time_2}}ms | {{Calls_2}} | Medium |

## 4. Index Recommendations
- [ ] Create index on {{Table_1}}.{{Column_1}}
- [ ] Rebuild index {{Index_Name}}`,
    tags: ['Database', 'Query', 'Index'],
    updatedAt: Date.now() - 86400000 * 8
  },
  {
    id: 'rtp-09',
    name: 'Network Security Posture',
    description: 'Firewall rules audit, network segmentation verification, and traffic analysis.',
    category: 'Security',
    content: `# Network Security: {{Network_Zone}}

## 1. Firewall Summary
- **Total Rules**: {{Total_Rules}}
- **Redundant Rules**: {{Redundant_Rules}}
- **Shadow Rules**: {{Shadow_Rules}}

## 2. Traffic Flow
\`\`\`mermaid
flowchart LR
    subgraph Public
        A[Internet]
    end
    subgraph DMZ
        B[WAF]
        C[Load Balancer]
    end
    subgraph Private
        D[App Servers]
        E[Database]
    end
    A -->|HTTPS| B
    B --> C
    C --> D
    D -->|TCP 5432| E
\`\`\`

## 3. Rule Analysis
| Rule ID | Source | Destination | Action | Risk |
| :--- | :--- | :--- | :--- | :--- |
| {{Rule_1}} | Any | {{Dest_1}} | Allow | ⚠️ High |
| {{Rule_2}} | {{Src_2}} | {{Dest_2}} | Allow | ✅ Low |

## 4. Remediation
- [ ] Remove overly permissive rule {{Rule_ID}}
- [ ] Implement micro-segmentation`,
    tags: ['Firewall', 'Network', 'Segmentation'],
    updatedAt: Date.now() - 86400000 * 10
  },
  {
    id: 'rtp-10',
    name: 'Cost Optimization Analysis',
    description: 'Cloud resource cost breakdown with savings opportunities.',
    category: 'Audit',
    content: `# Cost Analysis: {{Cloud_Account}}

## 1. Spend Overview
- **Monthly Cost**: \${{Monthly_Cost}}
- **MoM Change**: {{MoM_Change}}%
- **Forecast**: \${{Forecast_Cost}}

## 2. Cost by Service
\`\`\`json
{
  "type": "pie",
  "dataKey": "cost",
  "nameKey": "service",
  "data": [
    {"service": "Compute", "cost": 45000, "color": "#f59e0b"},
    {"service": "Storage", "cost": 18000, "color": "#8b5cf6"},
    {"service": "Network", "cost": 12000, "color": "#06b6d4"},
    {"service": "Database", "cost": 25000, "color": "#10b981"}
  ]
}
\`\`\`

## 3. Optimization Opportunities
| Category | Current | Optimized | Savings |
| :--- | :--- | :--- | :--- |
| Reserved Instances | \${{RI_Current}} | \${{RI_Opt}} | \${{RI_Save}} |
| Idle Resources | \${{Idle_Current}} | \$0 | \${{Idle_Save}} |
| Right-sizing | \${{RS_Current}} | \${{RS_Opt}} | \${{RS_Save}} |

## 4. Action Items
- [ ] Purchase reserved capacity for {{Service_1}}
- [ ] Terminate idle instances: {{Instance_List}}
- [ ] Resize over-provisioned {{Resource_Type}}`,
    tags: ['FinOps', 'Cost', 'Optimization'],
    updatedAt: Date.now() - 86400000 * 12
  },
  {
    id: 'rtp-11',
    name: 'Change Impact Assessment',
    description: 'Pre-deployment risk analysis and rollback procedures.',
    category: 'Incident',
    content: `# Change Assessment: {{Change_ID}}

## 1. Change Summary
- **Type**: {{Change_Type}}
- **Risk Level**: {{Risk_Level}}
- **Affected Systems**: {{Affected_Count}}

## 2. Impact Analysis
\`\`\`mermaid
flowchart TD
    A[{{Change_Component}}] --> B[Service A]
    A --> C[Service B]
    B --> D[Database]
    C --> D
    B --> E[Cache]
    style A fill:#f59e0b
    style B fill:#fef3c7
    style C fill:#fef3c7
\`\`\`

## 3. Risk Matrix
| Risk | Likelihood | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| {{Risk_1}} | Medium | High | {{Mit_1}} |
| {{Risk_2}} | Low | Medium | {{Mit_2}} |

## 4. Rollback Plan
1. Revert deployment: \`{{Rollback_Cmd}}\`
2. Restore database snapshot: {{Snapshot_ID}}
3. Notify stakeholders

## 5. Approval
- [ ] Tech Lead: {{Tech_Lead}}
- [ ] Change Board: {{CAB_Status}}`,
    tags: ['Change', 'Risk', 'Rollback'],
    updatedAt: Date.now() - 86400000 * 14
  },
  {
    id: 'rtp-12',
    name: 'SLO Compliance Report',
    description: 'Service level objective tracking with error budget analysis.',
    category: 'Performance',
    content: `# SLO Report: {{Service_Name}}

## 1. SLO Summary
| Objective | Target | Actual | Status |
| :--- | :--- | :--- | :--- |
| Availability | 99.9% | {{Avail_Actual}}% | {{Avail_Status}} |
| Latency P99 | <500ms | {{Lat_Actual}}ms | {{Lat_Status}} |
| Error Rate | <0.1% | {{Err_Actual}}% | {{Err_Status}} |

## 2. Error Budget
\`\`\`json
{
  "type": "line",
  "xKey": "day",
  "series": [
    {"key": "budget_remaining", "color": "#22c55e", "name": "Budget Remaining"},
    {"key": "budget_consumed", "color": "#ef4444", "name": "Budget Consumed"}
  ],
  "data": [
    {"day": "1", "budget_remaining": 100, "budget_consumed": 0},
    {"day": "7", "budget_remaining": 85, "budget_consumed": 15},
    {"day": "14", "budget_remaining": 62, "budget_consumed": 38},
    {"day": "21", "budget_remaining": 45, "budget_consumed": 55},
    {"day": "28", "budget_remaining": 28, "budget_consumed": 72}
  ]
}
\`\`\`

## 3. Burn Rate
- **Current**: {{Burn_Rate}}x
- **Alert Threshold**: 2x
- **Days Until Exhaustion**: {{Days_Left}}

## 4. Incidents Impacting SLO
| Date | Duration | Impact | Root Cause |
| :--- | :--- | :--- | :--- |
| {{Date_1}} | {{Dur_1}} | {{Impact_1}}% | {{Cause_1}} |
| {{Date_2}} | {{Dur_2}} | {{Impact_2}}% | {{Cause_2}} |`,
    tags: ['SLO', 'SLA', 'ErrorBudget'],
    updatedAt: Date.now() - 86400000 * 9
  },
  {
    id: 'rtp-13',
    name: 'Dependency Vulnerability Scan',
    description: 'Third-party library security analysis with upgrade recommendations.',
    category: 'Security',
    content: `# Dependency Scan: {{Project_Name}}

## 1. Scan Overview
- **Total Dependencies**: {{Total_Deps}}
- **Vulnerable**: {{Vuln_Count}}
- **Outdated**: {{Outdated_Count}}

## 2. Severity Breakdown
\`\`\`json
{
  "type": "bar",
  "xKey": "category",
  "series": [{"key": "count", "color": "#ef4444"}],
  "data": [
    {"category": "Critical", "count": 2},
    {"category": "High", "count": 8},
    {"category": "Medium", "count": 15},
    {"category": "Low", "count": 23}
  ]
}
\`\`\`

## 3. Top Vulnerabilities
| Package | Version | CVE | Fix Version |
| :--- | :--- | :--- | :--- |
| {{Pkg_1}} | {{Ver_1}} | {{CVE_1}} | {{Fix_1}} |
| {{Pkg_2}} | {{Ver_2}} | {{CVE_2}} | {{Fix_2}} |
| {{Pkg_3}} | {{Ver_3}} | {{CVE_3}} | {{Fix_3}} |

## 4. Upgrade Commands
\`\`\`bash
npm update {{Pkg_1}}@{{Fix_1}}
npm update {{Pkg_2}}@{{Fix_2}}
\`\`\``,
    tags: ['Dependencies', 'NPM', 'CVE'],
    updatedAt: Date.now() - 86400000 * 11
  },
  {
    id: 'rtp-14',
    name: 'Disaster Recovery Test Report',
    description: 'DR drill results with RTO/RPO measurements and gap analysis.',
    category: 'Audit',
    content: `# DR Test Report: {{DR_Scenario}}

## 1. Test Summary
- **Date**: {{Test_Date}}
- **Scenario**: {{Scenario_Type}}
- **Result**: {{Overall_Result}}

## 2. Recovery Metrics
| Metric | Target | Actual | Status |
| :--- | :--- | :--- | :--- |
| RTO | {{RTO_Target}} | {{RTO_Actual}} | {{RTO_Status}} |
| RPO | {{RPO_Target}} | {{RPO_Actual}} | {{RPO_Status}} |
| Data Integrity | 100% | {{Data_Integrity}}% | {{DI_Status}} |

## 3. Recovery Timeline
\`\`\`mermaid
gantt
    title Recovery Timeline
    dateFormat HH:mm
    section Infrastructure
    Network Restore :done, 09:00, 15m
    Compute Restore :done, 09:15, 30m
    section Data
    Database Restore :done, 09:45, 45m
    Cache Warm-up :done, 10:30, 20m
    section Validation
    Health Checks :done, 10:50, 10m
    Traffic Switch :done, 11:00, 5m
\`\`\`

## 4. Issues Found
| Issue | Severity | Resolution |
| :--- | :--- | :--- |
| {{Issue_1}} | High | {{Resolution_1}} |
| {{Issue_2}} | Medium | {{Resolution_2}} |

## 5. Recommendations
- [ ] Update runbook for {{Runbook_Update}}
- [ ] Automate {{Automation_Task}}`,
    tags: ['DR', 'RTO', 'RPO', 'BCP'],
    updatedAt: Date.now() - 86400000 * 15
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
    content: `# Security Nexus Audit Report

## Executive Summary

This audit evaluates the security posture of the global edge infrastructure across **3 regions** (us-east-1, eu-central-1, ap-southeast-1). The assessment covers zero-trust header compliance, WAF rule effectiveness, and TLS configuration hardening.

**Overall Security Score: 94/100** ✅

---

## 1. Zero-Trust Header Compliance

All edge nodes were evaluated for mandatory security headers:

| Header | Coverage | Status |
|--------|----------|--------|
| \`X-Content-Type-Options\` | 100% | ✅ Pass |
| \`X-Frame-Options\` | 100% | ✅ Pass |
| \`Strict-Transport-Security\` | 98.2% | ⚠️ Minor |
| \`Content-Security-Policy\` | 95.4% | ⚠️ Minor |
| \`X-Request-ID\` (Trace) | 100% | ✅ Pass |

### Non-Compliant Endpoints

\`\`\`
cdn-edge-ap-03:/static/legacy/*  - Missing HSTS header (legacy CDN node)
cdn-edge-eu-07:/api/v1/webhooks  - CSP too permissive (unsafe-inline)
\`\`\`

---

## 2. WAF Bypass Vulnerability Assessment

Simulated attack patterns were tested against the ModSecurity ruleset:

\`\`\`json
{
  "type": "bar",
  "xKey": "attack",
  "data": [
    { "attack": "SQLi", "blocked": 847, "bypassed": 3 },
    { "attack": "XSS", "blocked": 1203, "bypassed": 0 },
    { "attack": "RCE", "blocked": 156, "bypassed": 0 },
    { "attack": "SSRF", "blocked": 89, "bypassed": 1 },
    { "attack": "Path Traversal", "blocked": 234, "bypassed": 0 }
  ],
  "series": [
    { "key": "blocked", "color": "#22d3ee" },
    { "key": "bypassed", "color": "#ef4444" }
  ]
}
\`\`\`

### Bypass Details

| Attack Vector | Payload Sample | Remediation |
|--------------|----------------|-------------|
| SQLi (3 bypasses) | \`1'/**/OR/**/1=1--\` | Updated rule 942100 |
| SSRF (1 bypass) | \`http://169.254.169.254\` | Added AWS metadata block |

---

## 3. TLS 1.3 Compliance

\`\`\`mermaid
pie title TLS Version Distribution
    "TLS 1.3" : 89
    "TLS 1.2" : 11
    "TLS 1.1 (Deprecated)" : 0
\`\`\`

### Certificate Chain Analysis

All certificates are issued by **DigiCert Global G2** with proper intermediate chain. No self-signed certificates detected.

**Cipher Suite Audit:**
- ✅ TLS_AES_256_GCM_SHA384 (Primary)
- ✅ TLS_CHACHA20_POLY1305_SHA256 (Mobile optimized)
- ❌ TLS_RSA_WITH_AES_128_CBC_SHA (Disabled - Weak)

---

## 4. Recommendations

1. **High Priority**: Patch legacy CDN node \`cdn-edge-ap-03\` to enforce HSTS
2. **Medium Priority**: Tighten CSP policy on webhook endpoints
3. **Low Priority**: Schedule TLS 1.2 deprecation for Q2 2025

---

*Report generated by Security Sentinel Agent v3.2.1*
*Scan duration: 47 minutes | Endpoints scanned: 1,847*`,
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
    content: `# Latency Benchmark: Payment Flow

## Executive Summary

Performance analysis of the payment processing pipeline during the **Black Friday / Cyber Monday (BFCM)** traffic surge. Peak throughput reached **12,847 TPS** with P99 latency degradation identified in the order-db connection layer.

**SLA Compliance: 97.3%** (Target: 99%)

---

## 1. Latency Distribution Analysis

\`\`\`json
{
  "type": "line",
  "xKey": "hour",
  "data": [
    { "hour": "00:00", "p50": 45, "p95": 120, "p99": 180 },
    { "hour": "04:00", "p50": 42, "p95": 110, "p99": 165 },
    { "hour": "08:00", "p50": 48, "p95": 145, "p99": 245 },
    { "hour": "12:00", "p50": 67, "p95": 210, "p99": 478 },
    { "hour": "16:00", "p50": 89, "p95": 340, "p99": 892 },
    { "hour": "20:00", "p50": 156, "p95": 567, "p99": 1450 },
    { "hour": "23:00", "p50": 78, "p95": 234, "p99": 456 }
  ],
  "series": [
    { "key": "p50", "color": "#22d3ee" },
    { "key": "p95", "color": "#fbbf24" },
    { "key": "p99", "color": "#ef4444" }
  ]
}
\`\`\`

> ⚠️ **Alert**: P99 exceeded 1000ms threshold at 20:00 UTC during peak checkout window

---

## 2. Request Flow Breakdown

\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant P as Payment Service
    participant D as Order DB
    participant R as Redis Cache

    C->>G: POST /checkout
    G->>P: authorize()
    P->>R: get_session (2ms)
    R-->>P: session_data
    P->>D: insert_order (⚠️ 450ms)
    D-->>P: order_id
    P->>D: update_inventory (⚠️ 380ms)
    D-->>P: ack
    P-->>G: 200 OK
    G-->>C: order_confirmed
\`\`\`

### Bottleneck Identification

| Component | Avg Latency | Contribution | Status |
|-----------|-------------|--------------|--------|
| API Gateway | 12ms | 3.2% | ✅ Normal |
| Payment Service | 34ms | 9.1% | ✅ Normal |
| Redis Cache | 2ms | 0.5% | ✅ Optimal |
| **Order DB Write** | **450ms** | **48.7%** | ❌ Critical |
| **Inventory Update** | **380ms** | **38.5%** | ❌ Critical |

---

## 3. Database Connection Pool Analysis

\`\`\`json
{
  "type": "area",
  "xKey": "time",
  "data": [
    { "time": "19:00", "active": 45, "idle": 55, "waiting": 0 },
    { "time": "19:30", "active": 78, "idle": 22, "waiting": 0 },
    { "time": "20:00", "active": 100, "idle": 0, "waiting": 156 },
    { "time": "20:30", "active": 100, "idle": 0, "waiting": 234 },
    { "time": "21:00", "active": 92, "idle": 8, "waiting": 12 },
    { "time": "21:30", "active": 67, "idle": 33, "waiting": 0 }
  ],
  "series": [
    { "key": "active", "color": "#22d3ee" },
    { "key": "idle", "color": "#34d399" },
    { "key": "waiting", "color": "#ef4444" }
  ]
}
\`\`\`

**Root Cause**: Connection pool size of 100 was exhausted. Queries queued up to 234 waiting connections.

---

## 4. Remediation Applied

| Action | Impact | Status |
|--------|--------|--------|
| Increase pool size to 200 | -67% queue wait time | ✅ Deployed |
| Add read replica for inventory | -45% write contention | ✅ Deployed |
| Enable PgBouncer connection pooling | -23% connection overhead | 🔄 Testing |

---

## 5. Post-Fix Validation

After applying fixes, P99 latency during simulated load:
- **Before**: 1,450ms at 12k TPS
- **After**: 320ms at 15k TPS

**Headroom increased by 25%** for next peak event.

---

*Report generated by Performance Analyst Bot v2.1.0*
*Analysis window: 24 hours | Samples: 2.3M requests*`,
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
    content: `# DR Compliance Status

## Executive Summary

Quarterly disaster recovery audit for multi-region PostgreSQL cluster. This report validates **RPO (Recovery Point Objective)** and **RTO (Recovery Time Objective)** compliance against SOC 2 Type II and ISO 27001 requirements.

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| RPO | < 60 seconds | 12 seconds | ✅ Compliant |
| RTO | < 15 minutes | 8.5 minutes | ✅ Compliant |
| Data Integrity | 100% | 100% | ✅ Verified |

---

## 1. Replication Architecture

\`\`\`mermaid
flowchart LR
    subgraph Primary["us-east-1 (Primary)"]
        P[(order-db-primary)]
    end

    subgraph DR1["eu-central-1 (DR)"]
        R1[(order-db-replica-1)]
    end

    subgraph DR2["ap-southeast-1 (DR)"]
        R2[(order-db-replica-2)]
    end

    P -->|Sync Replication<br/>Lag: 12ms| R1
    P -->|Async Replication<br/>Lag: 89ms| R2
    R1 -.->|Cross-region backup| R2
\`\`\`

---

## 2. Replication Lag Trend (Last 7 Days)

\`\`\`json
{
  "type": "line",
  "xKey": "day",
  "data": [
    { "day": "Mon", "eu_central": 11, "ap_southeast": 85 },
    { "day": "Tue", "eu_central": 14, "ap_southeast": 92 },
    { "day": "Wed", "eu_central": 9, "ap_southeast": 78 },
    { "day": "Thu", "eu_central": 18, "ap_southeast": 156 },
    { "day": "Fri", "eu_central": 12, "ap_southeast": 89 },
    { "day": "Sat", "eu_central": 8, "ap_southeast": 67 },
    { "day": "Sun", "eu_central": 10, "ap_southeast": 72 }
  ],
  "series": [
    { "key": "eu_central", "color": "#22d3ee" },
    { "key": "ap_southeast", "color": "#f472b6" }
  ]
}
\`\`\`

> ⚠️ **Note**: Thursday spike (156ms) in ap-southeast-1 caused by network maintenance window. Within acceptable threshold.

---

## 3. Failover Drill Results

| Test Scenario | Duration | Data Loss | Success |
|--------------|----------|-----------|---------|
| Primary → EU-Central (Planned) | 4m 12s | 0 rows | ✅ |
| Primary → AP-Southeast (Planned) | 6m 45s | 0 rows | ✅ |
| Primary → EU-Central (Unplanned) | 8m 34s | 0 rows | ✅ |
| Network Partition Simulation | 2m 08s | 0 rows | ✅ |

### Failover Timeline Breakdown

\`\`\`
[00:00] Primary failure detected
[00:15] Health check confirmation (3 retries)
[00:45] Replica promotion initiated
[02:30] DNS failover triggered (Route 53)
[04:00] Connection pool refresh
[08:34] Full traffic restored
\`\`\`

---

## 4. Backup Verification

| Backup Type | Frequency | Last Verified | Integrity |
|-------------|-----------|---------------|-----------|
| Full Snapshot | Daily | 2024-01-18 | ✅ SHA256 Match |
| WAL Archive | Continuous | 2024-01-19 | ✅ Sequence Valid |
| Cross-region Copy | 6 hours | 2024-01-19 | ✅ Replicated |

**Point-in-Time Recovery Test**: Successfully restored to \`2024-01-17 14:32:00 UTC\` with 0 data discrepancy.

---

## 5. Compliance Checklist

- [x] Replication lag within SLA bounds
- [x] Automated failover tested quarterly
- [x] Backup encryption (AES-256) verified
- [x] Cross-region backup replication active
- [x] Runbook documentation updated
- [x] On-call rotation notified of DR procedures

---

## 6. Recommendations

1. **Consider** upgrading ap-southeast-1 replica to synchronous mode if latency requirements tighten
2. **Schedule** chaos engineering drill for Q2 (Kubernetes node failure + DB failover combined)
3. **Review** Route 53 TTL settings (currently 60s, could reduce to 30s)

---

*Report generated by Compliance Guardian v1.8.0*
*Audit period: 2024-01-12 to 2024-01-19*`,
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
    content: `# Model Health Alert

## ⚠️ Alert: Model Drift Detected

The \`fraud-detection-v2\` model has experienced significant performance degradation over the past 72 hours. This report analyzes the root cause and proposes remediation steps.

| Metric | Baseline | Current | Delta |
|--------|----------|---------|-------|
| Precision | 94.2% | 82.1% | **-12.1%** |
| Recall | 91.8% | 87.3% | -4.5% |
| F1 Score | 93.0% | 84.6% | **-8.4%** |
| False Positive Rate | 2.1% | 8.7% | **+6.6%** |

---

## 1. Performance Degradation Timeline

\`\`\`json
{
  "type": "line",
  "xKey": "date",
  "data": [
    { "date": "Jan 12", "precision": 94.2, "recall": 91.8, "f1": 93.0 },
    { "date": "Jan 13", "precision": 93.8, "recall": 91.5, "f1": 92.6 },
    { "date": "Jan 14", "precision": 91.2, "recall": 90.1, "f1": 90.6 },
    { "date": "Jan 15", "precision": 87.4, "recall": 89.2, "f1": 88.3 },
    { "date": "Jan 16", "precision": 84.1, "recall": 88.0, "f1": 86.0 },
    { "date": "Jan 17", "precision": 82.8, "recall": 87.5, "f1": 85.1 },
    { "date": "Jan 18", "precision": 82.1, "recall": 87.3, "f1": 84.6 }
  ],
  "series": [
    { "key": "precision", "color": "#ef4444" },
    { "key": "recall", "color": "#fbbf24" },
    { "key": "f1", "color": "#22d3ee" }
  ]
}
\`\`\`

---

## 2. Feature Distribution Shift Analysis

### Top Drifted Features

| Feature | KS Statistic | Drift Severity |
|---------|--------------|----------------|
| \`transaction_amount\` | 0.342 | 🔴 High |
| \`merchant_category\` | 0.287 | 🔴 High |
| \`hour_of_day\` | 0.156 | 🟡 Medium |
| \`device_fingerprint\` | 0.089 | 🟢 Low |
| \`geo_distance\` | 0.045 | 🟢 Low |

### Transaction Amount Distribution Shift

\`\`\`json
{
  "type": "bar",
  "xKey": "range",
  "data": [
    { "range": "$0-50", "baseline": 35, "current": 22 },
    { "range": "$50-100", "baseline": 28, "current": 19 },
    { "range": "$100-500", "baseline": 25, "current": 31 },
    { "range": "$500-1000", "baseline": 8, "current": 18 },
    { "range": "$1000+", "baseline": 4, "current": 10 }
  ],
  "series": [
    { "key": "baseline", "color": "#64748b" },
    { "key": "current", "color": "#f472b6" }
  ]
}
\`\`\`

> 📊 **Insight**: Significant increase in high-value transactions ($500+) correlates with post-holiday gift card redemption patterns.

---

## 3. Root Cause Analysis

\`\`\`mermaid
flowchart TD
    A[Model Drift Detected] --> B{Feature Drift?}
    B -->|Yes| C[transaction_amount shifted]
    B -->|Yes| D[merchant_category shifted]
    C --> E[Post-Holiday Spending Pattern]
    D --> F[Gift Card Redemption Surge]
    E --> G[Training Data Gap]
    F --> G
    G --> H[Model Retraining Required]
\`\`\`

### Hypothesis Validation

1. **Seasonal Pattern**: ✅ Confirmed
   - 156% increase in gift card transactions vs. baseline
   - Average transaction value increased from $127 to $312

2. **New Merchant Categories**: ✅ Confirmed
   - 23 new merchant IDs not present in training data
   - Primarily luxury goods and electronics retailers

3. **Fraud Pattern Evolution**: ⚠️ Investigating
   - New card-not-present fraud vector detected
   - Awaiting manual label verification

---

## 4. Impact Assessment

### False Positive Analysis

| Category | Volume | Revenue Impact |
|----------|--------|----------------|
| Legitimate blocked | 2,847 | -$892,400 |
| Customer friction | ~4,200 | -$156,000 (est.) |
| Support tickets | 312 | -$15,600 |
| **Total Impact** | | **-$1,064,000** |

### False Negative Risk

| Fraud Type | Missed | Exposure |
|------------|--------|----------|
| Card-not-present | 47 | $234,500 |
| Account takeover | 12 | $89,200 |
| Synthetic identity | 3 | $45,000 |

---

## 5. Recommended Actions

### Immediate (Next 24h)
- [ ] Lower decision threshold from 0.7 → 0.6 (increase recall)
- [ ] Enable manual review queue for $500+ transactions
- [ ] Alert fraud ops team for increased monitoring

### Short-term (This Week)
- [ ] Retrain model with last 30 days of labeled data
- [ ] Add gift card redemption features
- [ ] Implement merchant category embedding refresh

### Long-term (This Month)
- [ ] Deploy online learning pipeline for continuous adaptation
- [ ] Build seasonality-aware feature engineering
- [ ] Establish automated drift detection alerting

---

## 6. Appendix: Model Configuration

\`\`\`yaml
model:
  name: fraud-detection-v2
  framework: XGBoost 1.7.4
  features: 127
  training_samples: 2.4M
  last_trained: 2023-12-15

thresholds:
  decision: 0.7
  alert: 0.5

monitoring:
  precision_alert: < 90%
  drift_check: daily
\`\`\`

---

*Report generated by Data Scientist Agent v2.0.1*
*Analysis window: 72 hours | Transactions analyzed: 847,293*`,
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
    content: `# Cluster Utilization Summary

## Executive Summary

Weekly Kubernetes cluster health scan for the production \`eks-prod-us-east-1\` cluster. This report evaluates resource utilization, auto-scaling efficiency, and identifies optimization opportunities.

**Cluster Health Score: 87/100** ✅

| Resource | Allocated | Used | Efficiency |
|----------|-----------|------|------------|
| CPU | 256 cores | 164 cores | 64.1% |
| Memory | 1024 GB | 687 GB | 67.1% |
| Storage | 10 TB | 4.2 TB | 42.0% |

---

## 1. Node Group Overview

| Node Group | Instance Type | Count | CPU Util | Memory Util |
|------------|---------------|-------|----------|-------------|
| system | m5.large | 3 | 34% | 52% |
| general | m5.2xlarge | 12 | 67% | 71% |
| compute | c5.4xlarge | 6 | 78% | 45% |
| memory | r5.2xlarge | 4 | 42% | 89% |
| gpu | p3.2xlarge | 2 | 23% | 34% |

---

## 2. Resource Utilization Trend (7 Days)

\`\`\`json
{
  "type": "area",
  "xKey": "day",
  "data": [
    { "day": "Mon", "cpu": 58, "memory": 62 },
    { "day": "Tue", "cpu": 67, "memory": 68 },
    { "day": "Wed", "cpu": 71, "memory": 72 },
    { "day": "Thu", "cpu": 64, "memory": 67 },
    { "day": "Fri", "cpu": 78, "memory": 74 },
    { "day": "Sat", "cpu": 45, "memory": 58 },
    { "day": "Sun", "cpu": 42, "memory": 55 }
  ],
  "series": [
    { "key": "cpu", "color": "#22d3ee" },
    { "key": "memory", "color": "#818cf8" }
  ]
}
\`\`\`

---

## 3. Auto-Scaling Events

\`\`\`mermaid
gantt
    title Auto-Scaling Events This Week
    dateFormat HH:mm
    axisFormat %H:%M

    section Scale Up
    general +2 nodes    :done, 09:00, 30m
    compute +1 node     :done, 14:00, 20m
    general +3 nodes    :done, 19:00, 45m

    section Scale Down
    general -2 nodes    :active, 02:00, 30m
    compute -1 node     :active, 04:00, 20m
\`\`\`

### Scaling Efficiency Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Scale-up latency | 2.3 min | < 5 min | ✅ |
| Scale-down delay | 10 min | 10 min | ✅ |
| Node warm-up time | 45 sec | < 60 sec | ✅ |
| Failed scale events | 0 | 0 | ✅ |

---

## 4. Pod Resource Analysis

### Top CPU Consumers

| Namespace | Deployment | Pods | CPU Request | CPU Actual |
|-----------|------------|------|-------------|------------|
| payment | payment-api | 12 | 4000m | 3200m |
| analytics | spark-worker | 8 | 8000m | 7100m |
| ml | fraud-model | 4 | 2000m | 1800m |
| web | storefront | 16 | 2000m | 1400m |

### Resource Quotas Status

\`\`\`json
{
  "type": "bar",
  "xKey": "namespace",
  "data": [
    { "namespace": "payment", "used": 78, "limit": 100 },
    { "namespace": "analytics", "used": 92, "limit": 100 },
    { "namespace": "ml", "used": 45, "limit": 100 },
    { "namespace": "web", "used": 56, "limit": 100 },
    { "namespace": "monitoring", "used": 34, "limit": 100 }
  ],
  "series": [
    { "key": "used", "color": "#22d3ee" },
    { "key": "limit", "color": "#334155" }
  ]
}
\`\`\`

> ⚠️ **Warning**: \`analytics\` namespace at 92% quota utilization. Consider increasing limits before next batch job.

---

## 5. Cost Optimization Opportunities

| Recommendation | Monthly Savings | Effort |
|----------------|-----------------|--------|
| Right-size gpu nodes (p3.2xlarge → g4dn.xlarge) | $2,400 | Low |
| Enable Spot instances for analytics workloads | $1,800 | Medium |
| Consolidate system node group | $450 | Low |
| Implement pod disruption budgets | - | Low |

**Potential Monthly Savings: $4,650**

---

## 6. Cluster Topology

\`\`\`mermaid
flowchart TB
    subgraph AZ1["us-east-1a"]
        N1[general-1]
        N2[general-2]
        N3[compute-1]
        N4[system-1]
    end

    subgraph AZ2["us-east-1b"]
        N5[general-3]
        N6[general-4]
        N7[compute-2]
        N8[memory-1]
    end

    subgraph AZ3["us-east-1c"]
        N9[general-5]
        N10[compute-3]
        N11[memory-2]
        N12[gpu-1]
    end

    LB[ALB] --> AZ1 & AZ2 & AZ3
\`\`\`

---

## 7. Recommendations

1. **High Priority**: Increase analytics namespace quota to 120% before scheduled batch processing
2. **Medium Priority**: Evaluate GPU node utilization - consider scheduled scaling
3. **Low Priority**: Review memory node group sizing for potential right-sizing

---

*Report generated by Ops Automator v3.4.2*
*Scan duration: 12 minutes | Nodes scanned: 27 | Pods analyzed: 847*`,
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
    content: `# API Lifecycle Audit

## Executive Summary

Audit of API version usage across all consumers. The \`/api/v1/*\` endpoints are scheduled for deprecation on **March 31, 2024**. This report identifies remaining consumers and provides migration guidance.

| Version | Endpoints | Daily Calls | Status |
|---------|-----------|-------------|--------|
| v3 (Current) | 47 | 12.4M | ✅ Active |
| v2 (Stable) | 38 | 8.2M | ✅ Active |
| v1 (Deprecated) | 23 | 456K | ⚠️ Sunset |

---

## 1. V1 API Consumer Analysis

\`\`\`json
{
  "type": "pie",
  "data": [
    { "name": "Mobile iOS", "value": 34 },
    { "name": "Mobile Android", "value": 28 },
    { "name": "Partner Integrations", "value": 22 },
    { "name": "Internal Tools", "value": 12 },
    { "name": "Unknown", "value": 4 }
  ]
}
\`\`\`

### Top V1 Consumers Requiring Migration

| Consumer | API Key | Daily Calls | Contact |
|----------|---------|-------------|---------|
| PartnerCo Integration | pk_live_a3f7... | 89,234 | api@partnerco.com |
| Legacy Mobile App v2.x | pk_live_m2x9... | 67,891 | mobile-team@internal |
| Warehouse System | pk_live_wh12... | 45,123 | warehouse-ops@internal |
| Analytics Dashboard | pk_live_an78... | 34,567 | analytics@internal |
| Third-party Webhook | pk_live_3p45... | 28,901 | support@thirdparty.io |

---

## 2. Endpoint Deprecation Timeline

\`\`\`mermaid
gantt
    title API Deprecation Schedule
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section V1 Endpoints
    Deprecation Warning     :done, 2024-01-01, 30d
    Migration Period        :active, 2024-02-01, 60d
    Sunset Date            :crit, 2024-03-31, 1d
    Tombstone Response     :2024-04-01, 90d

    section V2 Endpoints
    Current Version        :2024-01-01, 365d
\`\`\`

---

## 3. Breaking Changes: V1 → V2

| Endpoint | V1 Format | V2 Format | Migration Guide |
|----------|-----------|-----------|-----------------|
| \`/users\` | XML response | JSON response | [Link](#) |
| \`/orders\` | Sync call | Async + webhook | [Link](#) |
| \`/payments\` | Basic auth | OAuth 2.0 | [Link](#) |
| \`/inventory\` | Single item | Batch support | [Link](#) |

### Response Format Changes

**V1 Response (Deprecated):**
\`\`\`xml
<user>
  <id>12345</id>
  <name>John Doe</name>
  <email>john@example.com</email>
</user>
\`\`\`

**V2 Response (Current):**
\`\`\`json
{
  "data": {
    "id": "12345",
    "attributes": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "meta": {
    "version": "2.0",
    "timestamp": "2024-01-19T10:30:00Z"
  }
}
\`\`\`

---

## 4. Migration Progress

\`\`\`json
{
  "type": "bar",
  "xKey": "week",
  "data": [
    { "week": "W1", "v1Calls": 890, "v2Calls": 450 },
    { "week": "W2", "v1Calls": 780, "v2Calls": 620 },
    { "week": "W3", "v1Calls": 620, "v2Calls": 890 },
    { "week": "W4", "v1Calls": 456, "v2Calls": 1240 }
  ],
  "series": [
    { "key": "v1Calls", "color": "#ef4444" },
    { "key": "v2Calls", "color": "#22d3ee" }
  ]
}
\`\`\`

**Migration Rate**: 48.7% of V1 traffic migrated in last 4 weeks ✅

---

## 5. Communication Plan

| Date | Action | Audience | Channel |
|------|--------|----------|---------|
| Jan 15 | Initial deprecation notice | All V1 users | Email |
| Feb 1 | Migration guide release | Developers | Dev portal |
| Feb 15 | Second reminder | Remaining V1 users | Email + Banner |
| Mar 1 | Final warning | High-volume V1 users | Direct contact |
| Mar 31 | Sunset | - | API returns 410 Gone |

---

## 6. Action Items

### For Platform Team
- [x] Add deprecation headers to V1 responses
- [x] Publish migration documentation
- [ ] Set up V1 → V2 proxy for grace period
- [ ] Configure rate limiting on V1 endpoints

### For Consumer Teams
- [ ] PartnerCo: Schedule migration call
- [ ] Mobile Team: Release app update (v3.0)
- [ ] Warehouse: Update integration scripts
- [ ] Analytics: Migrate dashboard queries

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Partner integration breaks | Medium | High | Direct outreach + extended grace |
| Mobile app crash | Low | Medium | Force update before sunset |
| Data format incompatibility | Low | Low | Provide transformation layer |

---

*Report generated by Archivist Agent v1.2.0*
*API calls analyzed: 21.2M | Consumers identified: 847*`,
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
    content: `# SSL/TLS Inventory

## Executive Summary

Automated scan of all public-facing TLS certificates across the infrastructure. This report tracks certificate validity, issuer compliance, and upcoming renewals.

**Certificate Health: 100%** ✅

| Total Certificates | Valid | Expiring Soon | Expired |
|-------------------|-------|---------------|---------|
| 42 | 42 | 3 | 0 |

---

## 1. Certificate Expiry Timeline

\`\`\`json
{
  "type": "bar",
  "xKey": "domain",
  "data": [
    { "domain": "api.entropy.io", "daysLeft": 45 },
    { "domain": "app.entropy.io", "daysLeft": 67 },
    { "domain": "cdn.entropy.io", "daysLeft": 89 },
    { "domain": "admin.entropy.io", "daysLeft": 52 },
    { "domain": "*.staging.entropy.io", "daysLeft": 120 }
  ],
  "series": [
    { "key": "daysLeft", "color": "#22d3ee" }
  ]
}
\`\`\`

---

## 2. Certificates Expiring Within 60 Days

| Domain | Issuer | Expires | Days Left | Auto-Renew |
|--------|--------|---------|-----------|------------|
| api.entropy.io | DigiCert | Mar 05, 2024 | ⚠️ 45 | ✅ Yes |
| admin.entropy.io | DigiCert | Mar 12, 2024 | ⚠️ 52 | ✅ Yes |
| webhooks.entropy.io | Let's Encrypt | Mar 18, 2024 | ⚠️ 58 | ✅ Yes |

### Renewal Schedule

\`\`\`mermaid
gantt
    title Certificate Renewal Schedule
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Critical
    api.entropy.io         :crit, 2024-02-19, 14d
    admin.entropy.io       :crit, 2024-02-26, 14d

    section Standard
    webhooks.entropy.io    :active, 2024-03-04, 14d
    app.entropy.io         :2024-03-22, 14d
\`\`\`

---

## 3. Certificate Inventory

### By Issuer

\`\`\`json
{
  "type": "pie",
  "data": [
    { "name": "DigiCert", "value": 24 },
    { "name": "Let's Encrypt", "value": 12 },
    { "name": "AWS ACM", "value": 6 }
  ]
}
\`\`\`

### By Type

| Type | Count | Use Case |
|------|-------|----------|
| Wildcard (*.entropy.io) | 4 | Subdomains |
| Single Domain | 32 | Production APIs |
| Multi-Domain (SAN) | 6 | Internal services |

---

## 4. Certificate Details

### Production Certificates

| Domain | Serial | Algorithm | Key Size | Valid From |
|--------|--------|-----------|----------|------------|
| api.entropy.io | 0x7A3F... | SHA-256/RSA | 2048-bit | Jan 19, 2023 |
| app.entropy.io | 0x8B4E... | SHA-256/RSA | 2048-bit | Mar 22, 2023 |
| cdn.entropy.io | 0x9C5D... | SHA-256/ECDSA | P-256 | Apr 10, 2023 |
| admin.entropy.io | 0xAD6C... | SHA-256/RSA | 2048-bit | Jan 26, 2023 |

### Certificate Chain Validation

\`\`\`
✅ api.entropy.io
   └── DigiCert TLS RSA SHA256 2020 CA1
       └── DigiCert Global Root CA

✅ cdn.entropy.io
   └── DigiCert TLS Hybrid ECC SHA384 2020 CA1
       └── DigiCert Global Root CA

✅ webhooks.entropy.io
   └── R3 (Let's Encrypt)
       └── ISRG Root X1
\`\`\`

---

## 5. Security Configuration

### Protocol Support

| Endpoint | TLS 1.3 | TLS 1.2 | TLS 1.1 | TLS 1.0 |
|----------|---------|---------|---------|---------|
| api.entropy.io | ✅ | ✅ | ❌ | ❌ |
| app.entropy.io | ✅ | ✅ | ❌ | ❌ |
| cdn.entropy.io | ✅ | ✅ | ❌ | ❌ |
| legacy.entropy.io | ✅ | ✅ | ⚠️ | ❌ |

> ⚠️ **Note**: \`legacy.entropy.io\` still supports TLS 1.1 for backward compatibility. Scheduled for deprecation Q2 2024.

### HSTS Configuration

| Domain | Max-Age | Include Subdomains | Preload |
|--------|---------|-------------------|---------|
| entropy.io | 31536000 | ✅ | ✅ |
| api.entropy.io | 31536000 | ✅ | ✅ |
| app.entropy.io | 31536000 | ✅ | ✅ |

---

## 6. Automated Renewal Status

| Service | Certificates | Last Run | Status |
|---------|--------------|----------|--------|
| Cert-Manager (K8s) | 28 | 2h ago | ✅ Healthy |
| AWS ACM | 6 | Auto | ✅ Managed |
| Let's Encrypt (Certbot) | 8 | 12h ago | ✅ Healthy |

---

## 7. Recommendations

1. **Immediate**: No action required - all certificates valid
2. **Monitor**: api.entropy.io renewal in 45 days (auto-renew configured)
3. **Plan**: Deprecate TLS 1.1 on legacy.entropy.io by Q2 2024

---

*Report generated by Security Sentinel v3.2.1*
*Scan completed: ${new Date().toISOString()} | Endpoints scanned: 42*`,
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
    content: `# Streaming Data Health

## Incident Summary

**Incident ID**: INC-2024-0118-KAFKA
**Severity**: P2 (High)
**Duration**: 2h 34m
**Status**: ✅ Resolved

The \`billing-worker\` consumer group experienced significant lag accumulation during peak billing cycle processing, causing delayed invoice generation.

| Metric | Normal | During Incident | Current |
|--------|--------|-----------------|---------|
| Consumer Lag | < 1,000 | 847,293 | 234 |
| Processing Rate | 12k/sec | 3.2k/sec | 14k/sec |
| End-to-End Latency | < 500ms | 45 sec | 380ms |

---

## 1. Lag Timeline

\`\`\`json
{
  "type": "area",
  "xKey": "time",
  "data": [
    { "time": "08:00", "lag": 450 },
    { "time": "09:00", "lag": 12340 },
    { "time": "10:00", "lag": 156789 },
    { "time": "11:00", "lag": 534210 },
    { "time": "12:00", "lag": 847293 },
    { "time": "13:00", "lag": 623451 },
    { "time": "14:00", "lag": 234567 },
    { "time": "15:00", "lag": 45678 },
    { "time": "16:00", "lag": 2341 },
    { "time": "17:00", "lag": 234 }
  ],
  "series": [
    { "key": "lag", "color": "#ef4444" }
  ]
}
\`\`\`

---

## 2. Root Cause Analysis

\`\`\`mermaid
flowchart TD
    A[Lag Spike Detected] --> B{Consumer Health?}
    B -->|Healthy| C[Check Throughput]
    C --> D{Partition Imbalance?}
    D -->|Yes| E[3 partitions handling 70% load]
    E --> F[Hot Partition Problem]
    F --> G[Increase Partition Count]
    G --> H[Rebalance Consumers]
    H --> I[✅ Lag Resolved]
\`\`\`

### Investigation Timeline

| Time | Action | Finding |
|------|--------|---------|
| 09:15 | Alert triggered | Lag > 10,000 threshold |
| 09:20 | Consumer pod check | All 8 pods healthy |
| 09:35 | Partition analysis | Skewed distribution detected |
| 09:50 | Producer metrics | Batch size spike (3x normal) |
| 10:15 | Root cause confirmed | Partition key hotspot |
| 11:00 | Remediation started | Partition increase to 128 |
| 14:30 | Lag draining | Caught up to real-time |

---

## 3. Partition Distribution

### Before Fix (64 partitions)

\`\`\`json
{
  "type": "bar",
  "xKey": "partition",
  "data": [
    { "partition": "P0-15", "messages": 45 },
    { "partition": "P16-31", "messages": 234 },
    { "partition": "P32-47", "messages": 78 },
    { "partition": "P48-63", "messages": 643 }
  ],
  "series": [
    { "key": "messages", "color": "#f472b6" }
  ]
}
\`\`\`

> ⚠️ **Problem**: Partitions 48-63 received 64% of total traffic due to \`customer_id\` hash collision

### After Fix (128 partitions)

\`\`\`json
{
  "type": "bar",
  "xKey": "partition",
  "data": [
    { "partition": "P0-31", "messages": 248 },
    { "partition": "P32-63", "messages": 256 },
    { "partition": "P64-95", "messages": 251 },
    { "partition": "P96-127", "messages": 245 }
  ],
  "series": [
    { "key": "messages", "color": "#22d3ee" }
  ]
}
\`\`\`

---

## 4. Consumer Group Details

| Consumer | Assigned Partitions | Lag (Peak) | Lag (Current) |
|----------|---------------------|------------|---------------|
| billing-worker-0 | P0-15 | 12,345 | 28 |
| billing-worker-1 | P16-31 | 45,678 | 31 |
| billing-worker-2 | P32-47 | 23,456 | 29 |
| billing-worker-3 | P48-63 | **312,456** | 34 |
| billing-worker-4 | P64-79 | 189,234 | 27 |
| billing-worker-5 | P80-95 | 156,789 | 32 |
| billing-worker-6 | P96-111 | 67,890 | 30 |
| billing-worker-7 | P112-127 | 39,445 | 23 |

---

## 5. Remediation Steps

### Immediate Actions
- [x] Increase partition count: 64 → 128
- [x] Scale consumers: 8 → 12 pods
- [x] Implement consumer lag alerting at 5,000 threshold
- [x] Add partition distribution monitoring

### Configuration Changes

\`\`\`yaml
# Before
topic:
  name: billing-events
  partitions: 64
  replication-factor: 3

consumer:
  group-id: billing-worker
  max-poll-records: 500

# After
topic:
  name: billing-events
  partitions: 128  # Doubled
  replication-factor: 3

consumer:
  group-id: billing-worker
  max-poll-records: 1000  # Increased batch size
  max-poll-interval-ms: 300000
\`\`\`

---

## 6. Performance Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Max Throughput | 8k msg/sec | 18k msg/sec | +125% |
| Avg Latency | 1.2 sec | 380ms | -68% |
| P99 Latency | 12 sec | 890ms | -93% |
| Partition Balance | 64/36 | 52/48 | Near optimal |

---

## 7. Monitoring Enhancements

New alerts configured:

| Alert | Threshold | Notification |
|-------|-----------|--------------|
| Consumer lag warning | > 5,000 | Slack #ops |
| Consumer lag critical | > 50,000 | PagerDuty |
| Partition imbalance | > 30% skew | Slack #kafka |
| Consumer rebalance | Any | Slack #kafka |

---

## 8. Prevention Recommendations

1. **Short-term**: Implement partition key randomization for high-volume customers
2. **Medium-term**: Deploy Kafka Streams for stateful processing with automatic scaling
3. **Long-term**: Evaluate Apache Pulsar for better partition management

---

*Report generated by Stream Inspector v2.3.0*
*Cluster: kafka-prod-us-east-1 | Topics analyzed: 1 | Messages processed: 2.4M*`,
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
