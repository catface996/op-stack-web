/**
 * useResources Hook
 *
 * Fetch resource list with pagination, filtering and search support
 * Feature: 001-resource-api-integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { resourceApi } from '../api/resources';
import type { ResourceDTO, ResourceStatus, ListResourcesRequest } from '../api/types';

export interface ResourceFilters {
  resourceTypeId?: number;
  status?: ResourceStatus;
  keyword?: string;
}

export interface Pagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UseResourcesResult {
  resources: ResourceDTO[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
}

const DEFAULT_PAGE_SIZE = 10;

/**
 * Hook for fetching resource list
 */
export function useResources(filters: ResourceFilters = {}): UseResourcesResult {
  const [resources, setResources] = useState<ResourceDTO[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track current request for canceling stale requests
  const requestIdRef = useRef(0);

  const fetchResources = useCallback(async (page: number, size: number) => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const params: ListResourcesRequest = {
      page,
      size,
    };

    // Only add filter params with values
    if (filters.resourceTypeId !== undefined) {
      params.resourceTypeId = filters.resourceTypeId;
    }
    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.keyword?.trim()) {
      params.keyword = filters.keyword.trim();
    }

    try {
      const result = await resourceApi.list(params);

      // Check if this is the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setResources(result.content);
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

      const message = err instanceof Error ? err.message : 'Failed to fetch resources';
      setError(message);
      console.error('Failed to fetch resources:', err);
    } finally {
      // Check if this is the latest request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [filters.resourceTypeId, filters.status, filters.keyword]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchResources(1, pagination.size);
  }, [filters.resourceTypeId, filters.status, filters.keyword, pagination.size, fetchResources]);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchResources(page, pagination.size);
  }, [pagination.size, fetchResources]);

  const setSize = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, size, page: 1 }));
    fetchResources(1, size);
  }, [fetchResources]);

  const refresh = useCallback(() => {
    fetchResources(pagination.page, pagination.size);
  }, [pagination.page, pagination.size, fetchResources]);

  return {
    resources,
    pagination,
    loading,
    error,
    refresh,
    setPage,
    setSize,
  };
}
