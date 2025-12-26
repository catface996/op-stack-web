/**
 * useNodeTypes Hook
 *
 * Fetch and cache node type list
 * Feature: 005-api-reintegration
 */

import { useState, useEffect, useCallback } from 'react';
import { nodeApi } from '../api/nodes';
import type { NodeTypeDTO } from '../api/types';

export interface UseNodeTypesResult {
  types: NodeTypeDTO[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook for fetching node type list
 * T038: Uses nodeApi.getTypes()
 */
export function useNodeTypes(): UseNodeTypesResult {
  const [types, setTypes] = useState<NodeTypeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await nodeApi.getTypes();
      setTypes(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch node types';
      setError(message);
      console.error('Failed to fetch node types:', err);
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
