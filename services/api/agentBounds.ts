/**
 * Agent Bounds API Service
 *
 * Unified API for binding/unbinding agents to entities (Topology/Node)
 * Feature: 040-agent-bound-refactor
 */

import { apiPost } from './client';

// ============================================================================
// API Endpoints
// ============================================================================

const ENDPOINTS = {
  BIND: '/api/service/v1/agent-bounds/bind',
  UNBIND: '/api/service/v1/agent-bounds/unbind',
  QUERY_BY_ENTITY: '/api/service/v1/agent-bounds/query-by-entity',
  QUERY_BY_AGENT: '/api/service/v1/agent-bounds/query-by-agent',
  QUERY_HIERARCHY: '/api/service/v1/agent-bounds/query-hierarchy',
} as const;

// ============================================================================
// Types
// ============================================================================

export type EntityType = 'TOPOLOGY' | 'NODE';
export type HierarchyLevel = 'GLOBAL_SUPERVISOR' | 'TEAM_SUPERVISOR' | 'TEAM_WORKER';

export interface BindAgentRequest {
  agentId: number;
  entityId: number;
  entityType: EntityType;
}

export interface UnbindAgentRequest {
  agentId: number;
  entityId: number;
  entityType: EntityType;
}

export interface QueryByEntityRequest {
  entityType: EntityType;
  entityId: number;
  hierarchyLevel?: HierarchyLevel;
}

export interface QueryByAgentRequest {
  agentId: number;
  entityType?: EntityType;
}

export interface QueryHierarchyRequest {
  topologyId: number;
}

export interface AgentBoundDTO {
  id: number;
  agentId: number;
  agentName: string;
  agentRole: string;
  hierarchyLevel: HierarchyLevel;
  entityId: number;
  entityType: EntityType;
  entityName: string | null;
  createdAt: string;
}

export interface HierarchyAgentDTO {
  id: number;
  boundId?: number;  // Agent bound ID (used for SSE event matching)
  name: string;
  role: string;
  hierarchyLevel: HierarchyLevel;
  specialty?: string;
  model?: string;
}

export interface HierarchyTeamDTO {
  nodeId: number;
  nodeName: string;
  supervisor: HierarchyAgentDTO | null;
  workers: HierarchyAgentDTO[];
}

export interface HierarchyStructureDTO {
  topologyId: number;
  topologyName: string;
  globalSupervisor: HierarchyAgentDTO | null;
  teams: HierarchyTeamDTO[];
}

// ============================================================================
// API Functions
// ============================================================================

export const agentBoundsApi = {
  /**
   * Bind an agent to an entity (Topology or Node)
   * POST /api/service/v1/agent-bounds/bind
   */
  bind: (params: BindAgentRequest): Promise<AgentBoundDTO> =>
    apiPost<BindAgentRequest, AgentBoundDTO>(ENDPOINTS.BIND, params),

  /**
   * Unbind an agent from an entity
   * POST /api/service/v1/agent-bounds/unbind
   */
  unbind: (params: UnbindAgentRequest): Promise<void> =>
    apiPost<UnbindAgentRequest, void>(ENDPOINTS.UNBIND, params),

  /**
   * Query agents bound to an entity
   * POST /api/service/v1/agent-bounds/query-by-entity
   */
  queryByEntity: (params: QueryByEntityRequest): Promise<AgentBoundDTO[]> =>
    apiPost<QueryByEntityRequest, AgentBoundDTO[]>(ENDPOINTS.QUERY_BY_ENTITY, params),

  /**
   * Query entities bound to an agent
   * POST /api/service/v1/agent-bounds/query-by-agent
   */
  queryByAgent: (params: QueryByAgentRequest): Promise<AgentBoundDTO[]> =>
    apiPost<QueryByAgentRequest, AgentBoundDTO[]>(ENDPOINTS.QUERY_BY_AGENT, params),

  /**
   * Query topology hierarchy structure
   * POST /api/service/v1/agent-bounds/query-hierarchy
   */
  queryHierarchy: (params: QueryHierarchyRequest): Promise<HierarchyStructureDTO> =>
    apiPost<QueryHierarchyRequest, HierarchyStructureDTO>(ENDPOINTS.QUERY_HIERARCHY, params),
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Bind a Global Supervisor to a Topology
 */
export function bindGlobalSupervisor(topologyId: number, agentId: number): Promise<AgentBoundDTO> {
  return agentBoundsApi.bind({
    agentId,
    entityId: topologyId,
    entityType: 'TOPOLOGY',
  });
}

/**
 * Unbind Global Supervisor from a Topology
 */
export function unbindGlobalSupervisor(topologyId: number, agentId: number): Promise<void> {
  return agentBoundsApi.unbind({
    agentId,
    entityId: topologyId,
    entityType: 'TOPOLOGY',
  });
}

/**
 * Bind a Team Supervisor or Worker to a Node
 */
export function bindAgentToNode(nodeId: number, agentId: number): Promise<AgentBoundDTO> {
  return agentBoundsApi.bind({
    agentId,
    entityId: nodeId,
    entityType: 'NODE',
  });
}

/**
 * Unbind an agent from a Node
 */
export function unbindAgentFromNode(nodeId: number, agentId: number): Promise<void> {
  return agentBoundsApi.unbind({
    agentId,
    entityId: nodeId,
    entityType: 'NODE',
  });
}

/**
 * Get all agents bound to a Node
 */
export function getNodeAgents(nodeId: number, hierarchyLevel?: HierarchyLevel): Promise<AgentBoundDTO[]> {
  return agentBoundsApi.queryByEntity({
    entityType: 'NODE',
    entityId: nodeId,
    hierarchyLevel,
  });
}

/**
 * Get Global Supervisor for a Topology
 */
export function getTopologyGlobalSupervisor(topologyId: number): Promise<AgentBoundDTO[]> {
  return agentBoundsApi.queryByEntity({
    entityType: 'TOPOLOGY',
    entityId: topologyId,
    hierarchyLevel: 'GLOBAL_SUPERVISOR',
  });
}

/**
 * Get topology hierarchy structure (Global Supervisor + Teams)
 */
export function getTopologyHierarchy(topologyId: number): Promise<HierarchyStructureDTO> {
  return agentBoundsApi.queryHierarchy({ topologyId });
}
