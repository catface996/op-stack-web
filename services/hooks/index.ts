/**
 * Hooks Index
 * Feature: 001-resource-api-integration
 * Feature: 002-topology-api
 * Feature: 003-topologies-management
 */

export { useResources, type ResourceFilters, type UseResourcesResult } from './useResources';
export { useResourceTypes, type UseResourceTypesResult } from './useResourceTypes';
export { useResourceAuditLogs, type UseResourceAuditLogsResult, type Pagination } from './useResourceAuditLogs';
export { useTopology, type UseTopologyResult, type UseTopologyOptions } from './useTopology';

// Topologies Management (Feature: 003)
export {
  useTopologies,
  resourceToTopologyListItem,
  type TopologyFilters,
  type TopologyPagination,
  type UseTopologiesResult,
} from './useTopologies';
export { useTopologyMutations, type UseTopologyMutationsResult } from './useTopologyMutations';
export { useMembers, type MembersPagination, type UseMembersResult } from './useMembers';
export { useMemberMutations, type UseMemberMutationsResult } from './useMemberMutations';
