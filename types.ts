
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

// ============ Tools API Types (Feature: 010-tools-management) ============

/**
 * Tool status enumeration
 */
export type ToolStatus = 'draft' | 'active' | 'deprecated' | 'disabled';

/**
 * Tool category response (flat structure - no nesting)
 */
export interface ToolCategoryDTO {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null; // Legacy field - ignored in flat structure
  created_at: string;
  updated_at: string;
}

// ============ Tool Category API Types (Feature: 010-tool-category-management) ============

/**
 * Tool category list request
 * Constitution: API Pagination Request Format
 */
export interface ToolCategoryListRequest {
  page?: number;
  size?: number;
  keyword?: string;  // Search by category name
}

/**
 * Paginated response data structure
 * Constitution: API Pagination Response Format
 */
export interface PaginatedData<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Standard API response wrapper
 * Constitution: API Pagination Response Format
 */
export interface ApiResponseWrapper<T> {
  code: number;
  message: string;
  success: boolean;
  data: T;
}

/**
 * Tool category list response
 * Constitution: API Pagination Response Format
 */
export type ToolCategoryListResponse = ApiResponseWrapper<PaginatedData<ToolCategoryDTO>>;

/**
 * Tool category create request
 */
export interface ToolCategoryCreateRequest {
  name: string;
  description?: string;
}

/**
 * Tool category update request
 */
export interface ToolCategoryUpdateRequest {
  category_id: string;
  name?: string;
  description?: string;
}

/**
 * Tool category get/delete request
 */
export interface ToolCategoryIdRequest {
  category_id: string;
}

/**
 * Tool response from API
 */
export interface ToolDTO {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category_id: string | null;
  tags: string[];
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  script_content: string | null;
  executor_type: string;
  executor_config: Record<string, any>;
  status: ToolStatus;
  version: number;
  created_at: string;
  updated_at: string;
  category: ToolCategoryDTO | null;
}

/**
 * Tool list request
 * Constitution: API Pagination Request Format
 */
export interface ToolListRequest {
  page?: number;
  size?: number;
  status?: ToolStatus;
  category_id?: string;
  search?: string;
}

/**
 * Tool list response
 * Constitution: API Pagination Response Format
 */
export type ToolListResponse = ApiResponseWrapper<PaginatedData<ToolDTO>>;

/**
 * Tool create request
 */
export interface ToolCreateRequest {
  name: string;
  display_name: string;
  description: string;
  category_id?: string | null;
  tags?: string[];
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  script_content?: string | null;
  executor_type?: string;
  executor_config?: Record<string, any>;
}

/**
 * Tool update request
 */
export interface ToolUpdateRequest {
  tool_id: string;
  display_name?: string;
  description?: string;
  status?: ToolStatus;
  category_id?: string;
  tags?: string[];
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  script_content?: string;
  executor_config?: Record<string, any>;
}

/**
 * Tool get/delete request
 */
export interface ToolIdRequest {
  tool_id: string;
}

export interface ToolFormData {
  id: string;
  name: string;
  description: string;
  type: 'Function' | 'Integration' | 'Retrieval';
  createdAt: number;
}

export interface ToolListState {
  tools: ToolDTO[];
  filteredTools: ToolDTO[];
  searchTerm: string;
  currentPage: number;
  viewMode: 'list' | 'card';
  isLoading: boolean;
  error: string | null;
  isModalOpen: boolean;
  editingTool: ToolDTO | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string | null;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ToolUsageInfo {
  inUse: boolean;
  usageCount: number;
  lastUsed: number | null;
  dependencies: string[];
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
