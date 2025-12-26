/**
 * useResources Hook
 *
 * Fetch resource list with pagination, filtering and search support
 * Feature: 001-resource-api-integration
 * Updated: 005-api-reintegration - Now uses nodeApi internally
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { nodeApi } from '../api/nodes';
import type { ResourceDTO, NodeDTO, ResourceStatus, QueryNodesRequest } from '../api/types';

export interface ResourceFilters {
  resourceTypeId?: number;  // Maps to nodeTypeId in new API
  status?: ResourceStatus;
  keyword?: string;
  topologyId?: number;  // T043: New filter for topology membership
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
 * Convert NodeDTO to ResourceDTO for backward compatibility
 * T033: Adapter function to maintain existing component contracts
 */
function nodeToResource(node: NodeDTO): ResourceDTO {
  return {
    id: node.id,
    name: node.name,
    description: node.description,
    resourceTypeId: node.nodeTypeId,
    resourceTypeName: node.nodeTypeName,
    resourceTypeCode: node.nodeTypeCode,
    status: node.status,
    statusDisplay: node.statusDisplay,
    attributes: node.attributes,
    version: node.version,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    createdBy: node.createdBy,
  };
}

/**
 * Hook for fetching resource list
 * T033: Now uses nodeApi internally with backward-compatible interface
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

    // T033: Build QueryNodesRequest from ResourceFilters
    const params: QueryNodesRequest = {
      page,
      size,
    };

    // Map resourceTypeId to nodeTypeId
    if (filters.resourceTypeId !== undefined) {
      params.nodeTypeId = filters.resourceTypeId;
    }
    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.keyword?.trim()) {
      params.keyword = filters.keyword.trim();
    }
    // T043: Support topology filter
    if (filters.topologyId !== undefined) {
      params.topologyId = filters.topologyId;
    }

    try {
      // T033: Use nodeApi instead of resourceApi
      const result = await nodeApi.query(params);

      // Check if this is the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      // Convert NodeDTO to ResourceDTO for backward compatibility
      setResources(result.content.map(nodeToResource));
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
  }, [filters.resourceTypeId, filters.status, filters.keyword, filters.topologyId]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchResources(1, pagination.size);
  }, [filters.resourceTypeId, filters.status, filters.keyword, filters.topologyId, pagination.size, fetchResources]);

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
