/**
 * useReportTemplates Hook
 *
 * Fetch and manage report template list with pagination, loading, error states
 * Feature: 011-report-api-integration
 */

import { useState, useEffect, useCallback } from 'react';
import { listReportTemplates } from '../api/report-templates';
import type {
  ReportTemplateDTO,
  ListReportTemplatesRequest,
  ReportTemplateCategory,
} from '../api/types';

const DEFAULT_PAGE_SIZE = 10;

interface UseReportTemplatesOptions {
  page?: number;
  size?: number;
  category?: ReportTemplateCategory;
  keyword?: string;
}

interface UseReportTemplatesResult {
  templates: ReportTemplateDTO[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  categoryFilter: ReportTemplateCategory | undefined;
  keyword: string;
  setPage: (page: number) => void;
  setCategoryFilter: (category: ReportTemplateCategory | undefined) => void;
  setKeyword: (keyword: string) => void;
  refresh: () => void;
}

export function useReportTemplates(options: UseReportTemplatesOptions = {}): UseReportTemplatesResult {
  const [templates, setTemplates] = useState<ReportTemplateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options.page ?? 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryFilter, setCategoryFilterState] = useState<ReportTemplateCategory | undefined>(options.category);
  const [keyword, setKeywordState] = useState(options.keyword ?? '');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    const pageSize = options.size ?? DEFAULT_PAGE_SIZE;

    try {
      // Constitution: API Pagination Request Format - use "size" not "page_size"
      const request: ListReportTemplatesRequest = {
        page: page,
        size: pageSize,
      };

      // Only add optional filters if explicitly set
      if (categoryFilter !== undefined) {
        request.category = categoryFilter;
      }
      if (keyword.trim()) {
        request.keyword = keyword.trim();
      }

      console.log('[useReportTemplates] Fetching templates with request:', request);
      const response = await listReportTemplates(request);
      console.log('[useReportTemplates] Response:', response);

      // Constitution: API Pagination Response Format - extract from data.content
      // Check for success via code === 0 or success === true
      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess && response.data) {
        setTemplates(response.data.content || []);
        setTotal(response.data.totalElements || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setError(response.message || 'Failed to load template list');
        setTemplates([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load template list';
      setError(message);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, keyword, options.size]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const refresh = useCallback(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSetCategoryFilter = useCallback((newCategory: ReportTemplateCategory | undefined) => {
    setCategoryFilterState(newCategory);
    setPage(1); // Reset to first page when filter changes
  }, []);

  const handleSetKeyword = useCallback((newKeyword: string) => {
    setKeywordState(newKeyword);
    setPage(1); // Reset to first page when search changes
  }, []);

  return {
    templates,
    loading,
    error,
    page,
    totalPages,
    total,
    categoryFilter,
    keyword,
    setPage: handleSetPage,
    setCategoryFilter: handleSetCategoryFilter,
    setKeyword: handleSetKeyword,
    refresh,
  };
}
