/**
 * Topology API Service
 *
 * Encapsulates all topology management API calls
 * Feature: 002-topology-api
 */

import { apiPost } from './client';
import type {
  TopologyQueryRequest,
  TopologyQueryResponse,
  MembersAddRequest,
  MembersAddResponse,
  MembersRemoveRequest,
  MembersQueryRequest,
  TopologyMember,
  AncestorsQueryRequest,
  AncestorNode,
  RelationshipCreateRequest,
  RelationshipUpdateRequest,
  RelationshipDeleteRequest,
  ResourceRelationshipsQueryRequest,
  Relationship,
  CycleDetectionRequest,
  CycleDetectionResponse,
  PageResult,
  RelationshipType,
  // Topology CRUD types (Feature: 004-topology-api-separation)
  TopologyDTO,
  QueryTopologiesRequest,
  CreateTopologyApiRequest,
  GetTopologyRequest,
  UpdateTopologyApiRequest,
  DeleteTopologyApiRequest,
  // Topology Member types (Feature: 005-api-reintegration)
  TopologyMembersQueryRequest,
  TopologyMembersAddRequest,
  TopologyMembersRemoveRequest,
  // Topology Graph Query (Feature: 005-api-reintegration)
  TopologyGraphQueryRequest,
} from './types';

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * Legacy endpoints - some are deprecated, others still in use
 * @deprecated Members endpoints moved to TOPOLOGY_MEMBER_ENDPOINTS
 */
const ENDPOINTS = {
  // Topology Graph (deprecated - use TOPOLOGY_CRUD for list/CRUD operations)
  TOPOLOGY_QUERY: '/api/service/v1/resources/topology/query',

  // Members (DEPRECATED - use TOPOLOGY_MEMBER_ENDPOINTS instead)
  /** @deprecated Use TOPOLOGY_MEMBER_ENDPOINTS.QUERY instead */
  MEMBERS_QUERY: '/api/service/v1/resources/members/query',
  MEMBERS_WITH_RELATIONS_QUERY: '/api/service/v1/resources/members-with-relations/query',
  /** @deprecated Use TOPOLOGY_MEMBER_ENDPOINTS.ADD instead */
  MEMBERS_ADD: '/api/service/v1/resources/members/add',
  /** @deprecated Use TOPOLOGY_MEMBER_ENDPOINTS.REMOVE instead */
  MEMBERS_REMOVE: '/api/service/v1/resources/members/remove',

  // Hierarchy (still in use)
  ANCESTORS_QUERY: '/api/service/v1/resources/ancestors/query',

  // Relationships (still in use)
  RELATIONSHIPS_CREATE: '/api/service/v1/relationships/create',
  RELATIONSHIPS_UPDATE: '/api/service/v1/relationships/update',
  RELATIONSHIPS_DELETE: '/api/service/v1/relationships/delete',
  RELATIONSHIPS_RESOURCE_QUERY: '/api/service/v1/relationships/resource/query',
  RELATIONSHIPS_CYCLE_DETECTION: '/api/service/v1/relationships/resource/cycle-detection',
} as const;

// ============================================================================
// Topology Member Endpoints (Feature: 005-api-reintegration)
// NEW: Use these instead of the deprecated /api/v1/resources/members/* endpoints
// ============================================================================

const TOPOLOGY_MEMBER_ENDPOINTS = {
  QUERY: '/api/service/v1/topologies/members/query',
  ADD: '/api/service/v1/topologies/members/add',
  REMOVE: '/api/service/v1/topologies/members/remove',
} as const;

// ============================================================================
// Topology CRUD Endpoints (Feature: 004-topology-api-separation)
// ============================================================================

const TOPOLOGY_CRUD_ENDPOINTS = {
  QUERY: '/api/service/v1/topologies/query',
  CREATE: '/api/service/v1/topologies/create',
  GET: '/api/service/v1/topologies/get',
  UPDATE: '/api/service/v1/topologies/update',
  DELETE: '/api/service/v1/topologies/delete',
  GRAPH_QUERY: '/api/service/v1/topologies/graph/query',
  SUPERVISOR_BIND: '/api/service/v1/topologies/supervisor/bind',
  SUPERVISOR_UNBIND: '/api/service/v1/topologies/supervisor/unbind',
} as const;

// ============================================================================
// Topology API
// ============================================================================

export const topologyApi = {
  /**
   * Query topology graph data for a subgraph
   * @deprecated Use queryGraph with topologyId instead (Feature: 005-api-reintegration)
   */
  queryTopology: (params: TopologyQueryRequest): Promise<TopologyQueryResponse> =>
    apiPost<TopologyQueryRequest, TopologyQueryResponse>(
      ENDPOINTS.TOPOLOGY_QUERY,
      params
    ),

  /**
   * Query topology graph data (NEW endpoint)
   * POST /api/v1/topologies/graph/query
   * @param params - Uses topologyId (not resourceId)
   */
  queryGraph: (params: TopologyGraphQueryRequest): Promise<TopologyQueryResponse> =>
    apiPost<TopologyGraphQueryRequest, TopologyQueryResponse>(
      TOPOLOGY_CRUD_ENDPOINTS.GRAPH_QUERY,
      params
    ),

  /**
   * Query paginated member list for a topology
   * Uses NEW endpoint: POST /api/v1/topologies/members/query
   * @param params - Uses topologyId (not resourceId)
   */
  queryMembers: (params: TopologyMembersQueryRequest): Promise<PageResult<TopologyMember>> =>
    apiPost<TopologyMembersQueryRequest, PageResult<TopologyMember>>(
      TOPOLOGY_MEMBER_ENDPOINTS.QUERY,
      params
    ),

  /**
   * Query members with their relationships
   * @deprecated This still uses the old endpoint - may be migrated later
   */
  queryMembersWithRelations: (params: MembersQueryRequest): Promise<TopologyQueryResponse> =>
    apiPost<MembersQueryRequest, TopologyQueryResponse>(
      ENDPOINTS.MEMBERS_WITH_RELATIONS_QUERY,
      params
    ),

  /**
   * Add members to a topology
   * Uses NEW endpoint: POST /api/v1/topologies/members/add
   * @param params - Uses topologyId (not resourceId)
   */
  addMembers: (params: TopologyMembersAddRequest): Promise<MembersAddResponse> =>
    apiPost<TopologyMembersAddRequest, MembersAddResponse>(
      TOPOLOGY_MEMBER_ENDPOINTS.ADD,
      params
    ),

  /**
   * Remove members from a topology
   * Uses NEW endpoint: POST /api/v1/topologies/members/remove
   * @param params - Uses topologyId (not resourceId)
   */
  removeMembers: (params: TopologyMembersRemoveRequest): Promise<void> =>
    apiPost<TopologyMembersRemoveRequest, void>(
      TOPOLOGY_MEMBER_ENDPOINTS.REMOVE,
      params
    ),

  /**
   * Query ancestor breadcrumb chain for a resource
   */
  queryAncestors: (params: AncestorsQueryRequest): Promise<AncestorNode[]> =>
    apiPost<AncestorsQueryRequest, AncestorNode[]>(
      ENDPOINTS.ANCESTORS_QUERY,
      params
    ),

  /**
   * Create a relationship between resources
   */
  createRelationship: (params: RelationshipCreateRequest): Promise<Relationship> =>
    apiPost<RelationshipCreateRequest, Relationship>(
      ENDPOINTS.RELATIONSHIPS_CREATE,
      params
    ),

  /**
   * Update a relationship
   */
  updateRelationship: (params: RelationshipUpdateRequest): Promise<Relationship> =>
    apiPost<RelationshipUpdateRequest, Relationship>(
      ENDPOINTS.RELATIONSHIPS_UPDATE,
      params
    ),

  /**
   * Delete a relationship
   */
  deleteRelationship: (params: RelationshipDeleteRequest): Promise<void> =>
    apiPost<RelationshipDeleteRequest, void>(
      ENDPOINTS.RELATIONSHIPS_DELETE,
      params
    ),

  /**
   * Query relationships for a resource
   */
  queryResourceRelationships: (params: ResourceRelationshipsQueryRequest): Promise<Relationship[]> =>
    apiPost<ResourceRelationshipsQueryRequest, Relationship[]>(
      ENDPOINTS.RELATIONSHIPS_RESOURCE_QUERY,
      params
    ),

  /**
   * Detect circular references before adding members
   */
  detectCycles: (params: CycleDetectionRequest): Promise<CycleDetectionResponse> =>
    apiPost<CycleDetectionRequest, CycleDetectionResponse>(
      ENDPOINTS.RELATIONSHIPS_CYCLE_DETECTION,
      params
    ),

  // ==========================================================================
  // Topology CRUD Methods (Feature: 004-topology-api-separation)
  // ==========================================================================

  /**
   * Query paginated topology list
   * POST /api/v1/topologies/query
   */
  query: (params: QueryTopologiesRequest): Promise<PageResult<TopologyDTO>> =>
    apiPost<QueryTopologiesRequest, PageResult<TopologyDTO>>(
      TOPOLOGY_CRUD_ENDPOINTS.QUERY,
      params
    ),

  /**
   * Create a new topology
   * POST /api/v1/topologies/create
   */
  create: (params: CreateTopologyApiRequest): Promise<TopologyDTO> =>
    apiPost<CreateTopologyApiRequest, TopologyDTO>(
      TOPOLOGY_CRUD_ENDPOINTS.CREATE,
      params
    ),

  /**
   * Get topology details by ID
   * POST /api/v1/topologies/get
   */
  get: (params: GetTopologyRequest): Promise<TopologyDTO> =>
    apiPost<GetTopologyRequest, TopologyDTO>(
      TOPOLOGY_CRUD_ENDPOINTS.GET,
      params
    ),

  /**
   * Update topology details
   * POST /api/v1/topologies/update
   */
  update: (params: UpdateTopologyApiRequest): Promise<TopologyDTO> =>
    apiPost<UpdateTopologyApiRequest, TopologyDTO>(
      TOPOLOGY_CRUD_ENDPOINTS.UPDATE,
      params
    ),

  /**
   * Delete a topology
   * POST /api/v1/topologies/delete
   */
  delete: (params: DeleteTopologyApiRequest): Promise<void> =>
    apiPost<DeleteTopologyApiRequest, void>(
      TOPOLOGY_CRUD_ENDPOINTS.DELETE,
      params
    ),

  /**
   * Bind Global Supervisor Agent to topology
   * POST /api/v1/topologies/supervisor/bind
   */
  bindSupervisor: (params: { topologyId: number; agentId: number; operatorId?: number }): Promise<TopologyDTO> =>
    apiPost<{ topologyId: number; agentId: number; operatorId: number }, TopologyDTO>(
      TOPOLOGY_CRUD_ENDPOINTS.SUPERVISOR_BIND,
      { ...params, operatorId: params.operatorId ?? 1 }
    ),

  /**
   * Unbind Global Supervisor Agent from topology
   * POST /api/v1/topologies/supervisor/unbind
   */
  unbindSupervisor: (params: { topologyId: number; operatorId?: number }): Promise<TopologyDTO> =>
    apiPost<{ topologyId: number; operatorId: number }, TopologyDTO>(
      TOPOLOGY_CRUD_ENDPOINTS.SUPERVISOR_UNBIND,
      { ...params, operatorId: params.operatorId ?? 1 }
    ),
};

// ============================================================================
// Data Transformation Utilities
// ============================================================================

/**
 * D3-compatible topology link type
 */
export type D3LinkType = 'call' | 'dependency' | 'deployment' | 'inferred';

/**
 * D3-compatible topology node
 */
export interface D3TopologyNode {
  id: string;
  label: string;
  type: string;
  layer: string;
  isSubgraph?: boolean;
  status?: string;
  isShadow?: boolean;
}

/**
 * D3-compatible topology link
 */
export interface D3TopologyLink {
  source: string;
  target: string;
  type: D3LinkType;
  confidence?: number;
  relationshipId?: number;
}

/**
 * D3-compatible topology structure
 */
export interface D3Topology {
  nodes: D3TopologyNode[];
  links: D3TopologyLink[];
}

/**
 * Map API RelationshipType to D3 link type
 */
export function mapRelationshipType(apiType: RelationshipType | 'CALL'): D3LinkType {
  const mapping: Record<string, D3LinkType> = {
    API_CALL: 'call',
    CALL: 'call',
    DATA_FLOW: 'call',
    DEPENDENCY: 'dependency',
    DEPLOYMENT: 'deployment',
  };
  return mapping[apiType] || 'inferred';
}

/**
 * Convert edge strength to confidence value (0-1)
 */
function strengthToConfidence(strength: string | number): number {
  if (typeof strength === 'number') {
    return strength / 10;
  }
  const mapping: Record<string, number> = {
    STRONG: 1.0,
    MEDIUM: 0.6,
    WEAK: 0.3,
  };
  return mapping[strength] || 0.5;
}

/**
 * Transform API TopologyQueryResponse to D3-compatible format
 */
export function transformToD3(response: TopologyQueryResponse): D3Topology {
  const nodes: D3TopologyNode[] = response.nodes.map(node => ({
    id: String(node.id),
    label: node.name,
    type: node.typeCode,
    layer: node.layer || 'application',
    isSubgraph: node.isSubgraph ?? node.subgraph,  // Handle both field names
    status: node.status,
  }));

  const links: D3TopologyLink[] = response.edges.map(edge => ({
    source: String(edge.sourceId),
    target: String(edge.targetId),
    type: mapRelationshipType(edge.relationshipType),
    confidence: strengthToConfidence(edge.strength),
    relationshipId: edge.id,
  }));

  return { nodes, links };
}
