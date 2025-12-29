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
  AgentDTO,
} from './types';

// ============================================================================
// API Endpoints
// ============================================================================

const ENDPOINTS = {
  QUERY: '/api/service/v1/nodes/query',
  CREATE: '/api/service/v1/nodes/create',
  GET: '/api/service/v1/nodes/get',
  UPDATE: '/api/service/v1/nodes/update',
  DELETE: '/api/service/v1/nodes/delete',
  TYPES_QUERY: '/api/service/v1/nodes/types/query',
  BIND_AGENT: '/api/service/v1/nodes/bindAgent',
  UNBIND_AGENT: '/api/service/v1/nodes/unbindAgent',
  LIST_AGENTS: '/api/service/v1/nodes/listAgents',
  LIST_UNBOUND_AGENTS: '/api/service/v1/nodes/listUnboundAgents',
} as const;

// ============================================================================
// Types for Agent Binding
// ============================================================================

export interface BindAgentRequest {
  nodeId: number;
  agentId: number;
}

export interface UnbindAgentRequest {
  nodeId: number;
  agentId: number;
}

export interface NodeAgentRelationDTO {
  id: number;
  nodeId: number;
  agentId: number;
  createdAt: string;
}

export interface ListAgentsByNodeRequest {
  nodeId: number;
}

export interface ListUnboundAgentsRequest {
  nodeId: number;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface ListUnboundSupervisorsRequest {
  nodeId: number;
  keyword?: string;
  page?: number;
  size?: number;
}

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

  /**
   * Bind an agent to a node
   * POST /api/v1/nodes/bindAgent
   */
  bindAgent: (params: BindAgentRequest): Promise<NodeAgentRelationDTO> =>
    apiPost<BindAgentRequest, NodeAgentRelationDTO>(
      ENDPOINTS.BIND_AGENT,
      params
    ),

  /**
   * Unbind an agent from a node
   * POST /api/v1/nodes/unbindAgent
   */
  unbindAgent: (params: UnbindAgentRequest): Promise<void> =>
    apiPost<UnbindAgentRequest, void>(
      ENDPOINTS.UNBIND_AGENT,
      params
    ),

  /**
   * List agents bound to a node
   * POST /api/v1/nodes/listAgents
   */
  listAgents: (params: ListAgentsByNodeRequest): Promise<AgentDTO[]> =>
    apiPost<ListAgentsByNodeRequest, AgentDTO[]>(
      ENDPOINTS.LIST_AGENTS,
      params
    ),

  /**
   * List agents not bound to a node (with pagination)
   * POST /api/v1/nodes/listUnboundAgents
   */
  listUnboundAgents: (params: ListUnboundAgentsRequest): Promise<PageResult<AgentDTO>> =>
    apiPost<ListUnboundAgentsRequest, PageResult<AgentDTO>>(
      ENDPOINTS.LIST_UNBOUND_AGENTS,
      params
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
