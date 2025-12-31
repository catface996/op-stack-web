/**
 * useHierarchicalTeam Hook
 *
 * Fetch hierarchical agent team structure for a topology
 * Used in Diagnosis page to render agent team hierarchy
 * Feature: Diagnosis Page Integration
 * Updated for Feature 040: Uses unified agent-bounds API
 */

import { useState, useEffect, useCallback } from 'react';
import { agentBoundsApi, type HierarchyStructureDTO, type HierarchyAgentDTO, type HierarchyTeamDTO } from '../api/agentBounds';
import type { HierarchicalTeamDTO, HierarchicalAgentDTO, HierarchicalTeamNodeDTO } from '../api/types';

export interface UseHierarchicalTeamResult {
  /** Full hierarchical team data */
  team: HierarchicalTeamDTO | null;
  /** Global supervisor agent */
  globalSupervisor: HierarchicalAgentDTO | null;
  /** Node teams list */
  nodeTeams: HierarchicalTeamNodeDTO[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh data */
  refresh: () => void;
}

/**
 * Convert new API HierarchyAgentDTO to old HierarchicalAgentDTO format
 */
function toHierarchicalAgentDTO(agent: HierarchyAgentDTO | null): HierarchicalAgentDTO | null {
  if (!agent) return null;
  return {
    id: agent.id,
    boundId: agent.boundId,  // Important: boundId is used for SSE event matching
    name: agent.name,
    role: agent.role as HierarchicalAgentDTO['role'],
    hierarchyLevel: agent.hierarchyLevel as HierarchicalAgentDTO['hierarchyLevel'],
    specialty: agent.specialty,
    model: agent.model,
  };
}

/**
 * Convert new API HierarchyStructureDTO to old HierarchicalTeamDTO format
 */
function toHierarchicalTeamDTO(data: HierarchyStructureDTO): HierarchicalTeamDTO {
  return {
    topologyId: data.topologyId,
    topologyName: data.topologyName,
    globalSupervisor: toHierarchicalAgentDTO(data.globalSupervisor),
    teams: data.teams.map((team): HierarchicalTeamNodeDTO => ({
      nodeId: team.nodeId,
      nodeName: team.nodeName,
      supervisor: toHierarchicalAgentDTO(team.supervisor),
      workers: team.workers.map(w => toHierarchicalAgentDTO(w)!),
    })),
  };
}

/**
 * Hook for fetching hierarchical team structure for a topology
 * @param topologyId - Topology ID to fetch team for (null to skip fetch)
 */
export function useHierarchicalTeam(topologyId: number | null): UseHierarchicalTeamResult {
  const [team, setTeam] = useState<HierarchicalTeamDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!topologyId) {
      setTeam(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useHierarchicalTeam] Fetching team for topologyId:', topologyId);
      // Use new unified API: agent-bounds/query-hierarchy
      const result = await agentBoundsApi.queryHierarchy({ topologyId });
      console.log('[useHierarchicalTeam] Result:', result);
      // Convert to old format for backward compatibility
      setTeam(toHierarchicalTeamDTO(result));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch hierarchical team';
      setError(message);
      console.error('[useHierarchicalTeam] Error:', err);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [topologyId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const refresh = useCallback(() => {
    fetchTeam();
  }, [fetchTeam]);

  return {
    team,
    globalSupervisor: team?.globalSupervisor ?? null,
    nodeTeams: team?.teams ?? [],
    loading,
    error,
    refresh,
  };
}
