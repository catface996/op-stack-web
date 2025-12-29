/**
 * useHierarchicalTeam Hook
 *
 * Fetch hierarchical agent team structure for a topology
 * Used in Diagnosis page to render agent team hierarchy
 * Feature: Diagnosis Page Integration
 */

import { useState, useEffect, useCallback } from 'react';
import { topologyApi } from '../api/topology';
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
      const result = await topologyApi.queryHierarchicalTeam({ topologyId });
      console.log('[useHierarchicalTeam] Result:', result);
      setTeam(result);
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
