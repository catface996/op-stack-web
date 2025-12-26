/**
 * useMembers Hook
 *
 * Fetch paginated member list for a topology
 * Feature: 003-topologies-management
 * Updated: 005-api-reintegration - Uses topologyId instead of resourceId
 * Updated: Backend now returns NodeDTO instead of TopologyMember
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { topologyApi } from '../api/topology';
import type { TopologyMember, NodeDTO } from '../api/types';

/**
 * Transform NodeDTO to TopologyMember format for backward compatibility
 */
function nodeToMember(node: NodeDTO, topologyId: number): TopologyMember {
  return {
    id: node.id,  // Use node.id as the membership record id
    subgraphId: topologyId,
    memberId: node.id,
    memberName: node.name,
    memberTypeCode: node.nodeTypeCode,
    memberStatus: node.status,
    addedAt: node.createdAt,
    addedBy: node.createdBy,
  };
}

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
 * @param topologyId - The topology ID to fetch members for (renamed from subgraphId)
 */
export function useMembers(topologyId: number | null): UseMembersResult {
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
    if (topologyId === null) {
      setMembers([]);
      setPagination({ page: 1, size, totalElements: 0, totalPages: 0 });
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // T025: Updated to use topologyId instead of resourceId
      const result = await topologyApi.queryMembers({
        topologyId,  // NEW: Uses topologyId parameter
        page,
        size,
      });

      // Check if this is the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      // Transform NodeDTO to TopologyMember format
      // Backend now returns PageResult<NodeDTO> instead of PageResult<TopologyMember>
      const transformedMembers = (result.content as unknown as NodeDTO[]).map(
        node => nodeToMember(node, topologyId)
      );

      setMembers(transformedMembers);
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
  }, [topologyId]);

  // Fetch on mount and when topologyId changes
  useEffect(() => {
    fetchMembers(1, pagination.size);
  }, [topologyId, fetchMembers]);

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
