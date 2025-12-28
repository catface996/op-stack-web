/**
 * useAgentBinding Hook
 *
 * Manage agent-tool bindings via tools service API
 * Feature: 013-agent-config-page
 */

import { useState, useEffect, useCallback } from 'react';
import { queryBoundTools, queryUnboundTools, bindTools } from '../api/agentBinding';
import type { ToolDTO } from '../../types';

interface UseAgentBindingOptions {
  agentId: string;
  categoryId?: string;
  keyword?: string;
  size?: number;
}

interface UseAgentBindingResult {
  // Bound tools
  boundTools: ToolDTO[];
  boundLoading: boolean;
  boundError: string | null;
  boundPage: number;
  boundTotalPages: number;
  boundTotal: number;
  setBoundPage: (page: number) => void;
  refreshBound: () => void;

  // Unbound tools
  unboundTools: ToolDTO[];
  unboundLoading: boolean;
  unboundError: string | null;
  unboundPage: number;
  unboundTotalPages: number;
  unboundTotal: number;
  setUnboundPage: (page: number) => void;
  refreshUnbound: () => void;

  // Binding operations
  bind: (toolIds: string[]) => Promise<boolean>;
  binding: boolean;
  bindError: string | null;
}

export function useAgentBinding(options: UseAgentBindingOptions): UseAgentBindingResult {
  const { agentId, categoryId, keyword, size = 100 } = options;

  // Bound tools state
  const [boundTools, setBoundTools] = useState<ToolDTO[]>([]);
  const [boundLoading, setBoundLoading] = useState(true);
  const [boundError, setBoundError] = useState<string | null>(null);
  const [boundPage, setBoundPage] = useState(1);
  const [boundTotalPages, setBoundTotalPages] = useState(1);
  const [boundTotal, setBoundTotal] = useState(0);

  // Unbound tools state
  const [unboundTools, setUnboundTools] = useState<ToolDTO[]>([]);
  const [unboundLoading, setUnboundLoading] = useState(true);
  const [unboundError, setUnboundError] = useState<string | null>(null);
  const [unboundPage, setUnboundPage] = useState(1);
  const [unboundTotalPages, setUnboundTotalPages] = useState(1);
  const [unboundTotal, setUnboundTotal] = useState(0);

  // Binding state
  const [binding, setBinding] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);

  // Fetch bound tools
  const fetchBound = useCallback(async () => {
    setBoundLoading(true);
    setBoundError(null);
    try {
      const response = await queryBoundTools({
        agentId,
        page: boundPage,
        size,
        keyword,
        categoryId,
      });
      if (response.success && response.data) {
        setBoundTools(response.data.content || []);
        setBoundTotal(response.data.totalElements || 0);
        setBoundTotalPages(response.data.totalPages || 1);
      } else {
        setBoundError(response.message || 'Failed to load bound tools');
        setBoundTools([]);
      }
    } catch (err) {
      setBoundError(err instanceof Error ? err.message : 'Failed to load bound tools');
      setBoundTools([]);
    } finally {
      setBoundLoading(false);
    }
  }, [agentId, boundPage, size, keyword, categoryId]);

  // Fetch unbound tools
  const fetchUnbound = useCallback(async () => {
    setUnboundLoading(true);
    setUnboundError(null);
    try {
      const response = await queryUnboundTools({
        agentId,
        page: unboundPage,
        size,
        keyword,
        categoryId,
      });
      if (response.success && response.data) {
        setUnboundTools(response.data.content || []);
        setUnboundTotal(response.data.totalElements || 0);
        setUnboundTotalPages(response.data.totalPages || 1);
      } else {
        setUnboundError(response.message || 'Failed to load unbound tools');
        setUnboundTools([]);
      }
    } catch (err) {
      setUnboundError(err instanceof Error ? err.message : 'Failed to load unbound tools');
      setUnboundTools([]);
    } finally {
      setUnboundLoading(false);
    }
  }, [agentId, unboundPage, size, keyword, categoryId]);

  // Initial fetch
  useEffect(() => {
    fetchBound();
  }, [fetchBound]);

  useEffect(() => {
    fetchUnbound();
  }, [fetchUnbound]);

  // Bind tools
  const bind = useCallback(async (toolIds: string[]): Promise<boolean> => {
    setBinding(true);
    setBindError(null);
    try {
      const response = await bindTools({ agentId, toolIds });
      if (response.success) {
        // Refresh both lists
        await Promise.all([fetchBound(), fetchUnbound()]);
        return true;
      } else {
        setBindError(response.message || 'Failed to bind tools');
        return false;
      }
    } catch (err) {
      setBindError(err instanceof Error ? err.message : 'Failed to bind tools');
      return false;
    } finally {
      setBinding(false);
    }
  }, [agentId, fetchBound, fetchUnbound]);

  return {
    boundTools,
    boundLoading,
    boundError,
    boundPage,
    boundTotalPages,
    boundTotal,
    setBoundPage,
    refreshBound: fetchBound,

    unboundTools,
    unboundLoading,
    unboundError,
    unboundPage,
    unboundTotalPages,
    unboundTotal,
    setUnboundPage,
    refreshUnbound: fetchUnbound,

    bind,
    binding,
    bindError,
  };
}
