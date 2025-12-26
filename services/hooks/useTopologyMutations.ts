/**
 * useTopologyMutations Hook
 *
 * Provides create, update, and delete operations for Topologies
 * Feature: 004-topology-api-separation (updated from 003-topologies-management)
 */

import { useState, useCallback } from 'react';
import { topologyApi } from '../api/topology';
import type {
  TopologyDTO,
  TopologyFormData,
} from '../api/types';
import { DEFAULT_OPERATOR_ID } from '../api/types';

export interface UseTopologyMutationsResult {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
  create: (data: TopologyFormData) => Promise<TopologyDTO | null>;
  update: (id: number, data: TopologyFormData, version: number) => Promise<TopologyDTO | null>;
  remove: (id: number) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Hook for Topology CRUD operations
 * T017-T027: Uses dedicated /api/v1/topologies/* endpoints
 */
export function useTopologyMutations(): UseTopologyMutationsResult {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Create a new Topology
   * T017-T019: Uses topologyApi.create() - no resourceTypeId or isSubgraph needed
   */
  const create = useCallback(async (data: TopologyFormData): Promise<TopologyDTO | null> => {
    setCreating(true);
    setError(null);

    try {
      // Use dedicated topology create endpoint
      // No need for resourceTypeId or isSubgraph - backend handles automatically
      const result = await topologyApi.create({
        operatorId: DEFAULT_OPERATOR_ID,
        name: data.name,
        description: data.description || undefined,
      });

      return result;
    } catch (err) {
      // Check for name conflict (409)
      if (err instanceof Error && err.message.includes('409')) {
        setError('A topology with this name already exists.');
      } else {
        const message = err instanceof Error ? err.message : 'Failed to create topology';
        setError(message);
      }
      console.error('Failed to create topology:', err);
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  /**
   * Update an existing Topology
   * T021-T024: Uses topologyApi.update() with version for optimistic locking
   */
  const update = useCallback(async (
    id: number,
    data: TopologyFormData,
    version: number
  ): Promise<TopologyDTO | null> => {
    setUpdating(true);
    setError(null);

    try {
      // Use dedicated topology update endpoint
      // No need for isSubgraph attribute - backend handles automatically
      const result = await topologyApi.update({
        operatorId: DEFAULT_OPERATOR_ID,
        id,
        name: data.name,
        description: data.description || undefined,
        version, // Required for optimistic locking
      });

      return result;
    } catch (err) {
      // T024: Handle version conflict (409) with user-friendly message
      if (err instanceof Error && err.message.includes('409')) {
        setError('This topology was modified by another user. Please refresh and try again.');
      } else {
        const message = err instanceof Error ? err.message : 'Failed to update topology';
        setError(message);
      }
      console.error('Failed to update topology:', err);
      return null;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Delete a Topology
   * T025-T026: Uses topologyApi.delete() - no confirmName needed
   */
  const remove = useCallback(async (id: number): Promise<boolean> => {
    setDeleting(true);
    setError(null);

    try {
      // Use dedicated topology delete endpoint
      // No confirmName needed - just id and operatorId
      await topologyApi.delete({
        operatorId: DEFAULT_OPERATOR_ID,
        id,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete topology';
      setError(message);
      console.error('Failed to delete topology:', err);
      return false;
    } finally {
      setDeleting(false);
    }
  }, []);

  return {
    creating,
    updating,
    deleting,
    error,
    create,
    update,
    remove,
    clearError,
  };
}
