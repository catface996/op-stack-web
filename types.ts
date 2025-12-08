
export enum AgentStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  WORKING = 'WORKING',
  COMPLETED = 'COMPLETED',
  WAITING = 'WAITING', // Waiting for sub-agents
  ERROR = 'ERROR'
}

export enum AgentRole {
  GLOBAL_SUPERVISOR = 'Global Supervisor',
  TEAM_SUPERVISOR = 'Team Supervisor',
  WORKER = 'Worker'
}

export interface AgentConfig {
  model: string;
  temperature: number;
  systemInstruction: string;
  defaultContext?: string; // "User Prompt" / Standing Order
}

export interface AgentFindings {
  warnings: number;
  critical: number;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  specialty?: string; // e.g., "Performance Analyst", "Security"
  status: AgentStatus;
  currentTask?: string;
  findings: AgentFindings;
  config?: AgentConfig; // Configuration for Supervisors/Agents
}

export interface Team {
  id: string;
  resourceId: string; // Links to Topology Node
  name: string;
  supervisor: Agent;
  members: Agent[];
}

export interface LogMessage {
  id: string;
  timestamp: number;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId?: string; // If undefined, it's a broadcast or internal thought
  content: string;
  type: 'instruction' | 'report' | 'thought' | 'system';
  isStreaming?: boolean;
}

// Topology Definitions
export interface TopologyNode {
  id: string;
  label: string;
  type: 'Database' | 'Service' | 'Gateway' | 'Cache' | 'Infrastructure';
  x?: number;
  y?: number;
  properties?: Record<string, string>;
}

export type LinkType = 'call' | 'deployment' | 'dependency';

export interface TopologyLink {
  source: string;
  target: string;
  type?: LinkType; // Default to 'call' if undefined
}

export interface Topology {
  nodes: TopologyNode[];
  links: TopologyLink[];
}

export interface TopologyGroup {
  id: string;
  name: string;
  description: string;
  nodeCount: number; // Keep for display cache, or calculate dynamic
  createdAt: string;
  tags?: string[];
  nodeIds: string[]; // List of Resource IDs belonging to this topology group
}

export interface DiagnosisSession {
  id: string;
  query: string;
  timestamp: number;
  status: 'Running' | 'Completed' | 'Failed';
  findings: { warnings: number; critical: number };
  scope: string; // 'Global' or Topology Name
  scopeId?: string; // ID for linking back to specific topology
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

export interface AIModel {
  id: string;
  name: string; // e.g., "gemini-1.5-pro"
  provider: string; // "Google"
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
