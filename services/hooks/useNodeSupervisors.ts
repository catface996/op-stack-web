/**
 * useNodeSupervisors Hook
 *
 * Fetch team supervisors bound to a specific node
 * Feature: 013-agent-config-page
 * Updated for Feature 040: Uses unified agent-bounds API (query-by-entity)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getNodeAgents, type AgentBoundDTO } from '../api/agentBounds';

/**
 * Supervisor info from agent-bounds API
 */
export interface NodeSupervisorInfo {
  /** Supervisor agent (converted from AgentBoundDTO) */
  supervisor: {
    id: number;
    boundId: number;
    name: string;
    role: string;
    hierarchyLevel: string;
  };
  /** Bound relationship ID */
  boundId: number;
  /** Display context (entity name if available) */
  topologyId: number;
  /** Topology name for display (not available from query-by-entity, use generic label) */
  topologyName: string;
}

export interface UseNodeSupervisorsResult {
  /** List of supervisors bound to this node */
  supervisors: NodeSupervisorInfo[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh the data */
  refresh: () => void;
}

/**
 * Hook for fetching team supervisors bound to a specific node
 * Uses query-by-entity API which returns agents directly bound to the node
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
      // Use query-by-entity API to get supervisors directly bound to this node
      const boundAgents = await getNodeAgents(nodeId, 'TEAM_SUPERVISOR');

      if (currentRequestId !== requestIdRef.current) return;

      // Convert AgentBoundDTO to NodeSupervisorInfo
      const supervisorInfos: NodeSupervisorInfo[] = boundAgents.map((agent: AgentBoundDTO) => ({
        supervisor: {
          id: agent.agentId,
          boundId: agent.id,
          name: agent.agentName,
          role: agent.agentRole,
          hierarchyLevel: agent.hierarchyLevel,
        },
        boundId: agent.id,
        topologyId: agent.entityId, // This is the node ID, not topology ID
        topologyName: agent.entityName || 'Node Supervisor',
      }));

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
