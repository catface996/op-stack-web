/**
 * useReports Hook
 *
 * Fetch and manage report list with pagination, loading, error states
 * Feature: 011-report-api-integration
 */

import { useState, useEffect, useCallback } from 'react';
import { listReports, deleteReport } from '../api/reports';
import type {
  ReportDTO,
  ListReportsRequest,
  ReportType,
  ReportStatus,
} from '../api/types';

const DEFAULT_PAGE_SIZE = 8;

interface UseReportsOptions {
  page?: number;
  size?: number;
  type?: ReportType;
  status?: ReportStatus;
  keyword?: string;
}

interface UseReportsResult {
  reports: ReportDTO[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  typeFilter: ReportType | undefined;
  statusFilter: ReportStatus | undefined;
  keyword: string;
  setPage: (page: number) => void;
  setTypeFilter: (type: ReportType | undefined) => void;
  setStatusFilter: (status: ReportStatus | undefined) => void;
  setKeyword: (keyword: string) => void;
  refresh: () => void;
  handleDelete: (id: number) => Promise<boolean>;
  deleting: boolean;
}

export function useReports(options: UseReportsOptions = {}): UseReportsResult {
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options.page ?? 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilterState] = useState<ReportType | undefined>(options.type);
  const [statusFilter, setStatusFilterState] = useState<ReportStatus | undefined>(options.status);
  const [keyword, setKeywordState] = useState(options.keyword ?? '');
  const [deleting, setDeleting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    const pageSize = options.size ?? DEFAULT_PAGE_SIZE;

    try {
      // Constitution: API Pagination Request Format - use "size" not "page_size"
      const request: ListReportsRequest = {
        page: page,
        size: pageSize,
      };

      // Only add optional filters if explicitly set
      if (typeFilter !== undefined) {
        request.type = typeFilter;
      }
      if (statusFilter !== undefined) {
        request.status = statusFilter;
      }
      if (keyword.trim()) {
        request.keyword = keyword.trim();
      }

      console.log('[useReports] Fetching reports with request:', request);
      const response = await listReports(request);
      console.log('[useReports] Response:', response);

      // Constitution: API Pagination Response Format - extract from data.content
      // Check for success via code === 0 or success === true
      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess && response.data) {
        setReports(response.data.content || []);
        setTotal(response.data.totalElements || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setError(response.message || 'Failed to load report list');
        setReports([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load report list';
      setError(message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, keyword, options.size]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const refresh = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSetTypeFilter = useCallback((newType: ReportType | undefined) => {
    setTypeFilterState(newType);
    setPage(1); // Reset to first page when filter changes
  }, []);

  const handleSetStatusFilter = useCallback((newStatus: ReportStatus | undefined) => {
    setStatusFilterState(newStatus);
    setPage(1); // Reset to first page when filter changes
  }, []);

  const handleSetKeyword = useCallback((newKeyword: string) => {
    setKeywordState(newKeyword);
    setPage(1); // Reset to first page when search changes
  }, []);

  const handleDelete = useCallback(async (id: number): Promise<boolean> => {
    setDeleting(true);
    try {
      const response = await deleteReport({ id });
      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess) {
        // Refresh the list after successful deletion
        await fetchReports();
        return true;
      } else {
        setError(response.message || 'Failed to delete report');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete report';
      setError(message);
      return false;
    } finally {
      setDeleting(false);
    }
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    page,
    totalPages,
    total,
    typeFilter,
    statusFilter,
    keyword,
    setPage: handleSetPage,
    setTypeFilter: handleSetTypeFilter,
    setStatusFilter: handleSetStatusFilter,
    setKeyword: handleSetKeyword,
    refresh,
    handleDelete,
    deleting,
  };
}
