/**
 * useReportTemplateMutations Hook
 *
 * Provides create, update, delete operations for report templates
 * Feature: 011-report-api-integration
 */

import { useState, useCallback } from 'react';
import {
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
} from '../api/report-templates';
import type {
  ReportTemplateDTO,
  CreateReportTemplateRequest,
  UpdateReportTemplateRequest,
} from '../api/types';

interface MutationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  isVersionConflict?: boolean;
}

interface UseReportTemplateMutationsResult {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  create: (data: CreateReportTemplateRequest) => Promise<MutationResult<ReportTemplateDTO>>;
  update: (data: UpdateReportTemplateRequest) => Promise<MutationResult<ReportTemplateDTO>>;
  remove: (id: number) => Promise<MutationResult<void>>;
}

export function useReportTemplateMutations(): UseReportTemplateMutationsResult {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const create = useCallback(async (data: CreateReportTemplateRequest): Promise<MutationResult<ReportTemplateDTO>> => {
    setCreating(true);
    try {
      console.log('[useReportTemplateMutations] Creating template:', data);
      const response = await createReportTemplate(data);
      console.log('[useReportTemplateMutations] Create response:', response);

      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess && response.data) {
        return { success: true, data: response.data };
      } else {
        // Check for duplicate name (409)
        if (response.code === 409) {
          return { success: false, error: 'A template with this name already exists' };
        }
        return { success: false, error: response.message || 'Failed to create template' };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create template';
      return { success: false, error: message };
    } finally {
      setCreating(false);
    }
  }, []);

  const update = useCallback(async (data: UpdateReportTemplateRequest): Promise<MutationResult<ReportTemplateDTO>> => {
    setUpdating(true);
    try {
      console.log('[useReportTemplateMutations] Updating template:', data);
      const response = await updateReportTemplate(data);
      console.log('[useReportTemplateMutations] Update response:', response);

      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess && response.data) {
        return { success: true, data: response.data };
      } else {
        // Check for version conflict (409)
        if (response.code === 409) {
          return {
            success: false,
            error: 'This template has been modified by someone else. Please refresh and try again.',
            isVersionConflict: true,
          };
        }
        // Check for not found (404)
        if (response.code === 404) {
          return { success: false, error: 'Template not found' };
        }
        return { success: false, error: response.message || 'Failed to update template' };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update template';
      return { success: false, error: message };
    } finally {
      setUpdating(false);
    }
  }, []);

  const remove = useCallback(async (id: number): Promise<MutationResult<void>> => {
    setDeleting(true);
    try {
      console.log('[useReportTemplateMutations] Deleting template:', id);
      const response = await deleteReportTemplate({ id });
      console.log('[useReportTemplateMutations] Delete response:', response);

      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess) {
        return { success: true };
      } else {
        // Check for not found (404)
        if (response.code === 404) {
          return { success: false, error: 'Template not found' };
        }
        return { success: false, error: response.message || 'Failed to delete template' };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete template';
      return { success: false, error: message };
    } finally {
      setDeleting(false);
    }
  }, []);

  return {
    creating,
    updating,
    deleting,
    create,
    update,
    remove,
  };
}
