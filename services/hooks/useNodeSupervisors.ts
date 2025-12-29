/**
 * useNodeSupervisors Hook
 *
 * Fetch team supervisors for a specific node from all topologies it belongs to
 * Feature: 013-agent-config-page
 * Updated for Feature 040: Uses unified agent-bounds API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { topologyApi } from '../api/topology';
import { agentBoundsApi, type HierarchyAgentDTO } from '../api/agentBounds';

/**
 * Supervisor with topology context
 */
export interface NodeSupervisorInfo {
  /** Supervisor agent */
  supervisor: HierarchyAgentDTO;
  /** Topology ID this supervisor belongs to */
  topologyId: number;
  /** Topology name for display */
  topologyName: string;
}

export interface UseNodeSupervisorsResult {
  /** List of supervisors from all topologies */
  supervisors: NodeSupervisorInfo[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh the data */
  refresh: () => void;
}

/**
 * Hook for fetching team supervisors for a specific node
 * @param nodeId - The node ID to find supervisors for
 */
export function useNodeSupervisors(nodeId: number | null): UseNodeSupervisorsResult {
  const [supervisors, setSupervisors] = useState<NodeSupervisorInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track request ID to prevent stale updates
  const requestIdRef = useRef(0);

  const fetchSupervisors = useCallback(async () => {
    if (nodeId === null) {
      setSupervisors([]);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get all topologies that contain this node
      const topologyResult = await topologyApi.query({
        operatorId: 1,
        nodeId,
        page: 1,
        size: 100, // Get all topologies (assuming a node won't be in more than 100)
      });

      if (currentRequestId !== requestIdRef.current) return;

      const topologies = topologyResult.content;

      if (topologies.length === 0) {
        setSupervisors([]);
        setLoading(false);
        return;
      }

      // Step 2: For each topology, query the hierarchy using new API
      const supervisorInfos: NodeSupervisorInfo[] = [];

      for (const topology of topologies) {
        try {
          // Use new unified API: agent-bounds/query-hierarchy
          const hierarchyData = await agentBoundsApi.queryHierarchy({
            topologyId: topology.id,
          });

          if (currentRequestId !== requestIdRef.current) return;

          // Find this node's team in the hierarchical data
          const nodeTeam = hierarchyData.teams.find(team => team.nodeId === nodeId);

          if (nodeTeam && nodeTeam.supervisor) {
            supervisorInfos.push({
              supervisor: nodeTeam.supervisor,
              topologyId: topology.id,
              topologyName: hierarchyData.topologyName || topology.name,
            });
          }
        } catch (err) {
          // Continue with other topologies if one fails
          console.warn(`Failed to fetch hierarchy for topology ${topology.id}:`, err);
        }
      }

      if (currentRequestId !== requestIdRef.current) return;

      setSupervisors(supervisorInfos);
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;

      const message = err instanceof Error ? err.message : 'Failed to fetch supervisors';
      setError(message);
      console.error('Failed to fetch node supervisors:', err);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [nodeId]);

  // Fetch on mount and when nodeId changes
  useEffect(() => {
    fetchSupervisors();
  }, [fetchSupervisors]);

  return {
    supervisors,
    loading,
    error,
    refresh: fetchSupervisors,
  };
}
