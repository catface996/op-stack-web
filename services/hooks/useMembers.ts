/**
 * useMembers Hook
 *
 * Fetch paginated member list for a topology (subgraph)
 * Feature: 003-topologies-management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { topologyApi } from '../api/topology';
import type { TopologyMember } from '../api/types';

export interface MembersPagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UseMembersResult {
  members: TopologyMember[];
  pagination: MembersPagination;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
}

const DEFAULT_PAGE_SIZE = 10;

/**
 * Hook for fetching topology member list
 */
export function useMembers(subgraphId: number | null): UseMembersResult {
  const [members, setMembers] = useState<TopologyMember[]>([]);
  const [pagination, setPagination] = useState<MembersPagination>({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track current request for canceling stale requests
  const requestIdRef = useRef(0);

  const fetchMembers = useCallback(async (page: number, size: number) => {
    if (subgraphId === null) {
      setMembers([]);
      setPagination({ page: 1, size, totalElements: 0, totalPages: 0 });
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await topologyApi.queryMembers({
        resourceId: subgraphId,  // API uses resourceId parameter
        page,
        size,
      });

      // Check if this is the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setMembers(result.content);
      setPagination({
        page: result.page,
        size: result.size,
        totalElements: result.totalElements,
        totalPages: result.totalPages,
      });
    } catch (err) {
      // Check if this is the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const message = err instanceof Error ? err.message : 'Failed to fetch members';
      setError(message);
      console.error('Failed to fetch members:', err);
    } finally {
      // Check if this is the latest request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [subgraphId]);

  // Fetch on mount and when subgraphId changes
  useEffect(() => {
    fetchMembers(1, pagination.size);
  }, [subgraphId, fetchMembers]);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchMembers(page, pagination.size);
  }, [pagination.size, fetchMembers]);

  const setSize = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, size, page: 1 }));
    fetchMembers(1, size);
  }, [fetchMembers]);

  const refresh = useCallback(() => {
    fetchMembers(pagination.page, pagination.size);
  }, [pagination.page, pagination.size, fetchMembers]);

  return {
    members,
    pagination,
    loading,
    error,
    refresh,
    setPage,
    setSize,
  };
}
