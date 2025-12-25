/**
 * useMemberMutations Hook
 *
 * Provides add and remove operations for topology members
 * Feature: 003-topologies-management
 */

import { useState, useCallback } from 'react';
import { topologyApi } from '../api/topology';
import type { MembersAddResponse, CycleDetectionResponse } from '../api/types';

export interface UseMemberMutationsResult {
  adding: boolean;
  removing: boolean;
  checkingCycle: boolean;
  error: string | null;
  cycleError: CycleDetectionResponse | null;
  add: (subgraphId: number, memberIds: number[]) => Promise<MembersAddResponse | null>;
  remove: (subgraphId: number, memberIds: number[]) => Promise<boolean>;
  checkCycle: (subgraphId: number, memberIds: number[]) => Promise<CycleDetectionResponse>;
  clearError: () => void;
  clearCycleError: () => void;
}

/**
 * Hook for member add/remove operations
 */
export function useMemberMutations(): UseMemberMutationsResult {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [checkingCycle, setCheckingCycle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cycleError, setCycleError] = useState<CycleDetectionResponse | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCycleError = useCallback(() => {
    setCycleError(null);
  }, []);

  /**
   * Check for circular references before adding members
   */
  const checkCycle = useCallback(async (
    subgraphId: number,
    memberIds: number[]
  ): Promise<CycleDetectionResponse> => {
    setCheckingCycle(true);
    setCycleError(null);

    try {
      const result = await topologyApi.detectCycles({
        resourceId: subgraphId,  // API uses resourceId parameter
        candidateMemberIds: memberIds,
      });

      if (result.hasCycle) {
        setCycleError(result);
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check for cycles';
      setError(message);
      console.error('Failed to check for cycles:', err);
      // Return a safe default indicating we couldn't verify
      return { hasCycle: false };
    } finally {
      setCheckingCycle(false);
    }
  }, []);

  /**
   * Add members to a topology
   */
  const add = useCallback(async (
    subgraphId: number,
    memberIds: number[]
  ): Promise<MembersAddResponse | null> => {
    if (memberIds.length === 0) {
      return null;
    }

    setAdding(true);
    setError(null);

    try {
      const result = await topologyApi.addMembers({
        resourceId: subgraphId,  // API uses resourceId parameter
        memberIds,
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add members';
      setError(message);
      console.error('Failed to add members:', err);
      return null;
    } finally {
      setAdding(false);
    }
  }, []);

  /**
   * Remove members from a topology
   */
  const remove = useCallback(async (
    subgraphId: number,
    memberIds: number[]
  ): Promise<boolean> => {
    if (memberIds.length === 0) {
      return false;
    }

    setRemoving(true);
    setError(null);

    try {
      await topologyApi.removeMembers({
        resourceId: subgraphId,  // API uses resourceId parameter
        memberIds,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove members';
      setError(message);
      console.error('Failed to remove members:', err);
      return false;
    } finally {
      setRemoving(false);
    }
  }, []);

  return {
    adding,
    removing,
    checkingCycle,
    error,
    cycleError,
    add,
    remove,
    checkCycle,
    clearError,
    clearCycleError,
  };
}
