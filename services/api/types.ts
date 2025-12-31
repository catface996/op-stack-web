/**
 * API Types for Resource Management
 *
 * 基于后端 OpenAPI 文档定义的 TypeScript 类型
 * Feature: 001-resource-api-integration
 */

// ============================================================================
// Common Types
// ============================================================================

/**
 * 统一 API 响应包装器
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

/**
 * 分页结果
 */
export interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ============================================================================
// Resource Types
// ============================================================================

/**
 * 资源状态枚举
 */
export type ResourceStatus = 'RUNNING' | 'STOPPED' | 'MAINTENANCE' | 'OFFLINE';

/**
 * Node Layer - Architecture layer for resource nodes
 * Feature: node-layer-field
 */
export type NodeLayer =
  | 'BUSINESS_SCENARIO'
  | 'BUSINESS_FLOW'
  | 'BUSINESS_APPLICATION'
  | 'MIDDLEWARE'
  | 'INFRASTRUCTURE';

/**
 * Node Layer configuration for UI display
 */
export const NODE_LAYER_CONFIG: Record<NodeLayer, {
  label: string;
  labelEn: string;
  color: string;
  order: number;
}> = {
  BUSINESS_SCENARIO: {
    label: 'Business Scenario',
    labelEn: 'Business Scenario',
    color: '#722ed1',  // Purple
    order: 1,
  },
  BUSINESS_FLOW: {
    label: 'Business Flow',
    labelEn: 'Business Flow',
    color: '#1890ff',  // Blue
    order: 2,
  },
  BUSINESS_APPLICATION: {
    label: 'Business Application',
    labelEn: 'Business Application',
    color: '#52c41a',  // Green
    order: 3,
  },
  MIDDLEWARE: {
    label: 'Middleware',
    labelEn: 'Middleware',
    color: '#faad14',  // Orange
    order: 4,
  },
  INFRASTRUCTURE: {
    label: 'Infrastructure',
    labelEn: 'Infrastructure',
    color: '#8c8c8c',  // Gray
    order: 5,
  },
};

/**
 * 资源 DTO
 */
export interface ResourceDTO {
  id: number;
  name: string;
  description: string | null;
  resourceTypeId: number;
  resourceTypeName: string;
  resourceTypeCode: string;
  status: ResourceStatus;
  statusDisplay: string;
  layer: NodeLayer | null;        // Architecture layer
  layerDisplay: string | null;    // Architecture layer display name
  attributes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

/**
 * 资源类型 DTO
 */
export interface ResourceTypeDTO {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  systemPreset: boolean;
}

/**
 * 审计操作类型
 */
export type AuditOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';

/**
 * 资源审计日志 DTO
 */
export interface ResourceAuditLogDTO {
  id: number;
  resourceId: number;
  operation: AuditOperation;
  operationDisplay: string;
  oldValue: string | null;
  newValue: string | null;
  operatorId: number;
  operatorName: string;
  operatedAt: string;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * 查询资源列表请求
 */
export interface ListResourcesRequest {
  resourceTypeId?: number;
  status?: ResourceStatus;
  keyword?: string;
  page?: number;
  size?: number;
}

/**
 * 创建资源请求
 */
export interface CreateResourceRequest {
  name: string;
  description?: string;
  resourceTypeId: number;
  attributes?: string;
}

/**
 * 获取单个资源请求
 */
export interface GetResourceRequest {
  id: number;
}

/**
 * 更新资源请求
 */
export interface UpdateResourceRequest {
  id: number;
  name?: string;
  description?: string;
  attributes?: string;
  version: number;
}

/**
 * 更新资源状态请求
 */
export interface UpdateResourceStatusRequest {
  id: number;
  status: ResourceStatus;
  version: number;
}

/**
 * 删除资源请求
 */
export interface DeleteResourceRequest {
  id: number;
  confirmName: string;
}

/**
 * 查询审计日志请求
 */
export interface QueryAuditLogsRequest {
  resourceId: number;
  page?: number;
  size?: number;
}

/**
 * 查询资源类型请求
 */
export interface QueryResourceTypesRequest {
  page?: number;
  size?: number;
}

// ============================================================================
// Response Types (Aliases for clarity)
// ============================================================================

export type ListResourcesResponse = ApiResponse<PageResult<ResourceDTO>>;
export type CreateResourceResponse = ResourceDTO; // 201 直接返回 ResourceDTO
export type GetResourceResponse = ApiResponse<ResourceDTO>;
export type UpdateResourceResponse = ApiResponse<ResourceDTO>;
export type UpdateResourceStatusResponse = ApiResponse<ResourceDTO>;
export type DeleteResourceResponse = ApiResponse<void>;
export type QueryAuditLogsResponse = ApiResponse<PageResult<ResourceAuditLogDTO>>;
export type QueryResourceTypesResponse = ApiResponse<ResourceTypeDTO[]>;

// ============================================================================
// Error Types
// ============================================================================

/**
 * HTTP 错误码常量
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  LOCKED: 423,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error message mapping
 */
export const ERROR_MESSAGES: Record<number, string> = {
  [HTTP_STATUS.BAD_REQUEST]: 'Invalid request parameters',
  [HTTP_STATUS.UNAUTHORIZED]: 'Session expired, please login again',
  [HTTP_STATUS.FORBIDDEN]: 'You do not have permission to perform this action',
  [HTTP_STATUS.NOT_FOUND]: 'The requested resource was not found',
  [HTTP_STATUS.CONFLICT]: 'Operation conflict, please refresh and try again',
  [HTTP_STATUS.LOCKED]: 'Cannot modify agent while it is working',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Service temporarily unavailable, please try again later',
};

// ============================================================================
// Topology Types (Feature: 002-topology-api)
// ============================================================================

/**
 * Relationship type enum
 */
export type RelationshipType = 'DEPENDENCY' | 'DATA_FLOW' | 'API_CALL' | 'DEPLOYMENT' | 'CALL';

/**
 * Relationship direction enum
 */
export type RelationshipDirection = 'UNIDIRECTIONAL' | 'BIDIRECTIONAL';

/**
 * Relationship status enum
 */
export type RelationshipStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Topology layer enum (matches backend NodeLayer)
 */
export type TopologyLayer = 'BUSINESS_SCENARIO' | 'BUSINESS_FLOW' | 'BUSINESS_APPLICATION' | 'MIDDLEWARE' | 'INFRASTRUCTURE';

/**
 * Topology node - represents a resource in the graph
 */
export interface TopologyNode {
  id: number;
  name: string;
  typeCode: string;
  typeName?: string;
  status: ResourceStatus;
  isSubgraph?: boolean;  // Legacy field name
  subgraph?: boolean;    // Backend uses this field name
  layer?: TopologyLayer;
  attributes?: Record<string, unknown>;
  expanded?: boolean;
  parentSubgraphId?: number;
}

/**
 * Edge strength enum (from topology query)
 */
export type EdgeStrength = 'STRONG' | 'MEDIUM' | 'WEAK' | number;

/**
 * Edge status enum (from topology query)
 */
export type EdgeStatus = 'NORMAL' | 'DEGRADED' | 'ERROR' | RelationshipStatus;

/**
 * Topology edge - represents a relationship between resources
 */
export interface TopologyEdge {
  id?: number;
  sourceId: number;
  targetId: number;
  relationshipType: RelationshipType | 'CALL';  // Backend may return 'CALL' directly
  direction: RelationshipDirection;
  strength: EdgeStrength;
  status: EdgeStatus;
}

/**
 * Topology boundary - visual boundary for nested topologies
 */
export interface TopologyBoundary {
  subgraphId: number;  // Backend field name (kept for API compatibility)
  memberIds: number[];
}

/** @deprecated Use TopologyBoundary instead */
export type SubgraphBoundary = TopologyBoundary;

/**
 * Topology member - a resource's membership in a topology
 */
export interface TopologyMember {
  id: number;
  subgraphId: number;  // Backend field name (kept for API compatibility)
  memberId: number;
  memberName: string;
  memberTypeCode: string;
  memberStatus: ResourceStatus;
  addedAt: string;
  addedBy: number;
}

/** @deprecated Use TopologyMember instead */
export type SubgraphMember = TopologyMember;

/**
 * Full relationship entity with metadata
 */
export interface Relationship {
  id: number;
  sourceResourceId: number;
  targetResourceId: number;
  type: RelationshipType;
  direction: RelationshipDirection;
  strength: number;
  status: RelationshipStatus;
  description?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

/**
 * Ancestor node for breadcrumb navigation
 */
export interface AncestorNode {
  id: number;
  name: string;
  depth: number;
}

// ============================================================================
// Topology Request Types
// ============================================================================

/**
 * Query topology graph data request
 */
export interface TopologyQueryRequest {
  resourceId: number;  // Backend uses resourceId, not subgraphId
  depth?: number;
  includeRelationships?: boolean;
}

/**
 * Query topology graph data response
 */
export interface TopologyQueryResponse {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  boundaries: TopologyBoundary[];
  subgraphBoundaries?: TopologyBoundary[];  // Backend returns this field name
}

/**
 * Add members to subgraph request
 */
export interface MembersAddRequest {
  resourceId: number;  // Backend uses resourceId, not subgraphId
  memberIds: number[];
}

/**
 * Add members response
 */
export interface MembersAddResponse {
  addedCount: number;
  members: TopologyMember[];
}

/**
 * Remove members from subgraph request
 */
export interface MembersRemoveRequest {
  resourceId: number;  // Backend uses resourceId, not subgraphId
  memberIds: number[];
}

/**
 * Query members request
 */
export interface MembersQueryRequest {
  resourceId: number;  // Backend uses resourceId, not subgraphId
  page?: number;
  size?: number;
}

/**
 * Query ancestors request
 */
export interface AncestorsQueryRequest {
  resourceId: number;
}

/**
 * Relationship strength enum
 */
export type RelationshipStrength = 'STRONG' | 'MEDIUM' | 'WEAK';

/**
 * Create relationship request
 */
export interface RelationshipCreateRequest {
  sourceResourceId: number;
  targetResourceId: number;
  relationshipType: RelationshipType;  // Backend field name is relationshipType
  direction: RelationshipDirection;
  strength: RelationshipStrength;  // Backend expects string enum
  topologyId: number;
  description?: string;
}

/**
 * Update relationship request
 */
export interface RelationshipUpdateRequest {
  id: number;
  type?: RelationshipType;
  direction?: RelationshipDirection;
  strength?: number;
  description?: string;
  status?: RelationshipStatus;
  version: number;
}

/**
 * Delete relationship request
 */
export interface RelationshipDeleteRequest {
  id: number;
}

/**
 * Query resource relationships request
 */
export interface ResourceRelationshipsQueryRequest {
  resourceId: number;
  type?: RelationshipType;
}

/**
 * Cycle detection request
 */
export interface CycleDetectionRequest {
  resourceId: number;  // Backend uses resourceId, not subgraphId
  candidateMemberIds: number[];
}

/**
 * Cycle detection response
 */
export interface CycleDetectionResponse {
  hasCycle: boolean;
  cyclePath?: number[];
  cycleDescription?: string;
}

// ============================================================================
// Topology Management Types (Feature: 003-topologies-management)
// ============================================================================

/**
 * Topology attributes stored in the attributes JSON field
 */
export interface TopologyAttributes {
  isSubgraph: boolean;
  tags: string[];
  templateIds: string[];
}

/**
 * Topology item for list display
 * Combines API data with computed fields
 */
export interface TopologyListItem {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  tags: string[];
  templateIds: string[];
  status: ResourceStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
  resourceTypeId: number;
  isActive?: boolean;  // UI state: currently selected
}

/**
 * Form data for creating/editing a Topology
 */
export interface TopologyFormData {
  name: string;           // Required
  description: string;    // Optional
  tags: string[];         // Optional array
  templateIds: string[];  // Optional array of template IDs
}

/**
 * Parse topology attributes from JSON string
 */
export function parseTopologyAttributes(attributesJson: string | null): TopologyAttributes {
  if (!attributesJson) {
    return { isSubgraph: false, tags: [], templateIds: [] };
  }
  try {
    const parsed = JSON.parse(attributesJson);
    return {
      isSubgraph: parsed.isSubgraph === true,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      templateIds: Array.isArray(parsed.templateIds) ? parsed.templateIds : [],
    };
  } catch {
    return { isSubgraph: false, tags: [], templateIds: [] };
  }
}

/**
 * Serialize topology attributes to JSON string
 */
export function serializeTopologyAttributes(attrs: TopologyAttributes): string {
  return JSON.stringify(attrs);
}

// ============================================================================
// Topology CRUD Types (Feature: 004-topology-api-separation)
// ============================================================================

/**
 * Global Supervisor info embedded in TopologyDTO
 */
export interface GlobalSupervisorInfo {
  agentId: number;
  agentName: string;
  specialty: string | null;
  model: string | null;
}

/**
 * TopologyDTO - Dedicated topology entity from /api/v1/topologies/* endpoints
 * This is separate from ResourceDTO as topologies are now first-class entities
 */
export interface TopologyDTO {
  id: number;
  name: string;
  description: string | null;
  status: ResourceStatus;
  statusDisplay: string;
  coordinatorAgentId: number | null;  // NEW: Coordinator Agent ID (Feature: 005-api-reintegration)
  globalSupervisors: GlobalSupervisorInfo[];  // Bound Global Supervisor agents
  attributes: string | null;
  memberCount: number;  // Direct count from backend, no parsing needed
  version: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Query topologies list request
 * POST /api/v1/topologies/query
 */
export interface QueryTopologiesRequest {
  operatorId: number;
  name?: string;      // Fuzzy search by name
  status?: ResourceStatus;
  nodeId?: number;    // Filter topologies containing this node
  page?: number;      // Default 1
  size?: number;      // Default 10, max 100
}

/**
 * Create topology request
 * POST /api/v1/topologies/create
 */
export interface CreateTopologyApiRequest {
  operatorId: number;
  name: string;        // Required, max 100 chars
  description?: string; // Optional, max 500 chars
}

/**
 * Get topology request
 * POST /api/v1/topologies/get
 * Note: Only id is required for get request
 */
export interface GetTopologyRequest {
  id: number;
}

/**
 * Update topology request
 * POST /api/v1/topologies/update
 */
export interface UpdateTopologyApiRequest {
  operatorId: number;
  id: number;
  name?: string;               // Optional, null means no change
  description?: string;        // Optional, null means no change
  coordinatorAgentId?: number; // Optional, NEW field (Feature: 005-api-reintegration)
  version: number;             // Required for optimistic locking
}

/**
 * Delete topology request
 * POST /api/v1/topologies/delete
 */
export interface DeleteTopologyApiRequest {
  operatorId: number;
  id: number;
}

// ============================================================================
// Topology CRUD Response Types (Feature: 004-topology-api-separation)
// ============================================================================

export type QueryTopologiesResponse = ApiResponse<PageResult<TopologyDTO>>;
export type CreateTopologyApiResponse = TopologyDTO; // 201 returns TopologyDTO directly
export type GetTopologyResponse = ApiResponse<TopologyDTO>;
export type UpdateTopologyApiResponse = ApiResponse<TopologyDTO>;
export type DeleteTopologyApiResponse = ApiResponse<void>;

// ============================================================================
// Unbound Global Supervisor Types (Feature: Topology Supervisor Binding)
// ============================================================================

/**
 * Unbound Global Supervisor Agent DTO
 * Returned by the unbound agents query endpoint
 */
export interface UnboundAgentDTO {
  /** Agent ID */
  id: number;
  /** Agent name */
  name: string;
  /** Agent specialty/expertise */
  specialty: string | null;
  /** AI model identifier */
  model: string | null;
}

/**
 * Query unbound Global Supervisor agents request
 * POST /api/service/v1/topologies/agents/unbound
 */
export interface QueryUnboundAgentsRequest {
  /** Topology ID (required) */
  topologyId: number;
  /** Search keyword (matches name and specialty) */
  keyword?: string;
  /** Page number (1-based, default 1) */
  page?: number;
  /** Page size (default 20, max 100) */
  size?: number;
}

// ============================================================================
// Node Types (Feature: 005-api-reintegration)
// ============================================================================

/**
 * Default operator ID for API requests (placeholder until authentication)
 */
export const DEFAULT_OPERATOR_ID = 1;

/**
 * NodeDTO - Resource node entity from /api/v1/nodes/* endpoints
 * This is the new dedicated node entity separate from ResourceDTO
 */
export interface NodeDTO {
  id: number;
  name: string;
  description: string | null;
  nodeTypeId: number;
  nodeTypeName: string;
  nodeTypeCode: string;
  status: ResourceStatus;
  statusDisplay: string;
  layer: NodeLayer | null;        // Architecture layer
  layerDisplay: string | null;    // Architecture layer display name
  agentTeamId: number | null;
  attributes: string | null;
  version: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * NodeTypeDTO - Node type definition from /api/v1/nodes/types/query
 */
export interface NodeTypeDTO {
  id: number;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Node Request Types (Feature: 005-api-reintegration)
// ============================================================================

/**
 * Query nodes list request
 * POST /api/v1/nodes/query
 */
export interface QueryNodesRequest {
  nodeTypeId?: number;
  status?: ResourceStatus;
  layer?: NodeLayer;  // Filter by architecture layer
  keyword?: string;
  topologyId?: number;
  page?: number;
  size?: number;
}

/**
 * Create node request
 * POST /api/v1/nodes/create
 */
export interface CreateNodeRequest {
  operatorId: number;
  name: string;
  description?: string;
  nodeTypeId: number;
  layer?: NodeLayer;  // Architecture layer
  agentTeamId?: number;
  attributes?: string;
}

/**
 * Get node request
 * POST /api/v1/nodes/get
 */
export interface GetNodeRequest {
  id: number;
}

/**
 * Update node request
 * POST /api/v1/nodes/update
 */
export interface UpdateNodeRequest {
  operatorId: number;
  id: number;
  name?: string;
  description?: string;
  layer?: NodeLayer;  // Architecture layer (null means no change)
  agentTeamId?: number;
  attributes?: string;
  version: number;
}

/**
 * Delete node request
 * POST /api/v1/nodes/delete
 */
export interface DeleteNodeRequest {
  operatorId: number;
  id: number;
}

// ============================================================================
// Node Response Types (Feature: 005-api-reintegration)
// ============================================================================

export type QueryNodesResponse = ApiResponse<PageResult<NodeDTO>>;
export type CreateNodeResponse = NodeDTO;
export type GetNodeResponse = ApiResponse<NodeDTO>;
export type UpdateNodeResponse = ApiResponse<NodeDTO>;
export type DeleteNodeResponse = ApiResponse<void>;
export type QueryNodeTypesResponse = ApiResponse<NodeTypeDTO[]>;

// ============================================================================
// Updated Topology Member Request Types (Feature: 005-api-reintegration)
// Now uses topologyId instead of resourceId
// ============================================================================

/**
 * Query topology members request (NEW endpoints)
 * POST /api/v1/topologies/members/query
 */
export interface TopologyMembersQueryRequest {
  topologyId: number;
  page?: number;
  size?: number;
}

/**
 * Add members to topology request (NEW endpoints)
 * POST /api/v1/topologies/members/add
 */
export interface TopologyMembersAddRequest {
  topologyId: number;
  nodeIds: number[];  // Backend expects nodeIds, not memberIds
}

/**
 * Remove members from topology request (NEW endpoints)
 * POST /api/v1/topologies/members/remove
 */
export interface TopologyMembersRemoveRequest {
  topologyId: number;
  nodeIds: number[];  // Backend expects nodeIds, not memberIds
}

/**
 * Query topology graph data request (NEW endpoint)
 * POST /api/v1/topologies/graph/query
 * Returns nodes, edges, and boundaries for visualization
 */
export interface TopologyGraphQueryRequest {
  topologyId: number;
  depth?: number;
  includeRelationships?: boolean;
}

// ============================================================================
// Prompt Template Types (Feature: 007-prompt-template-api)
// ============================================================================

/**
 * Prompt template entity from /api/v1/prompt-templates/* endpoints
 */
export interface PromptTemplateDTO {
  /** Template ID (int64) */
  id: number;
  /** Template name (max 200 chars) */
  name: string;
  /** Usage type ID (nullable) */
  usageId: number | null;
  /** Usage type name (joined from TemplateUsage) */
  usageName: string | null;
  /** Template description (max 1000 chars) */
  description: string | null;
  /** Current version number (int32) */
  currentVersion: number;
  /** Template content (up to 64KB) */
  content: string;
  /** Optimistic lock version */
  version: number;
  /** Creator user ID */
  createdBy: number;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * Prompt template detail with version history
 */
export interface PromptTemplateDetailDTO extends PromptTemplateDTO {
  /** Version history list (all versions) */
  versions: PromptTemplateVersionDTO[];
}

/**
 * Template version history entry
 */
export interface PromptTemplateVersionDTO {
  /** Version record ID */
  id: number;
  /** Parent template ID */
  templateId: number;
  /** Version number (starts at 1) */
  versionNumber: number;
  /** Content snapshot at this version */
  content: string;
  /** Change description (max 500 chars) */
  changeNote: string | null;
  /** Creator of this version */
  createdBy: number;
  /** Version creation timestamp */
  createdAt: string;
}

/**
 * Template usage category
 */
export interface TemplateUsageDTO {
  /** Usage ID */
  id: number;
  /** Usage code (uppercase with underscores, e.g., "FAULT_DIAGNOSIS") */
  code: string;
  /** Display name */
  name: string;
  /** Description of this usage type */
  description: string | null;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

// ============================================================================
// Prompt Template Request Types (Feature: 007-prompt-template-api)
// ============================================================================

/**
 * Query prompt templates list
 * POST /api/v1/prompt-templates/list
 */
export interface ListPromptTemplatesRequest {
  /** Filter by usage ID (optional) */
  usageId?: number;
  /** Search keyword (matches name/description) */
  keyword?: string;
  /** Page number (1-based, default 1) */
  page?: number;
  /** Page size (default 10, max 100) */
  size?: number;
}

/**
 * Get template detail with versions
 * POST /api/v1/prompt-templates/detail
 */
export interface GetTemplateDetailRequest {
  /** Template ID */
  id: number;
}

/**
 * Get specific version content
 * POST /api/v1/prompt-templates/version/detail
 */
export interface GetVersionDetailRequest {
  /** Template ID */
  templateId: number;
  /** Version number to retrieve (>= 1) */
  versionNumber: number;
}

/**
 * Create new prompt template
 * POST /api/v1/prompt-templates/create
 */
export interface CreatePromptTemplateRequest {
  /** Operator ID (injected by client in dev mode) */
  operatorId?: number;
  /** Template name (required, max 200 chars) */
  name: string;
  /** Template content (required, max 64KB) */
  content: string;
  /** Usage type ID (optional) */
  usageId?: number;
  /** Description (optional, max 1000 chars) */
  description?: string;
}

/**
 * Update prompt template
 * POST /api/v1/prompt-templates/update
 * Creates a new version automatically
 */
export interface UpdatePromptTemplateRequest {
  /** Template ID */
  id: number;
  /** Operator ID */
  operatorId?: number;
  /** New content (required) */
  content: string;
  /** Change note (optional, max 500 chars) */
  changeNote?: string;
  /** Expected optimistic lock version for conflict detection */
  expectedVersion?: number;
}

/**
 * Delete prompt template
 * POST /api/v1/prompt-templates/delete
 */
export interface DeleteTemplateRequest {
  /** Template ID */
  id: number;
  /** Operator ID */
  operatorId?: number;
}

/**
 * Rollback to previous version
 * POST /api/v1/prompt-templates/rollback
 */
export interface RollbackTemplateRequest {
  /** Template ID */
  id: number;
  /** Operator ID */
  operatorId?: number;
  /** Target version number to rollback to (>= 1) */
  targetVersion: number;
  /** Expected optimistic lock version */
  expectedVersion?: number;
}

// ============================================================================
// Template Usage Request Types (Feature: 007-prompt-template-api)
// ============================================================================

/**
 * Create template usage
 * POST /api/v1/template-usages/create
 */
export interface CreateTemplateUsageRequest {
  /** Usage code (uppercase, underscores allowed, pattern: ^[A-Z][A-Z0-9_]*$) */
  code: string;
  /** Display name (required, max 100 chars) */
  name: string;
  /** Description (optional, max 500 chars) */
  description?: string;
}

/**
 * Delete template usage
 * POST /api/v1/template-usages/delete
 */
export interface DeleteUsageRequest {
  /** Usage ID */
  id: number;
}

// ============================================================================
// Prompt Template Response Types (Feature: 007-prompt-template-api)
// ============================================================================

/** List templates response */
export type ListPromptTemplatesResponse = ApiResponse<PageResult<PromptTemplateDTO>>;

/** Create template response (201 returns DTO directly) */
export type CreatePromptTemplateResponse = PromptTemplateDTO;

/** Get template detail response */
export type GetTemplateDetailResponse = ApiResponse<PromptTemplateDetailDTO>;

/** Update template response */
export type UpdatePromptTemplateResponse = ApiResponse<PromptTemplateDTO>;

/** Delete template response */
export type DeletePromptTemplateResponse = ApiResponse<void>;

/** Rollback template response */
export type RollbackTemplateResponse = ApiResponse<PromptTemplateDTO>;

/** Get version detail response */
export type GetVersionDetailResponse = ApiResponse<PromptTemplateVersionDTO>;

/** List usages response */
export type ListTemplateUsagesResponse = ApiResponse<TemplateUsageDTO[]>;

/** Create usage response (201 returns DTO directly) */
export type CreateTemplateUsageResponse = TemplateUsageDTO;

/** Delete usage response */
export type DeleteUsageResponse = ApiResponse<void>;

// ============================================================================
// Model Types (Feature: 008-model-api-integration)
// ============================================================================

/**
 * Model entity from /api/v1/models/* endpoints
 * AI model configuration for the platform
 */
export interface ModelDTO {
  /** Model ID (auto-generated) */
  id: number;
  /** Display name */
  name: string;
  /** Technical model identifier (e.g., "gpt-4", "claude-3") */
  model_id: string;
  /** Optional description */
  description?: string;
  /** Whether model is currently enabled */
  is_active: boolean;
  /** Maximum token limit for responses */
  max_tokens?: number;
  /** Sampling temperature (0.0-2.0) */
  temperature?: number;
  /** Nucleus sampling parameter (0.0-1.0) */
  top_p?: number;
  /** Deployment region */
  region?: string;
  /** Creation timestamp */
  created_at?: string;
  /** Last update timestamp */
  updated_at?: string;
}

/**
 * Request for listing models
 * POST /api/v1/models/list
 */
export interface ModelListRequest {
  /** Page number (1-based) */
  page: number;
  /** Items per page */
  size: number;
  /** Optional filter by active status */
  is_active?: boolean;
}

/**
 * Paginated list response for models
 * Constitution: API Pagination Response Format
 * Note: apiPost extracts result.data, so this is the inner PageResult structure
 */
export type ModelListResponse = PageResult<ModelDTO>;

/**
 * Request for creating a model
 * POST /api/v1/models/create
 */
export interface ModelCreateRequest {
  /** Display name (required) */
  name: string;
  /** Technical model identifier (required) */
  model_id: string;
  /** Optional description */
  description?: string;
  /** Active status (default: true) */
  is_active?: boolean;
  /** Maximum tokens */
  max_tokens?: number;
  /** Temperature (0.0-2.0) */
  temperature?: number;
  /** Top P (0.0-1.0) */
  top_p?: number;
  /** Region */
  region?: string;
}

/**
 * Request for getting a single model
 * POST /api/v1/models/get
 */
export interface ModelGetRequest {
  id: number;
}

/**
 * Request for updating a model
 * POST /api/v1/models/update
 */
export interface ModelUpdateRequest {
  /** Model ID (required) */
  id: number;
  /** Display name */
  name?: string;
  /** Technical model identifier */
  model_id?: string;
  /** Description */
  description?: string;
  /** Active status */
  is_active?: boolean;
  /** Maximum tokens */
  max_tokens?: number;
  /** Temperature (0.0-2.0) */
  temperature?: number;
  /** Top P (0.0-1.0) */
  top_p?: number;
  /** Region */
  region?: string;
}

/**
 * Request for deleting a model
 * POST /api/v1/models/delete
 */
export interface ModelDeleteRequest {
  id: number;
}

// ============================================================================
// Model Response Types (Feature: 008-model-api-integration)
// ============================================================================

/** List models response */
export type ListModelsResponse = ApiResponse<ModelListResponse>;

/** Create model response (returns ModelDTO directly or wrapped) */
export type CreateModelResponse = ModelDTO;

/** Get model response */
export type GetModelResponse = ApiResponse<ModelDTO>;

/** Update model response */
export type UpdateModelResponse = ApiResponse<ModelDTO>;

/** Delete model response */
export type DeleteModelResponse = ApiResponse<void>;

// ============================================================================
// Report Types (Feature: 011-report-api-integration)
// ============================================================================

/**
 * Report type enumeration
 */
export type ReportType = 'Diagnosis' | 'Audit' | 'Performance' | 'Security';

/**
 * Report status enumeration
 */
export type ReportStatus = 'Draft' | 'Final' | 'Archived';

/**
 * Report DTO from API
 */
export interface ReportDTO {
  /** Report ID (int64) */
  id: number;
  /** Report title (max 200 chars) */
  title: string;
  /** Report type */
  type: ReportType;
  /** Report status */
  status: ReportStatus;
  /** Author name (max 100 chars) */
  author: string;
  /** Brief summary (max 500 chars) */
  summary?: string;
  /** Full content (Markdown format) */
  content?: string;
  /** Array of tags */
  tags?: string[];
  /** Associated topology ID (optional) */
  topologyId?: number;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
}

// ============================================================================
// Report Template Types (Feature: 011-report-api-integration)
// ============================================================================

/**
 * Report template category enumeration
 */
export type ReportTemplateCategory = 'Incident' | 'Performance' | 'Security' | 'Audit';

/**
 * Report template DTO from API
 */
export interface ReportTemplateDTO {
  /** Template ID (int64) */
  id: number;
  /** Template name (max 100 chars) */
  name: string;
  /** Template description (max 500 chars) */
  description?: string;
  /** Template category */
  category: ReportTemplateCategory;
  /** Template content with placeholders */
  content: string;
  /** Array of tags */
  tags?: string[];
  /** Optimistic lock version */
  version: number;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}

// ============================================================================
// Report Request Types (Feature: 011-report-api-integration)
// ============================================================================

/**
 * List reports request
 * POST /api/service/v1/reports/list
 */
export interface ListReportsRequest {
  /** Page number (1-based, default 1) */
  page?: number;
  /** Page size (default 10, max 100) */
  size?: number;
  /** Filter by type */
  type?: ReportType;
  /** Filter by status */
  status?: ReportStatus;
  /** Search keyword (matches title, summary, tags) */
  keyword?: string;
  /** Sort field */
  sortBy?: 'title' | 'type' | 'status' | 'created_at';
  /** Sort order (default desc) */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get report request
 * POST /api/service/v1/reports/get
 */
export interface GetReportRequest {
  /** Report ID (required) */
  id: number;
}

/**
 * Create report request
 * POST /api/service/v1/reports/create
 */
export interface CreateReportRequest {
  /** Report title (required, max 200 chars) */
  title: string;
  /** Report type (required) */
  type: ReportType;
  /** Report status (default: Final) */
  status?: ReportStatus;
  /** Author name (required, max 100 chars) */
  author: string;
  /** Brief summary (max 500 chars) */
  summary?: string;
  /** Full content (Markdown) */
  content?: string;
  /** Array of tags */
  tags?: string[];
  /** Associated topology ID */
  topologyId?: number;
}

/**
 * Delete report request
 * POST /api/service/v1/reports/delete
 */
export interface DeleteReportRequest {
  /** Report ID (required) */
  id: number;
}

// ============================================================================
// Report Response Types (Feature: 011-report-api-integration)
// ============================================================================

/** List reports response */
export type ReportListResponse = ApiResponse<PageResult<ReportDTO>>;

/** Get report detail response */
export type ReportDetailResponse = ApiResponse<ReportDTO>;

/** Create report response */
export type CreateReportResponse = ApiResponse<ReportDTO>;

/** Delete report response */
export type DeleteReportResponse = ApiResponse<void>;

// ============================================================================
// Report Template Request Types (Feature: 011-report-api-integration)
// ============================================================================

/**
 * List report templates request
 * POST /api/service/v1/report-templates/list
 */
export interface ListReportTemplatesRequest {
  /** Page number (1-based, default 1) */
  page?: number;
  /** Page size (default 10, max 100) */
  size?: number;
  /** Filter by category */
  category?: ReportTemplateCategory;
  /** Search keyword (matches name, description, tags) */
  keyword?: string;
}

/**
 * Get report template request
 * POST /api/service/v1/report-templates/get
 */
export interface GetReportTemplateRequest {
  /** Template ID (required) */
  id: number;
}

/**
 * Create report template request
 * POST /api/service/v1/report-templates/create
 */
export interface CreateReportTemplateRequest {
  /** Template name (required, max 100 chars) */
  name: string;
  /** Template description (max 500 chars) */
  description?: string;
  /** Template category (required) */
  category: ReportTemplateCategory;
  /** Template content with placeholders (required) */
  content: string;
  /** Array of tags */
  tags?: string[];
}

/**
 * Update report template request
 * POST /api/service/v1/report-templates/update
 */
export interface UpdateReportTemplateRequest {
  /** Template ID (required) */
  id: number;
  /** Template name (max 100 chars) */
  name?: string;
  /** Template description (max 500 chars) */
  description?: string;
  /** Template category */
  category?: ReportTemplateCategory;
  /** Template content */
  content?: string;
  /** Array of tags */
  tags?: string[];
  /** Expected version for optimistic locking (required) */
  expectedVersion: number;
}

/**
 * Delete report template request
 * POST /api/service/v1/report-templates/delete
 */
export interface DeleteReportTemplateRequest {
  /** Template ID (required) */
  id: number;
}

// ============================================================================
// Report Template Response Types (Feature: 011-report-api-integration)
// ============================================================================

/** List report templates response */
export type ReportTemplateListResponse = ApiResponse<PageResult<ReportTemplateDTO>>;

/** Get report template detail response */
export type ReportTemplateDetailResponse = ApiResponse<ReportTemplateDTO>;

/** Create report template response */
export type CreateReportTemplateResponse = ApiResponse<ReportTemplateDTO>;

/** Update report template response */
export type UpdateReportTemplateResponse = ApiResponse<ReportTemplateDTO>;

/** Delete report template response */
export type DeleteReportTemplateResponse = ApiResponse<void>;

// ============================================================================
// Topology Report Template Binding Types (Feature: 014-topology-report-template)
// ============================================================================

/**
 * Bind report templates to topology request
 * POST /api/service/v1/topologies/report-templates/bind
 */
export interface BindTopologyReportTemplatesRequest {
  /** Topology ID (required) */
  topologyId: number;
  /** Array of report template IDs to bind (required) */
  reportTemplateIds: number[];
}

/**
 * Unbind report templates from topology request
 * POST /api/service/v1/topologies/report-templates/unbind
 */
export interface UnbindTopologyReportTemplatesRequest {
  /** Topology ID (required) */
  topologyId: number;
  /** Array of report template IDs to unbind (required) */
  reportTemplateIds: number[];
}

/**
 * Query bound report templates request
 * POST /api/service/v1/topologies/report-templates/bound
 */
export interface QueryBoundReportTemplatesRequest {
  /** Topology ID (required) */
  topologyId: number;
  /** Page number (1-based, default 1) */
  page?: number;
  /** Page size (default 20, max 100) */
  size?: number;
  /** Search keyword (matches name, description) */
  keyword?: string;
}

/**
 * Query unbound report templates request
 * POST /api/service/v1/topologies/report-templates/unbound
 */
export interface QueryUnboundReportTemplatesRequest {
  /** Topology ID (required) */
  topologyId: number;
  /** Page number (1-based, default 1) */
  page?: number;
  /** Page size (default 20, max 100) */
  size?: number;
  /** Search keyword (matches name, description) */
  keyword?: string;
}

/** Bind report templates response */
export type BindTopologyReportTemplatesResponse = ApiResponse<void>;

/** Unbind report templates response */
export type UnbindTopologyReportTemplatesResponse = ApiResponse<void>;

/** Query bound report templates response */
export type QueryBoundReportTemplatesResponse = ApiResponse<PageResult<ReportTemplateDTO>>;

/** Query unbound report templates response */
export type QueryUnboundReportTemplatesResponse = ApiResponse<PageResult<ReportTemplateDTO>>;

// ============================================================================
// Agent Types (Feature: 012-agent-api-integration)
// ============================================================================

/**
 * Agent role enum (backend format - uppercase codes)
 */
export type AgentRoleDTO = 'GLOBAL_SUPERVISOR' | 'TEAM_SUPERVISOR' | 'WORKER' | 'SCOUTER';

/**
 * Agent hierarchy level enum
 */
export type AgentHierarchyLevel = 'GLOBAL_SUPERVISOR' | 'TEAM_SUPERVISOR' | 'TEAM_WORKER' | 'INDEPENDENT';

/**
 * Agent status enum
 */
export type AgentStatusDTO = 'IDLE' | 'THINKING' | 'WORKING' | 'COMPLETED' | 'WAITING' | 'ERROR';

/**
 * Agent DTO from API (flat structure - no nested config)
 */
export interface AgentDTO {
  /** Agent ID (int64) */
  id: number;
  /** Display name (max 100 chars) */
  name: string;
  /** Agent role in hierarchy */
  role: AgentRoleDTO;
  /** Agent hierarchy level */
  hierarchyLevel?: AgentHierarchyLevel;
  /** Area of expertise */
  specialty?: string;
  /** Prompt template ID */
  promptTemplateId?: number;
  /** Prompt template name (read-only, joined from template) */
  promptTemplateName?: string;
  /** AI model identifier (e.g., "gemini-2.0-flash") */
  model?: string;
  /** Temperature parameter (0.0-2.0) */
  temperature?: number;
  /** Top P parameter (0.0-1.0) */
  topP?: number;
  /** Maximum output tokens */
  maxTokens?: number;
  /** Maximum runtime in seconds */
  maxRuntime?: number;
  /** Array of assigned tool IDs (UUID strings) */
  toolIds?: string[];
  /** Count of warning findings */
  warnings: number;
  /** Count of critical findings */
  critical: number;
  /** IDs of teams this agent belongs to */
  teamIds: number[];
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * Agent configuration template (predefined templates from backend)
 */
export interface AgentTemplateDTO {
  /** Template ID */
  id: number;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Suggested role */
  recommendedRole?: AgentRoleDTO;
  /** Template system instruction */
  systemInstruction: string;
  /** Suggested model */
  recommendedModel?: string;
  /** Suggested temperature */
  recommendedTemperature?: number;
}

// ============================================================================
// Agent Request Types (Feature: 012-agent-api-integration)
// ============================================================================

/**
 * List agents request
 * POST /api/service/v1/agents/list
 */
export interface ListAgentsRequest {
  /** Filter by role */
  role?: AgentRoleDTO;
  /** Filter by team ID */
  teamId?: number;
  /** Search by name or specialty */
  keyword?: string;
  /** Page number (1-based, default 1) */
  page?: number;
  /** Page size (default 10, max 100) */
  size?: number;
}

/**
 * Get agent request
 * POST /api/service/v1/agents/get
 */
export interface GetAgentRequest {
  /** Agent ID (required) */
  id: number;
}

/**
 * Create agent request
 * POST /api/service/v1/agents/create
 */
export interface CreateAgentRequest {
  /** Display name (required, max 100 chars) */
  name: string;
  /** Agent role (default: WORKER) */
  role?: AgentRoleDTO;
  /** Area of expertise */
  specialty?: string;
  /** Prompt template ID */
  promptTemplateId?: number;
  /** AI model identifier */
  model?: string;
  /** Temperature parameter (0.0-2.0) */
  temperature?: number;
  /** Top P parameter (0.0-1.0) */
  topP?: number;
  /** Maximum output tokens */
  maxTokens?: number;
  /** Maximum runtime in seconds */
  maxRuntime?: number;
}

/**
 * Update agent request (unified - basic info + LLM config)
 * POST /api/service/v1/agents/update
 */
export interface UpdateAgentRequest {
  /** Agent ID (required) */
  id: number;
  /** New display name */
  name?: string;
  /** New specialty */
  specialty?: string;
  /** Prompt template ID */
  promptTemplateId?: number;
  /** AI model identifier */
  model?: string;
  /** Temperature parameter (0.0-2.0) */
  temperature?: number;
  /** Top P parameter (0.0-1.0) */
  topP?: number;
  /** Maximum output tokens */
  maxTokens?: number;
  /** Maximum runtime in seconds */
  maxRuntime?: number;
  /** Array of tool IDs (UUID strings, full replacement semantics) */
  toolIds?: string[];
}

/**
 * Delete agent request
 * POST /api/service/v1/agents/delete
 */
export interface DeleteAgentRequest {
  /** Agent ID (required) */
  id: number;
}

// ============================================================================
// Agent Response Types (Feature: 012-agent-api-integration)
// ============================================================================

/** List agents response */
export type AgentListResponse = ApiResponse<PageResult<AgentDTO>>;

/** Get agent detail response */
export type AgentDetailResponse = ApiResponse<AgentDTO>;

/** Create agent response */
export type CreateAgentResponse = ApiResponse<AgentDTO>;

/** Update agent response */
export type UpdateAgentResponse = ApiResponse<AgentDTO>;

/** Delete agent response */
export type DeleteAgentResponse = ApiResponse<void>;

/** List agent templates response */
export type AgentTemplateListResponse = ApiResponse<AgentTemplateDTO[]>;

// ============================================================================
// Hierarchical Team Types (Feature: Diagnosis Page Integration)
// ============================================================================

/**
 * Team member Agent DTO (simplified for hierarchical team response)
 * Used within HierarchicalTeamDTO - matches backend AgentDTO structure
 */
export interface HierarchicalAgentDTO {
  /** Agent ID */
  id: number;
  /** Agent bound ID (binding relationship ID, used to match SSE events) */
  boundId?: number;
  /** Agent name */
  name: string;
  /** Agent role (GLOBAL_SUPERVISOR, TEAM_SUPERVISOR, WORKER, SCOUTER) */
  role: AgentRoleDTO;
  /** Agent hierarchy level (GLOBAL_SUPERVISOR, TEAM_SUPERVISOR, TEAM_WORKER, INDEPENDENT) */
  hierarchyLevel?: AgentHierarchyLevel;
  /** Specialty description */
  specialty?: string;
  /** Prompt template ID */
  promptTemplateId?: number;
  /** Prompt template name */
  promptTemplateName?: string;
  /** AI model identifier */
  model?: string;
  /** Temperature parameter (0.0-2.0) */
  temperature?: number;
  /** Top P parameter (0.0-1.0) */
  topP?: number;
  /** Max output tokens */
  maxTokens?: number;
  /** Max runtime in seconds */
  maxRuntime?: number;
  /** Warning count */
  warnings?: number;
  /** Critical issue count */
  critical?: number;
  /** Creation timestamp */
  createdAt?: string;
  /** Update timestamp */
  updatedAt?: string;
}

/**
 * Team DTO - represents a node's agent team
 * Each resource node can have a supervisor and workers
 */
export interface HierarchicalTeamNodeDTO {
  /** Resource node ID */
  nodeId: number;
  /** Resource node name */
  nodeName: string;
  /** Team supervisor agent (may be null) */
  supervisor: HierarchicalAgentDTO | null;
  /** Team worker agents (may be empty) */
  workers: HierarchicalAgentDTO[];
}

/**
 * Hierarchical Team DTO - full team structure for a topology
 * POST /api/service/v1/topologies/hierarchical-team/query
 */
export interface HierarchicalTeamDTO {
  /** Topology ID */
  topologyId: number;
  /** Topology name */
  topologyName: string;
  /** Global supervisor agent (may be null if not assigned) */
  globalSupervisor: HierarchicalAgentDTO | null;
  /** Teams list (one team per resource node) */
  teams: HierarchicalTeamNodeDTO[];
}

/**
 * Query hierarchical team request
 * POST /api/service/v1/topologies/hierarchical-team/query
 */
export interface HierarchicalTeamQueryRequest {
  /** Topology ID (required) */
  topologyId: number;
}

/** Query hierarchical team response */
export type HierarchicalTeamQueryResponse = ApiResponse<HierarchicalTeamDTO>;

// ============================================================================
// Execution Types (Feature: Multi-Agent Execution Integration)
// ============================================================================

/**
 * Execution event from SSE stream
 * POST /api/service/v1/executions/trigger
 */
export interface ExecutionEvent {
  /** Event type (may be null, 'error' for errors, 'started' for first event) */
  type: string | null;
  /** Run ID (only present in 'started' event, used for cancellation) */
  runId?: string;
  /** Agent name (may be null) - legacy field */
  agentName: string | null;
  /** Agent role (may be null) - legacy field */
  agentRole: string | null;
  /** Event content/message text */
  content: string | null;
  /** Timestamp (ISO 8601 format) */
  timestamp: string;
  /** Additional metadata (may be null) */
  metadata: Record<string, unknown> | null;

  // ---- SSE stream agent identification fields (llm_stream events) ----
  /** Whether this is from Global Supervisor */
  _is_global_supervisor?: boolean;
  /** Team name (for team supervisor or worker) */
  _team_name?: string;
  /** Whether this is from Team Supervisor */
  _is_team_supervisor?: boolean;
  /** Worker name (for worker agents) */
  _worker_name?: string;
  /** Run ID in snake_case format */
  run_id?: string;
  /** Result for execution_completed event */
  result?: string;
  /** Statistics for execution_completed event */
  statistics?: Record<string, unknown>;
}

/**
 * Trigger execution request
 * POST /api/service/v1/executions/trigger
 */
export interface TriggerExecutionRequest {
  /** Topology ID (required) */
  topologyId: number;
  /** User task message (required) */
  userMessage: string;
}

/**
 * Cancel execution request
 * POST /api/service/v1/executions/cancel
 */
export interface CancelExecutionRequest {
  /** Run ID (from 'started' event) */
  runId: string;
}

/**
 * Cancel execution response
 * POST /api/service/v1/executions/cancel
 */
export interface CancelExecutionResponse {
  /** Response code ('SUCCESS' or 'CANCEL_FAILED') */
  code: string;
  /** Response message */
  message: string;
  /** Response data (contains cancelled event info on success) */
  data: {
    type: string;
    runId: string;
    content: string;
    timestamp: string;
  } | null;
}

/**
 * Parsed agent info from event content
 */
export interface ParsedAgentInfo {
  role: 'global_supervisor' | 'team_supervisor' | 'worker' | 'unknown';
  team?: string;
  name?: string;
}

/**
 * Execution event type classification
 */
export type ExecutionEventType =
  | 'task_start'
  | 'thinking'
  | 'team_selection'
  | 'coordination'
  | 'work_start'
  | 'agent_thinking'
  | 'output'
  | 'error'
  | 'unknown';

// ============================================================================
// Executor SSE Event Types (Feature: 016-diagnosis-sse-refactor)
// New structured event format from backend 042-refactor-executor-integration
// ============================================================================

/**
 * Agent type in hierarchy
 * Determines display format in UI
 */
export type AgentType = 'global_supervisor' | 'team_supervisor' | 'worker';

/**
 * Event category for SSE events
 */
export type EventCategory = 'lifecycle' | 'llm' | 'dispatch' | 'system';

/**
 * Event source - Agent identification within an event
 * The agent_id is the binding relationship ID (agent_bound.id), NOT the Agent table PK
 */
export interface EventSource {
  /** Binding relationship ID (agent_bound.id) - NOT agent table PK */
  agent_id: string;
  /** Agent type in hierarchy */
  agent_type: AgentType;
  /** Display name for the agent */
  agent_name: string;
  /** Team name (null for global_supervisor) */
  team_name: string | null;
}

/**
 * Event type - category and action pair
 */
export interface EventType {
  /** Event category */
  category: EventCategory;
  /** Action within category */
  action: string;
}

// ---- Event Data Types ----

/** Lifecycle started event data */
export interface LifecycleStartedData {
  // Empty for started event
}

/** Lifecycle completed event data */
export interface LifecycleCompletedData {
  summary: string;
}

/** Lifecycle failed event data */
export interface LifecycleFailedData {
  error: string;
}

/** Lifecycle cancelled event data */
export interface LifecycleCancelledData {
  // Empty for cancelled event
}

/** LLM stream event data */
export interface LlmStreamData {
  content: string;
}

/** LLM reasoning event data */
export interface LlmReasoningData {
  thought: string;
}

/** LLM tool call event data */
export interface LlmToolCallData {
  tool: string;
  args: Record<string, unknown>;
}

/** LLM tool result event data */
export interface LlmToolResultData {
  tool: string;
  result: unknown;
}

/** Dispatch team event data */
export interface DispatchTeamData {
  team_name: string;
  task: string;
}

/** Dispatch worker event data */
export interface DispatchWorkerData {
  worker_name: string;
  task: string;
}

/** System topology event data */
export interface SystemTopologyData {
  hierarchy: Record<string, unknown>;
}

/** System warning event data */
export interface SystemWarningData {
  message: string;
}

/** System error event data */
export interface SystemErrorData {
  message: string;
  code: string;
}

/**
 * Union type for all event data payloads
 */
export type EventData =
  | LifecycleStartedData
  | LifecycleCompletedData
  | LifecycleFailedData
  | LifecycleCancelledData
  | LlmStreamData
  | LlmReasoningData
  | LlmToolCallData
  | LlmToolResultData
  | DispatchTeamData
  | DispatchWorkerData
  | SystemTopologyData
  | SystemWarningData
  | SystemErrorData;

/**
 * ExecutorEvent - Root SSE event payload from backend
 * New structured format from 042-refactor-executor-integration
 */
export interface ExecutorEvent {
  /** Unique execution run identifier */
  run_id: string;
  /** Event timestamp (ISO 8601) */
  timestamp: string;
  /** Sequence number for ordering events */
  sequence: number;
  /** Agent source information (null for lifecycle.started) */
  source: EventSource | null;
  /** Event type (category + action) */
  event: EventType;
  /** Event-specific data payload */
  data: EventData;
}

/**
 * Tool call info for LogMessage
 */
export interface ToolCallInfo {
  tool: string;
  args: Record<string, unknown>;
  result?: unknown;
}

/**
 * LogMessage - Frontend representation of a chat bubble
 * Updated for new SSE event format
 */
export interface LogMessage {
  /** Unique message ID */
  id: string;
  /** Timestamp (Unix ms) */
  timestamp: number;
  /** Agent identifier (for grouping) */
  fromAgentId: string;
  /** Agent display name */
  fromAgentName: string;
  /** Main content text */
  content: string;
  /** Message type for styling */
  type: LogMessageType;
  /** Whether content is still streaming */
  isStreaming: boolean;
  /** Collapsible reasoning content */
  reasoning?: string;
  /** Tool calls within this message */
  toolCalls?: ToolCallInfo[];
}

/**
 * Log message type for styling
 */
export type LogMessageType = 'thought' | 'instruction' | 'report' | 'system';
