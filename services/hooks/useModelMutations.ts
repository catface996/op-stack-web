/**
 * useModelMutations Hook
 *
 * CRUD mutation operations for models with loading and error states
 * Feature: 008-model-api-integration
 */

import { useState, useCallback } from 'react';
import { createModel, updateModel, deleteModel } from '../api/models';
import type { ModelDTO, ModelCreateRequest, ModelUpdateRequest, ModelDeleteRequest } from '../api/types';

interface UseModelMutationsResult {
  createModel: (request: ModelCreateRequest, onSuccess?: () => void) => Promise<ModelDTO | null>;
  updateModel: (request: ModelUpdateRequest, onSuccess?: () => void) => Promise<ModelDTO | null>;
  deleteModel: (request: ModelDeleteRequest, onSuccess?: () => void) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useModelMutations(): UseModelMutationsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleCreateModel = useCallback(async (
    request: ModelCreateRequest,
    onSuccess?: () => void
  ): Promise<ModelDTO | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await createModel(request);
      onSuccess?.();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create model';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateModel = useCallback(async (
    request: ModelUpdateRequest,
    onSuccess?: () => void
  ): Promise<ModelDTO | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateModel(request);
      onSuccess?.();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update model';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteModel = useCallback(async (
    request: ModelDeleteRequest,
    onSuccess?: () => void
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await deleteModel(request);
      onSuccess?.();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete model';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createModel: handleCreateModel,
    updateModel: handleUpdateModel,
    deleteModel: handleDeleteModel,
    loading,
    error,
    clearError,
  };
}
