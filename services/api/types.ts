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
 * Topology layer enum
 */
export type TopologyLayer = 'scenario' | 'flow' | 'application' | 'middleware' | 'infrastructure';

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
