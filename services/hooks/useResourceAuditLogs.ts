/**
 * useResourceAuditLogs Hook
 *
 * Fetch resource audit logs
 * Feature: 001-resource-api-integration
 */

import { useState, useEffect, useCallback } from 'react';
import { resourceApi } from '../api/resources';
import type { ResourceAuditLogDTO } from '../api/types';

export interface Pagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UseResourceAuditLogsResult {
  logs: ResourceAuditLogDTO[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setPage: (page: number) => void;
}

const DEFAULT_PAGE_SIZE = 10;

/**
 * Hook for fetching resource audit logs
 * Note: Auto-fetch disabled - call refresh() manually to load logs
 */
export function useResourceAuditLogs(resourceId: number | undefined): UseResourceAuditLogsResult {
  const [logs, setLogs] = useState<ResourceAuditLogDTO[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (page: number) => {
    if (!resourceId) {
      setLogs([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await resourceApi.getAuditLogs({
        resourceId,
        page,
        size: DEFAULT_PAGE_SIZE,
      });

      setLogs(result.content);
      setPagination({
        page: result.page,
        size: result.size,
        totalElements: result.totalElements,
        totalPages: result.totalPages,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit logs';
      setError(message);
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [resourceId]);

  // Auto-fetch disabled - logs will be loaded when user switches to history tab
  // useEffect(() => {
  //   if (resourceId) {
  //     fetchLogs(1);
  //   }
  // }, [resourceId, fetchLogs]);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchLogs(page);
  }, [fetchLogs]);

  const refresh = useCallback(() => {
    fetchLogs(pagination.page);
  }, [pagination.page, fetchLogs]);

  return {
    logs,
    pagination,
    loading,
    error,
    refresh,
    setPage,
  };
}
