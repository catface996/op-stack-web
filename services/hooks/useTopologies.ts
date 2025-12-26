/**
 * useTopologies Hook
 *
 * Fetch topology list using dedicated /api/v1/topologies/query endpoint
 * Feature: 004-topology-api-separation (updated from 003-topologies-management)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { topologyApi } from '../api/topology';
import type {
  TopologyDTO,
  TopologyListItem,
} from '../api/types';
import { parseTopologyAttributes as parseAttrs, DEFAULT_OPERATOR_ID } from '../api/types';

export interface TopologyFilters {
  keyword?: string;
}

export interface TopologyPagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UseTopologiesResult {
  topologies: TopologyListItem[];
  pagination: TopologyPagination;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  setKeyword: (keyword: string) => void;
}

/**
 * Convert TopologyDTO to TopologyListItem
 * T014: Updated adapter function for TopologyDTO
 */
export function topologyDtoToListItem(topology: TopologyDTO): TopologyListItem {
  const attrs = parseAttrs(topology.attributes);
  return {
    id: topology.id,
    name: topology.name,
    description: topology.description || '',
    memberCount: topology.memberCount, // Direct from API, no parsing needed
    tags: attrs.tags,
    templateIds: attrs.templateIds,
    status: topology.status,
    createdAt: topology.createdAt,
    updatedAt: topology.updatedAt,
    version: topology.version,
    resourceTypeId: 0, // Not applicable for TopologyDTO
  };
}

/**
 * @deprecated Use topologyDtoToListItem instead
 * Kept for backward compatibility during migration
 */
export function resourceToTopologyListItem(resource: {
  id: number;
  name: string;
  description: string | null;
  attributes: string | null;
  status: 'RUNNING' | 'STOPPED' | 'MAINTENANCE' | 'OFFLINE';
  createdAt: string;
  updatedAt: string;
  version: number;
  resourceTypeId?: number;
  memberCount?: number;
}): TopologyListItem {
  const attrs = parseAttrs(resource.attributes);
  return {
    id: resource.id,
    name: resource.name,
    description: resource.description || '',
    memberCount: resource.memberCount ?? 0,
    tags: attrs.tags,
    templateIds: attrs.templateIds,
    status: resource.status,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    version: resource.version,
    resourceTypeId: resource.resourceTypeId ?? 0,
  };
}

const DEFAULT_PAGE_SIZE = 10;

/**
 * Hook for fetching topology list
 * T012: Uses topologyApi.query() instead of resourceApi.list()
 * T013: No client-side isSubgraph filtering needed
 */
export function useTopologies(initialFilters: TopologyFilters = {}): UseTopologiesResult {
  const [topologies, setTopologies] = useState<TopologyListItem[]>([]);
  const [pagination, setPagination] = useState<TopologyPagination>({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeywordState] = useState(initialFilters.keyword || '');

  // Use ref to track current request for canceling stale requests
  const requestIdRef = useRef(0);

  const fetchTopologies = useCallback(async (page: number, size: number, searchKeyword: string) => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // Use dedicated topology API endpoint
      // No client-side filtering needed - backend returns only topologies
      const result = await topologyApi.query({
        operatorId: DEFAULT_OPERATOR_ID,
        page,
        size,
        name: searchKeyword.trim() || undefined,
      });

      // Check if this is the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      // Convert TopologyDTO to TopologyListItem
      const topologyItems = result.content.map(topologyDtoToListItem);

      setTopologies(topologyItems);
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
      console.error('Failed to fetch topologies:', err);
    } finally {
      // Check if this is the latest request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchTopologies(1, pagination.size, keyword);
  }, [keyword, pagination.size, fetchTopologies]);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchTopologies(page, pagination.size, keyword);
  }, [pagination.size, keyword, fetchTopologies]);

  const setSize = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, size, page: 1 }));
    fetchTopologies(1, size, keyword);
  }, [keyword, fetchTopologies]);

  const setKeyword = useCallback((newKeyword: string) => {
    setKeywordState(newKeyword);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const refresh = useCallback(() => {
    fetchTopologies(pagination.page, pagination.size, keyword);
  }, [pagination.page, pagination.size, keyword, fetchTopologies]);

  return {
    topologies,
    pagination,
    loading,
    error,
    refresh,
    setPage,
    setSize,
    setKeyword,
  };
}
