/**
 * API Services Index
 * Feature: 001-resource-api-integration
 * Feature: 002-topology-api
 * Feature: 005-api-reintegration
 * Feature: 007-prompt-template-api
 * Feature: 008-model-api-integration
 * Feature: 012-agent-api-integration
 * Feature: 040-agent-bound-refactor
 */

export * from './types';
export * from './client';
export * from './resources';
export * from './topology';
export * from './nodes';
export * from './prompt-templates';
export * from './template-usages';
export * from './models';
export * from './agents';
// Re-export agentBounds with explicit names to avoid conflicts with nodes.ts
export {
  agentBoundsApi,
  bindGlobalSupervisor,
  unbindGlobalSupervisor,
  bindAgentToNode,
  unbindAgentFromNode,
  getNodeAgents,
  getTopologyGlobalSupervisor,
  getTopologyHierarchy,
  type EntityType,
  type HierarchyLevel,
  type BindAgentRequest as AgentBoundsBindRequest,
  type UnbindAgentRequest as AgentBoundsUnbindRequest,
  type QueryByEntityRequest,
  type QueryByAgentRequest,
  type QueryHierarchyRequest,
  type AgentBoundDTO,
  type HierarchyAgentDTO,
  type HierarchyTeamDTO,
  type HierarchyStructureDTO,
} from './agentBounds';
