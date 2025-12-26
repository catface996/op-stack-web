/**
 * useTopology Hook
 *
 * Fetch topology graph data for a subgraph and transform to D3 format
 * Feature: 002-topology-api
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { topologyApi, transformToD3 } from '../api/topology';
import type { D3Topology, D3TopologyNode, D3TopologyLink } from '../api/topology';
import type { TopologyQueryResponse, TopologyBoundary } from '../api/types';

export interface UseTopologyResult {
  /** D3-compatible topology data */
  topology: D3Topology | null;
  /** Raw API response data */
  rawData: TopologyQueryResponse | null;
  /** Topology boundaries for visualization */
  boundaries: TopologyBoundary[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Refetch topology data */
  refetch: () => void;
}

export interface UseTopologyOptions {
  /** How many levels of nested subgraphs to include */
  depth?: number;
  /** Whether to include relationships in the query */
  includeRelationships?: boolean;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
}

const DEFAULT_OPTIONS: UseTopologyOptions = {
  depth: 1,
  includeRelationships: true,
  autoFetch: true,
};

/**
 * Hook for fetching topology graph data
 *
 * @param subgraphId - The ID of the subgraph to fetch topology for
 * @param options - Query options
 */
export function useTopology(
  subgraphId: number | null,
  options: UseTopologyOptions = {}
): UseTopologyResult {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const [topology, setTopology] = useState<D3Topology | null>(null);
  const [rawData, setRawData] = useState<TopologyQueryResponse | null>(null);
  const [boundaries, setBoundaries] = useState<TopologyBoundary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track current request to prevent stale updates
  const requestIdRef = useRef(0);

  const fetchTopology = useCallback(async () => {
    console.log('[useTopology] fetchTopology called with subgraphId:', subgraphId);

    if (subgraphId === null) {
      console.log('[useTopology] subgraphId is null, skipping fetch');
      setTopology(null);
      setRawData(null);
      setBoundaries([]);
      setLoading(false);
      setError(null);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    console.log('[useTopology] Making API call to queryGraph with:', {
      topologyId: subgraphId,
      depth: mergedOptions.depth,
      includeRelationships: mergedOptions.includeRelationships,
    });

    try {
      const response = await topologyApi.queryGraph({
        topologyId: subgraphId,  // NEW: Uses topologyId parameter
        depth: mergedOptions.depth,
        includeRelationships: mergedOptions.includeRelationships,
      });
      console.log('[useTopology] API response:', response);

      // Check if this is still the current request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      // Store raw data
      setRawData(response);

      // Transform to D3 format
      const d3Topology = transformToD3(response);
      setTopology(d3Topology);

      // Store boundaries for subgraph visualization (backend uses subgraphBoundaries field)
      setBoundaries(response.subgraphBoundaries || response.boundaries || []);

    } catch (err) {
      // Check if this is still the current request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const message = err instanceof Error ? err.message : 'Failed to fetch topology data';
      setError(message);
      console.error('Failed to fetch topology:', err);
    } finally {
      // Check if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [subgraphId, mergedOptions.depth, mergedOptions.includeRelationships]);

  // Auto-fetch on mount and when subgraphId changes
  useEffect(() => {
    if (mergedOptions.autoFetch) {
      fetchTopology();
    }
  }, [fetchTopology, mergedOptions.autoFetch]);

  return {
    topology,
    rawData,
    boundaries,
    loading,
    error,
    refetch: fetchTopology,
  };
}

// Re-export types for convenience
export type { D3Topology, D3TopologyNode, D3TopologyLink };
