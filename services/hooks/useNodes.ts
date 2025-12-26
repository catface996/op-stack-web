/**
 * useNodes Hook
 *
 * Fetch node list with pagination, filtering and search support
 * Feature: 005-api-reintegration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { nodeApi } from '../api/nodes';
import type { NodeDTO, ResourceStatus, QueryNodesRequest } from '../api/types';

export interface NodeFilters {
  nodeTypeId?: number;
  status?: ResourceStatus;
  keyword?: string;
  topologyId?: number;  // T042: Filter by topology
}

export interface NodePagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UseNodesResult {
  nodes: NodeDTO[];
  pagination: NodePagination;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
}

const DEFAULT_PAGE_SIZE = 10;

/**
 * Hook for fetching node list
 * T031: New hook using nodeApi
 */
export function useNodes(filters: NodeFilters = {}): UseNodesResult {
  const [nodes, setNodes] = useState<NodeDTO[]>([]);
  const [pagination, setPagination] = useState<NodePagination>({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track current request for canceling stale requests
  const requestIdRef = useRef(0);

  const fetchNodes = useCallback(async (page: number, size: number) => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const params: QueryNodesRequest = {
      page,
      size,
    };

    // Only add filter params with values
    if (filters.nodeTypeId !== undefined) {
      params.nodeTypeId = filters.nodeTypeId;
    }
    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.keyword?.trim()) {
      params.keyword = filters.keyword.trim();
    }
    if (filters.topologyId !== undefined) {
      params.topologyId = filters.topologyId;
    }

    try {
      const result = await nodeApi.query(params);

      // Check if this is the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setNodes(result.content);
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

      const message = err instanceof Error ? err.message : 'Failed to fetch nodes';
      setError(message);
      console.error('Failed to fetch nodes:', err);
    } finally {
      // Check if this is the latest request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [filters.nodeTypeId, filters.status, filters.keyword, filters.topologyId]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchNodes(1, pagination.size);
  }, [filters.nodeTypeId, filters.status, filters.keyword, filters.topologyId, pagination.size, fetchNodes]);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchNodes(page, pagination.size);
  }, [pagination.size, fetchNodes]);

  const setSize = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, size, page: 1 }));
    fetchNodes(1, size);
  }, [fetchNodes]);

  const refresh = useCallback(() => {
    fetchNodes(pagination.page, pagination.size);
  }, [pagination.page, pagination.size, fetchNodes]);

  return {
    nodes,
    pagination,
    loading,
    error,
    refresh,
    setPage,
    setSize,
  };
}
