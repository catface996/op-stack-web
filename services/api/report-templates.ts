/**
 * Report Template Management API
 *
 * API client for report template CRUD operations
 * Feature: 011-report-api-integration
 */

import { apiPostRaw } from './client';
import type {
  ListReportTemplatesRequest,
  ReportTemplateListResponse,
  GetReportTemplateRequest,
  ReportTemplateDetailResponse,
  CreateReportTemplateRequest,
  CreateReportTemplateResponse,
  UpdateReportTemplateRequest,
  UpdateReportTemplateResponse,
  DeleteReportTemplateRequest,
  DeleteReportTemplateResponse,
} from './types';

/**
 * List report templates with pagination and filters
 * POST /api/service/v1/report-templates/list
 */
export async function listReportTemplates(
  request: ListReportTemplatesRequest
): Promise<ReportTemplateListResponse> {
  return apiPostRaw<ListReportTemplatesRequest, ReportTemplateListResponse>(
    '/api/service/v1/report-templates/list',
    request
  );
}

/**
 * Get report template detail by ID
 * POST /api/service/v1/report-templates/get
 */
export async function getReportTemplate(
  request: GetReportTemplateRequest
): Promise<ReportTemplateDetailResponse> {
  return apiPostRaw<GetReportTemplateRequest, ReportTemplateDetailResponse>(
    '/api/service/v1/report-templates/get',
    request
  );
}

/**
 * Create a new report template
 * POST /api/service/v1/report-templates/create
 */
export async function createReportTemplate(
  request: CreateReportTemplateRequest
): Promise<CreateReportTemplateResponse> {
  return apiPostRaw<CreateReportTemplateRequest, CreateReportTemplateResponse>(
    '/api/service/v1/report-templates/create',
    request
  );
}

/**
 * Update a report template (with optimistic locking)
 * POST /api/service/v1/report-templates/update
 */
export async function updateReportTemplate(
  request: UpdateReportTemplateRequest
): Promise<UpdateReportTemplateResponse> {
  return apiPostRaw<UpdateReportTemplateRequest, UpdateReportTemplateResponse>(
    '/api/service/v1/report-templates/update',
    request
  );
}

/**
 * Delete a report template
 * POST /api/service/v1/report-templates/delete
 */
export async function deleteReportTemplate(
  request: DeleteReportTemplateRequest
): Promise<DeleteReportTemplateResponse> {
  return apiPostRaw<DeleteReportTemplateRequest, DeleteReportTemplateResponse>(
    '/api/service/v1/report-templates/delete',
    request
  );
}
