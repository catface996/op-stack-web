/**
 * useNodeMutations Hook
 *
 * Provides create, update, and delete operations for Nodes
 * Feature: 005-api-reintegration
 */

import { useState, useCallback } from 'react';
import { nodeApi } from '../api/nodes';
import type { NodeDTO } from '../api/types';
import { DEFAULT_OPERATOR_ID } from '../api/types';

export interface NodeFormData {
  name: string;
  description?: string;
  nodeTypeId: number;
  agentTeamId?: number;
  attributes?: string;
}

export interface UseNodeMutationsResult {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
  create: (data: NodeFormData) => Promise<NodeDTO | null>;
  update: (id: number, data: Partial<NodeFormData>, version: number) => Promise<NodeDTO | null>;
  remove: (id: number) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Hook for Node CRUD operations
 * T032: Uses dedicated /api/v1/nodes/* endpoints
 */
export function useNodeMutations(): UseNodeMutationsResult {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Create a new Node
   */
  const create = useCallback(async (data: NodeFormData): Promise<NodeDTO | null> => {
    setCreating(true);
    setError(null);

    try {
      const result = await nodeApi.create({
        operatorId: DEFAULT_OPERATOR_ID,
        name: data.name,
        description: data.description,
        nodeTypeId: data.nodeTypeId,
        agentTeamId: data.agentTeamId,
        attributes: data.attributes,
      });

      return result;
    } catch (err) {
      // Check for name conflict (409)
      if (err instanceof Error && err.message.includes('409')) {
        setError('A node with this name already exists.');
      } else {
        const message = err instanceof Error ? err.message : 'Failed to create node';
        setError(message);
      }
      console.error('Failed to create node:', err);
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  /**
   * Update an existing Node
   */
  const update = useCallback(async (
    id: number,
    data: Partial<NodeFormData>,
    version: number
  ): Promise<NodeDTO | null> => {
    setUpdating(true);
    setError(null);

    try {
      const result = await nodeApi.update({
        operatorId: DEFAULT_OPERATOR_ID,
        id,
        name: data.name,
        description: data.description,
        agentTeamId: data.agentTeamId,
        attributes: data.attributes,
        version, // Required for optimistic locking
      });

      return result;
    } catch (err) {
      // Handle version conflict (409) with user-friendly message
      if (err instanceof Error && err.message.includes('409')) {
        setError('This node was modified by another user. Please refresh and try again.');
      } else {
        const message = err instanceof Error ? err.message : 'Failed to update node';
        setError(message);
      }
      console.error('Failed to update node:', err);
      return null;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Delete a Node
   * T037: No confirmName required - simplified deletion
   */
  const remove = useCallback(async (id: number): Promise<boolean> => {
    setDeleting(true);
    setError(null);

    try {
      await nodeApi.delete({
        operatorId: DEFAULT_OPERATOR_ID,
        id,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete node';
      setError(message);
      console.error('Failed to delete node:', err);
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
