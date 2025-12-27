/**
 * useTools Hook
 *
 * Fetch and manage tool list with pagination, loading, error states
 * Feature: 010-tools-management
 */

import { useState, useEffect, useCallback } from 'react';
import { listTools } from '../api/tools';
import type { ToolDTO, ToolListRequest, ToolStatus } from '../../types';

const DEFAULT_PAGE_SIZE = 8;

interface UseToolsOptions {
  page?: number;
  size?: number;
  status?: ToolStatus;
  categoryId?: string;
  search?: string;
}

interface UseToolsResult {
  tools: ToolDTO[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  setPage: (page: number) => void;
  setStatus: (status: ToolStatus | undefined) => void;
  setSearch: (search: string) => void;
  status: ToolStatus | undefined;
  search: string;
  refresh: () => void;
}

export function useTools(options: UseToolsOptions = {}): UseToolsResult {
  const [tools, setTools] = useState<ToolDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options.page ?? 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<ToolStatus | undefined>(options.status);
  const [search, setSearch] = useState(options.search ?? '');

  const fetchTools = useCallback(async () => {
    setLoading(true);
    setError(null);

    const pageSize = options.size ?? DEFAULT_PAGE_SIZE;

    try {
      // Constitution: API Pagination Request Format - use "size" not "page_size"
      const request: ToolListRequest = {
        page: page,
        size: pageSize,
      };

      // Only add optional filters if explicitly set
      if (status !== undefined) {
        request.status = status;
      }
      if (search.trim()) {
        request.search = search.trim();
      }
      if (options.categoryId) {
        request.category_id = options.categoryId;
      }

      console.log('[useTools] Fetching tools with request:', request);
      const response = await listTools(request);
      console.log('[useTools] Response:', response);

      // Constitution: API Pagination Response Format - extract from data.content
      // Check for success via code === 0 or success === true
      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess && response.data) {
        setTools(response.data.content || []);
        setTotal(response.data.totalElements || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setError(response.message || 'Failed to load tool list');
        setTools([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tool list';
      setError(message);
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, search, options.size, options.categoryId]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const refresh = useCallback(() => {
    fetchTools();
  }, [fetchTools]);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSetStatus = useCallback((newStatus: ToolStatus | undefined) => {
    setStatus(newStatus);
    setPage(1); // Reset to first page when filter changes
  }, []);

  const handleSetSearch = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1); // Reset to first page when search changes
  }, []);

  return {
    tools,
    loading,
    error,
    page,
    totalPages,
    total,
    setPage: handleSetPage,
    setStatus: handleSetStatus,
    setSearch: handleSetSearch,
    status,
    search,
    refresh,
  };
}
