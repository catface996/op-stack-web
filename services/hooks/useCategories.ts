/**
 * useCategories Hook
 *
 * Fetch and manage tool category list with pagination, loading, error states
 * Feature: 010-tool-category-management
 */

import { useState, useEffect, useCallback } from 'react';
import { listCategories } from '../api/categories';
import type { ToolCategoryDTO, ToolCategoryListRequest } from '../../types';

const DEFAULT_PAGE_SIZE = 10;

interface UseCategoriesOptions {
  page?: number;
  size?: number;
  keyword?: string;
}

interface UseCategoriesResult {
  categories: ToolCategoryDTO[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  keyword: string;
  setPage: (page: number) => void;
  setKeyword: (keyword: string) => void;
  refresh: () => void;
}

export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesResult {
  const [categories, setCategories] = useState<ToolCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options.page ?? 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeywordState] = useState(options.keyword ?? '');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    const pageSize = options.size ?? DEFAULT_PAGE_SIZE;

    try {
      // Constitution: API Pagination Request Format - use "size" not "page_size"
      const request: ToolCategoryListRequest = {
        page: page,
        size: pageSize,
      };

      // Add keyword filter if provided
      if (keyword.trim()) {
        request.keyword = keyword.trim();
      }

      console.log('[useCategories] Fetching categories with request:', request);
      const response = await listCategories(request);
      console.log('[useCategories] Response:', response);

      // Constitution: API Pagination Response Format - extract from data.content
      // Check for success via code === 0 or success === true
      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess && response.data) {
        setCategories(response.data.content || []);
        setTotal(response.data.totalElements || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setError(response.message || 'Failed to load category list');
        setCategories([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load category list';
      setError(message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, options.size]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const refresh = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSetKeyword = useCallback((newKeyword: string) => {
    setKeywordState(newKeyword);
    setPage(1); // Reset to first page when search changes
  }, []);

  return {
    categories,
    loading,
    error,
    page,
    totalPages,
    total,
    keyword,
    setPage: handleSetPage,
    setKeyword: handleSetKeyword,
    refresh,
  };
}
