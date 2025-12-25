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
} from './types';

// ============================================================================
// API Endpoints
// ============================================================================

const ENDPOINTS = {
  // Topology Graph (deprecated - use TOPOLOGY_CRUD for list/CRUD operations)
  TOPOLOGY_QUERY: '/api/v1/resources/topology/query',

  // Members
  MEMBERS_QUERY: '/api/v1/resources/members/query',
  MEMBERS_WITH_RELATIONS_QUERY: '/api/v1/resources/members-with-relations/query',
  MEMBERS_ADD: '/api/v1/resources/members/add',
  MEMBERS_REMOVE: '/api/v1/resources/members/remove',

  // Hierarchy
  ANCESTORS_QUERY: '/api/v1/resources/ancestors/query',

  // Relationships
  RELATIONSHIPS_CREATE: '/api/v1/relationships/create',
  RELATIONSHIPS_UPDATE: '/api/v1/relationships/update',
  RELATIONSHIPS_DELETE: '/api/v1/relationships/delete',
  RELATIONSHIPS_RESOURCE_QUERY: '/api/v1/relationships/resource/query',
  RELATIONSHIPS_CYCLE_DETECTION: '/api/v1/relationships/resource/cycle-detection',
} as const;

// ============================================================================
// Topology CRUD Endpoints (Feature: 004-topology-api-separation)
// ============================================================================

const TOPOLOGY_CRUD_ENDPOINTS = {
  QUERY: '/api/v1/topologies/query',
  CREATE: '/api/v1/topologies/create',
  GET: '/api/v1/topologies/get',
  UPDATE: '/api/v1/topologies/update',
  DELETE: '/api/v1/topologies/delete',
} as const;

// ============================================================================
// Topology API
// ============================================================================

export const topologyApi = {
  /**
   * Query topology graph data for a subgraph
   */
  queryTopology: (params: TopologyQueryRequest): Promise<TopologyQueryResponse> =>
    apiPost<TopologyQueryRequest, TopologyQueryResponse>(
      ENDPOINTS.TOPOLOGY_QUERY,
      params
    ),

  /**
   * Query paginated member list for a topology
   */
  queryMembers: (params: MembersQueryRequest): Promise<PageResult<TopologyMember>> =>
    apiPost<MembersQueryRequest, PageResult<TopologyMember>>(
      ENDPOINTS.MEMBERS_QUERY,
      params
    ),

  /**
   * Query members with their relationships
   */
  queryMembersWithRelations: (params: MembersQueryRequest): Promise<TopologyQueryResponse> =>
    apiPost<MembersQueryRequest, TopologyQueryResponse>(
      ENDPOINTS.MEMBERS_WITH_RELATIONS_QUERY,
      params
    ),

  /**
   * Add members to a subgraph
   */
  addMembers: (params: MembersAddRequest): Promise<MembersAddResponse> =>
    apiPost<MembersAddRequest, MembersAddResponse>(
      ENDPOINTS.MEMBERS_ADD,
      params
    ),

  /**
   * Remove members from a subgraph
   */
  removeMembers: (params: MembersRemoveRequest): Promise<void> =>
    apiPost<MembersRemoveRequest, void>(
      ENDPOINTS.MEMBERS_REMOVE,
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
