/**
 * useMemberMutations Hook
 *
 * Provides add and remove operations for topology members
 * Feature: 003-topologies-management
 * Updated: 005-api-reintegration - Uses topologyId instead of resourceId
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
  add: (topologyId: number, memberIds: number[]) => Promise<MembersAddResponse | null>;
  remove: (topologyId: number, memberIds: number[]) => Promise<boolean>;
  checkCycle: (topologyId: number, memberIds: number[]) => Promise<CycleDetectionResponse>;
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
   * T028: Still uses resourceId for cycle detection endpoint (unchanged)
   */
  const checkCycle = useCallback(async (
    topologyId: number,
    memberIds: number[]
  ): Promise<CycleDetectionResponse> => {
    setCheckingCycle(true);
    setCycleError(null);

    try {
      // Note: Cycle detection endpoint still uses resourceId
      // This is the relationships endpoint, not topology member endpoint
      const result = await topologyApi.detectCycles({
        resourceId: topologyId,
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
   * T026: Updated to use topologyId instead of resourceId
   * Returns true on success, null on failure
   */
  const add = useCallback(async (
    topologyId: number,
    memberIds: number[]
  ): Promise<MembersAddResponse | null> => {
    if (memberIds.length === 0) {
      return null;
    }

    setAdding(true);
    setError(null);

    try {
      // T026: Uses new endpoint with topologyId
      // Note: Backend returns void (ResultVoid), so result may be undefined
      await topologyApi.addMembers({
        topologyId,  // NEW: Uses topologyId parameter
        nodeIds: memberIds,  // Backend expects nodeIds field
      });

      // Return a truthy value to indicate success (backend returns void)
      return { addedCount: memberIds.length, members: [] };
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
   * T027: Updated to use topologyId instead of resourceId
   */
  const remove = useCallback(async (
    topologyId: number,
    memberIds: number[]
  ): Promise<boolean> => {
    if (memberIds.length === 0) {
      return false;
    }

    setRemoving(true);
    setError(null);

    try {
      // T027: Uses new endpoint with topologyId
      await topologyApi.removeMembers({
        topologyId,  // NEW: Uses topologyId parameter
        nodeIds: memberIds,  // Backend expects nodeIds field
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
