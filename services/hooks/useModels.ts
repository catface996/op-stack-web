/**
 * useModels Hook
 *
 * Fetch and manage model list with pagination, loading, error states
 * Feature: 008-model-api-integration
 */

import { useState, useEffect, useCallback } from 'react';
import { listModels } from '../api/models';
import type { ModelDTO, ModelListRequest } from '../api/types';

const DEFAULT_PAGE_SIZE = 8;

interface UseModelsOptions {
  page?: number;
  size?: number;
  isActiveFilter?: boolean;
}

interface UseModelsResult {
  models: ModelDTO[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  setPage: (page: number) => void;
  setIsActiveFilter: (filter: boolean | undefined) => void;
  isActiveFilter: boolean | undefined;
  refresh: () => void;
}

export function useModels(options: UseModelsOptions = {}): UseModelsResult {
  const [models, setModels] = useState<ModelDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options.page ?? 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(options.isActiveFilter);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const request: ModelListRequest = {
        page,
        size: options.size ?? DEFAULT_PAGE_SIZE,
      };

      // Only add is_active filter if explicitly set (not undefined)
      if (isActiveFilter !== undefined) {
        request.is_active = isActiveFilter;
      }

      const response = await listModels(request);

      // Constitution: API Pagination Response Format - use content/totalElements/totalPages
      setModels(response.content || []);
      setTotal(response.totalElements || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load models';
      setError(message);
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [page, isActiveFilter, options.size]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const refresh = useCallback(() => {
    fetchModels();
  }, [fetchModels]);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSetIsActiveFilter = useCallback((filter: boolean | undefined) => {
    setIsActiveFilter(filter);
    setPage(1); // Reset to first page when filter changes
  }, []);

  return {
    models,
    loading,
    error,
    page,
    totalPages,
    total,
    setPage: handleSetPage,
    setIsActiveFilter: handleSetIsActiveFilter,
    isActiveFilter,
    refresh,
  };
}
