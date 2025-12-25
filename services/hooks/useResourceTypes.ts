/**
 * useResourceTypes Hook
 *
 * Fetch and cache resource type list
 * Feature: 001-resource-api-integration
 */

import { useState, useEffect, useCallback } from 'react';
import { resourceApi } from '../api/resources';
import type { ResourceTypeDTO } from '../api/types';

export interface UseResourceTypesResult {
  types: ResourceTypeDTO[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook for fetching resource type list
 */
export function useResourceTypes(): UseResourceTypesResult {
  const [types, setTypes] = useState<ResourceTypeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await resourceApi.getTypes({});
      setTypes(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch resource types';
      setError(message);
      console.error('Failed to fetch resource types:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  return {
    types,
    loading,
    error,
    refresh: fetchTypes,
  };
}
