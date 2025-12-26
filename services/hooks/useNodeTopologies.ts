/**
 * useNodeTopologies Hook
 *
 * Fetch topologies that contain a specific node
 * Feature: 005-api-reintegration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { topologyApi } from '../api/topology';
import type { TopologyDTO } from '../api/types';

export interface NodeTopologiesPagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UseNodeTopologiesResult {
  topologies: TopologyDTO[];
  pagination: NodeTopologiesPagination;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setPage: (page: number) => void;
}

const DEFAULT_PAGE_SIZE = 10;

/**
 * Hook for fetching topologies that contain a specific node
 * @param nodeId - The node ID to find topologies for
 */
export function useNodeTopologies(nodeId: number | null): UseNodeTopologiesResult {
  const [topologies, setTopologies] = useState<TopologyDTO[]>([]);
  const [pagination, setPagination] = useState<NodeTopologiesPagination>({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track current request for canceling stale requests
  const requestIdRef = useRef(0);

  const fetchTopologies = useCallback(async (page: number, size: number) => {
    if (nodeId === null) {
      setTopologies([]);
      setPagination({ page: 1, size, totalElements: 0, totalPages: 0 });
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await topologyApi.query({
        operatorId: 1,
        nodeId,
        page,
        size,
      });

      // Check if this is the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setTopologies(result.content);
      setPagination({
        page: result.page,
        size: result.size,
        totalElements: result.totalElements,
        totalPages: result.totalPages,
      });
    } catch (err) {
      // Check if this is the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const message = err instanceof Error ? err.message : 'Failed to fetch topologies';
      setError(message);
      console.error('Failed to fetch node topologies:', err);
    } finally {
      // Check if this is the latest request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [nodeId]);

  // Fetch on mount and when nodeId changes
  useEffect(() => {
    fetchTopologies(1, pagination.size);
  }, [nodeId, fetchTopologies]);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchTopologies(page, pagination.size);
  }, [pagination.size, fetchTopologies]);

  const refresh = useCallback(() => {
    fetchTopologies(pagination.page, pagination.size);
  }, [pagination.page, pagination.size, fetchTopologies]);

  return {
    topologies,
    pagination,
    loading,
    error,
    refresh,
    setPage,
  };
}
