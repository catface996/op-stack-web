/**
 * useTopologyReportTemplates Hook
 *
 * Manage topology-report template bindings
 * Feature: 014-topology-report-template
 */

import { useState, useEffect, useCallback } from 'react';
import {
  queryBoundReportTemplates,
  queryUnboundReportTemplates,
  bindReportTemplates,
  unbindReportTemplates,
} from '../api/topologyReportTemplates';
import type { ReportTemplateDTO } from '../api/types';

interface UseTopologyReportTemplatesOptions {
  topologyId: number;
  keyword?: string;
  size?: number;
}

interface UseTopologyReportTemplatesResult {
  // Bound templates
  boundTemplates: ReportTemplateDTO[];
  boundLoading: boolean;
  boundError: string | null;
  boundPage: number;
  boundTotalPages: number;
  boundTotal: number;
  setBoundPage: (page: number) => void;
  refreshBound: () => void;

  // Unbound templates
  unboundTemplates: ReportTemplateDTO[];
  unboundLoading: boolean;
  unboundError: string | null;
  unboundPage: number;
  unboundTotalPages: number;
  unboundTotal: number;
  setUnboundPage: (page: number) => void;
  refreshUnbound: () => void;

  // Binding operations
  bind: (templateIds: number[]) => Promise<boolean>;
  unbind: (templateIds: number[]) => Promise<boolean>;
  binding: boolean;
  bindError: string | null;
}

export function useTopologyReportTemplates(
  options: UseTopologyReportTemplatesOptions
): UseTopologyReportTemplatesResult {
  const { topologyId, keyword, size = 100 } = options;

  // Bound templates state
  const [boundTemplates, setBoundTemplates] = useState<ReportTemplateDTO[]>([]);
  const [boundLoading, setBoundLoading] = useState(true);
  const [boundError, setBoundError] = useState<string | null>(null);
  const [boundPage, setBoundPage] = useState(1);
  const [boundTotalPages, setBoundTotalPages] = useState(1);
  const [boundTotal, setBoundTotal] = useState(0);

  // Unbound templates state
  const [unboundTemplates, setUnboundTemplates] = useState<ReportTemplateDTO[]>([]);
  const [unboundLoading, setUnboundLoading] = useState(true);
  const [unboundError, setUnboundError] = useState<string | null>(null);
  const [unboundPage, setUnboundPage] = useState(1);
  const [unboundTotalPages, setUnboundTotalPages] = useState(1);
  const [unboundTotal, setUnboundTotal] = useState(0);

  // Binding operation state
  const [binding, setBinding] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);

  // Fetch bound templates
  const fetchBound = useCallback(async () => {
    setBoundLoading(true);
    setBoundError(null);
    try {
      const response = await queryBoundReportTemplates({
        topologyId,
        page: boundPage,
        size,
        keyword,
      });
      if (response.success && response.data) {
        setBoundTemplates(response.data.content || []);
        setBoundTotal(response.data.totalElements || 0);
        setBoundTotalPages(response.data.totalPages || 1);
      } else {
        setBoundError(response.message || 'Failed to load bound templates');
        setBoundTemplates([]);
      }
    } catch (err) {
      setBoundError(err instanceof Error ? err.message : 'Failed to load bound templates');
      setBoundTemplates([]);
    } finally {
      setBoundLoading(false);
    }
  }, [topologyId, boundPage, size, keyword]);

  // Fetch unbound templates
  const fetchUnbound = useCallback(async () => {
    setUnboundLoading(true);
    setUnboundError(null);
    try {
      const response = await queryUnboundReportTemplates({
        topologyId,
        page: unboundPage,
        size,
        keyword,
      });
      if (response.success && response.data) {
        setUnboundTemplates(response.data.content || []);
        setUnboundTotal(response.data.totalElements || 0);
        setUnboundTotalPages(response.data.totalPages || 1);
      } else {
        setUnboundError(response.message || 'Failed to load available templates');
        setUnboundTemplates([]);
      }
    } catch (err) {
      setUnboundError(err instanceof Error ? err.message : 'Failed to load available templates');
      setUnboundTemplates([]);
    } finally {
      setUnboundLoading(false);
    }
  }, [topologyId, unboundPage, size, keyword]);

  // Initial fetch
  useEffect(() => {
    fetchBound();
  }, [fetchBound]);

  useEffect(() => {
    fetchUnbound();
  }, [fetchUnbound]);

  // Bind templates
  const bind = useCallback(
    async (templateIds: number[]): Promise<boolean> => {
      setBinding(true);
      setBindError(null);
      try {
        const response = await bindReportTemplates({ topologyId, reportTemplateIds: templateIds });
        if (response.success) {
          // Refresh both lists
          await Promise.all([fetchBound(), fetchUnbound()]);
          return true;
        } else {
          setBindError(response.message || 'Failed to bind templates');
          return false;
        }
      } catch (err) {
        setBindError(err instanceof Error ? err.message : 'Failed to bind templates');
        return false;
      } finally {
        setBinding(false);
      }
    },
    [topologyId, fetchBound, fetchUnbound]
  );

  // Unbind templates
  const unbind = useCallback(
    async (templateIds: number[]): Promise<boolean> => {
      setBinding(true);
      setBindError(null);
      try {
        const response = await unbindReportTemplates({ topologyId, reportTemplateIds: templateIds });
        if (response.success) {
          // Refresh both lists
          await Promise.all([fetchBound(), fetchUnbound()]);
          return true;
        } else {
          setBindError(response.message || 'Failed to unbind templates');
          return false;
        }
      } catch (err) {
        setBindError(err instanceof Error ? err.message : 'Failed to unbind templates');
        return false;
      } finally {
        setBinding(false);
      }
    },
    [topologyId, fetchBound, fetchUnbound]
  );

  return {
    boundTemplates,
    boundLoading,
    boundError,
    boundPage,
    boundTotalPages,
    boundTotal,
    setBoundPage,
    refreshBound: fetchBound,

    unboundTemplates,
    unboundLoading,
    unboundError,
    unboundPage,
    unboundTotalPages,
    unboundTotal,
    setUnboundPage,
    refreshUnbound: fetchUnbound,

    bind,
    unbind,
    binding,
    bindError,
  };
}
