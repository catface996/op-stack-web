/**
 * Node API Service
 *
 * Encapsulates all resource node management API calls
 * Feature: 005-api-reintegration
 */

import { apiPost } from './client';
import type {
  QueryNodesRequest,
  CreateNodeRequest,
  UpdateNodeRequest,
  DeleteNodeRequest,
  NodeDTO,
  NodeTypeDTO,
  PageResult,
  DEFAULT_OPERATOR_ID,
} from './types';

// ============================================================================
// API Endpoints
// ============================================================================

const ENDPOINTS = {
  QUERY: '/api/v1/nodes/query',
  CREATE: '/api/v1/nodes/create',
  GET: '/api/v1/nodes/get',
  UPDATE: '/api/v1/nodes/update',
  DELETE: '/api/v1/nodes/delete',
  TYPES_QUERY: '/api/v1/nodes/types/query',
} as const;

// ============================================================================
// Node API
// ============================================================================

export const nodeApi = {
  /**
   * Query node list with pagination and filters
   * POST /api/v1/nodes/query
   */
  query: (params: QueryNodesRequest): Promise<PageResult<NodeDTO>> =>
    apiPost<QueryNodesRequest, PageResult<NodeDTO>>(
      ENDPOINTS.QUERY,
      params
    ),

  /**
   * Create a new node
   * POST /api/v1/nodes/create
   */
  create: (params: CreateNodeRequest): Promise<NodeDTO> =>
    apiPost<CreateNodeRequest, NodeDTO>(
      ENDPOINTS.CREATE,
      params
    ),

  /**
   * Get node details by ID
   * POST /api/v1/nodes/get
   */
  get: (id: number): Promise<NodeDTO> =>
    apiPost<{ id: number }, NodeDTO>(
      ENDPOINTS.GET,
      { id }
    ),

  /**
   * Update node details
   * POST /api/v1/nodes/update
   */
  update: (params: UpdateNodeRequest): Promise<NodeDTO> =>
    apiPost<UpdateNodeRequest, NodeDTO>(
      ENDPOINTS.UPDATE,
      params
    ),

  /**
   * Delete a node
   * POST /api/v1/nodes/delete
   */
  delete: (params: DeleteNodeRequest): Promise<void> =>
    apiPost<DeleteNodeRequest, void>(
      ENDPOINTS.DELETE,
      params
    ),

  /**
   * Query available node types
   * POST /api/v1/nodes/types/query
   */
  getTypes: (): Promise<NodeTypeDTO[]> =>
    apiPost<Record<string, never>, NodeTypeDTO[]>(
      ENDPOINTS.TYPES_QUERY,
      {}
    ),
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a node with default operatorId
 */
export function createNode(
  name: string,
  nodeTypeId: number,
  options?: {
    description?: string;
    agentTeamId?: number;
    attributes?: string;
    operatorId?: number;
  }
): Promise<NodeDTO> {
  return nodeApi.create({
    operatorId: options?.operatorId ?? 1,
    name,
    nodeTypeId,
    description: options?.description,
    agentTeamId: options?.agentTeamId,
    attributes: options?.attributes,
  });
}

/**
 * Delete a node with default operatorId
 */
export function deleteNode(
  id: number,
  operatorId: number = 1
): Promise<void> {
  return nodeApi.delete({ operatorId, id });
}
