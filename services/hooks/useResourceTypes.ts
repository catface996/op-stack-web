/**
 * useResourceTypes Hook
 *
 * Fetch and cache resource type list
 * Feature: 001-resource-api-integration
 * Updated: 005-api-reintegration - Now uses nodeApi.getTypes() internally
 */

import { useState, useEffect, useCallback } from 'react';
import { nodeApi } from '../api/nodes';
import type { ResourceTypeDTO, NodeTypeDTO } from '../api/types';

export interface UseResourceTypesResult {
  types: ResourceTypeDTO[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Convert NodeTypeDTO to ResourceTypeDTO for backward compatibility
 * T039: Adapter function to maintain existing component contracts
 */
function nodeTypeToResourceType(nodeType: NodeTypeDTO): ResourceTypeDTO {
  return {
    id: nodeType.id,
    code: nodeType.code,
    name: nodeType.name,
    description: nodeType.description || '',
    icon: nodeType.icon || '',
    systemPreset: true,  // All node types are system-managed
  };
}

/**
 * Hook for fetching resource type list
 * T039: Now uses nodeApi.getTypes() internally with backward-compatible interface
 */
export function useResourceTypes(): UseResourceTypesResult {
  const [types, setTypes] = useState<ResourceTypeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // T039: Use nodeApi instead of resourceApi
      const result = await nodeApi.getTypes();
      // Convert NodeTypeDTO to ResourceTypeDTO for backward compatibility
      setTypes(result.map(nodeTypeToResourceType));
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
