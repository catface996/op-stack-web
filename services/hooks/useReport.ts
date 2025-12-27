/**
 * useReport Hook
 *
 * Fetch single report by ID with loading and error states
 * Feature: 011-report-api-integration
 */

import { useState, useEffect, useCallback } from 'react';
import { getReport } from '../api/reports';
import type { ReportDTO } from '../api/types';

interface UseReportOptions {
  id: number | null;
  autoFetch?: boolean;
}

interface UseReportResult {
  report: ReportDTO | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  refresh: () => void;
}

export function useReport(options: UseReportOptions): UseReportResult {
  const { id, autoFetch = true } = options;
  const [report, setReport] = useState<ReportDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchReport = useCallback(async () => {
    if (id === null) {
      setReport(null);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      console.log('[useReport] Fetching report:', id);
      const response = await getReport({ id });
      console.log('[useReport] Response:', response);

      // Check for success via code === 0 or success === true
      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess && response.data) {
        setReport(response.data);
      } else {
        // Check for 404
        if (response.code === 404) {
          setNotFound(true);
          setError('Report not found');
        } else {
          setError(response.message || 'Failed to load report');
        }
        setReport(null);
      }
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      if (errorObj.status === 404) {
        setNotFound(true);
        setError('Report not found');
      } else {
        const message = errorObj.message || 'Failed to load report';
        setError(message);
      }
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (autoFetch && id !== null) {
      fetchReport();
    }
  }, [autoFetch, id, fetchReport]);

  const refresh = useCallback(() => {
    if (id !== null) {
      fetchReport();
    }
  }, [id, fetchReport]);

  return {
    report,
    loading,
    error,
    notFound,
    refresh,
  };
}
