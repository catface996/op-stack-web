
export enum AgentStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  WORKING = 'WORKING',
  COMPLETED = 'COMPLETED',
  WAITING = 'WAITING',
  ERROR = 'ERROR'
}

export enum AgentRole {
  GLOBAL_SUPERVISOR = 'Global Supervisor',
  TEAM_SUPERVISOR = 'Team Supervisor',
  WORKER = 'Worker',
  SCOUTER = 'Scouter'
}

export interface AgentConfig {
  model: string;
  temperature: number;
  systemInstruction: string;
  defaultContext?: string;
}

export interface AgentFindings {
  warnings: number;
  critical: number;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  specialty?: string;
  status: AgentStatus;
  currentTask?: string;
  findings: AgentFindings;
  config?: AgentConfig;
}

export interface Team {
  id: string;
  resourceId: string;
  name: string;
  supervisor: Agent;
  members: Agent[];
}

export interface LogMessage {
  id: string;
  timestamp: number;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId?: string;
  content: string;
  type: 'instruction' | 'report' | 'thought' | 'system' | 'discovery';
  isStreaming?: boolean;
}

export type TopologyLayer =
  | 'scenario'       // Business Scenario Layer
  | 'flow'           // Business Flow Layer
  | 'application'    // Business Application Layer
  | 'middleware'     // Middleware Layer
  | 'infrastructure'; // Infrastructure Layer

export interface TopologyNode {
  id: string;
  label: string;
  type: 'Database' | 'Service' | 'Gateway' | 'Cache' | 'Infrastructure' | string;
  layer?: TopologyLayer;
  x?: number;
  y?: number;
  properties?: Record<string, string>;
  isShadow?: boolean;
  /** Whether this node is a subgraph container */
  isSubgraph?: boolean;
  /** Node status (from API) */
  status?: string;
}

export type LinkType = 'call' | 'deployment' | 'dependency' | 'inferred';

export interface TopologyLink {
  source: string;
  target: string;
  type?: LinkType;
  confidence?: number;
  metadata?: any;
  relationshipId?: number;
}

export interface Topology {
  nodes: TopologyNode[];
  links: TopologyLink[];
}

export interface DiscoverySource {
  id: string;
  name: string;
  type: 'K8s' | 'Cloud' | 'Prometheus' | 'Trace';
  endpoint: string;
  status: 'Connected' | 'Error' | 'Scanning';
  lastScan?: number;
  agentId?: string;
}

export interface DiscoveredDelta {
  nodes: TopologyNode[];
  links: TopologyLink[];
  reasoning: string;
}

export interface TopologyGroup {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
  createdAt: string;
  tags?: string[];
  nodeIds: string[];
  templateIds?: string[]; // 新增：绑定的模板 ID 列表
}

export interface DiagnosisSession {
  id: string;
  query: string;
  timestamp: number;
  status: 'Running' | 'Completed' | 'Failed';
  findings: { warnings: number; critical: number };
  scope: string;
  scopeId?: string;
  relatedNodeIds?: string[];
}

export interface ChatAttachment {
  type: 'Resource' | 'Topology';
  id: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: ChatAttachment[];
  isStreaming?: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: 'System' | 'User' | 'Analysis' | 'Reporting';
  tags: string[];
  updatedAt: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Incident' | 'Performance' | 'Security' | 'Audit';
  content: string; 
  tags: string[];
  updatedAt: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  type: 'Text' | 'Multimodal' | 'Audio';
  status: 'Active' | 'Deprecated';
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  type: 'Function' | 'Integration' | 'Retrieval';
  createdAt: number;
}

export interface Report {
  id: string;
  title: string;
  type: 'Diagnosis' | 'Audit' | 'Performance' | 'Security';
  status: 'Draft' | 'Final' | 'Archived';
  createdAt: number;
  author: string;
  summary: string;
  content: string;
  tags: string[];
  topologyId?: string; // 可选：关联的拓扑
}

export interface TraceStep {
  id: string;
  timestamp: number;
  type: 'thought' | 'action' | 'observation';
  content: string;
}

export interface AgentExecutionRecord {
  id: string;
  agentId: string;
  sessionId: string;
  teamName: string;
  resourceLabel: string;
  startTime: number;
  duration: number;
  status: 'Success' | 'Warning' | 'Error';
  summary: string;
  steps: TraceStep[];
}
