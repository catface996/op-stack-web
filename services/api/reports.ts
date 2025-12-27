/**
 * Report Management API
 *
 * API client for report CRUD operations
 * Feature: 011-report-api-integration
 */

import { apiPostRaw } from './client';
import type {
  ListReportsRequest,
  ReportListResponse,
  GetReportRequest,
  ReportDetailResponse,
  CreateReportRequest,
  CreateReportResponse,
  DeleteReportRequest,
  DeleteReportResponse,
} from './types';

/**
 * List reports with pagination and filters
 * POST /api/service/v1/reports/list
 */
export async function listReports(
  request: ListReportsRequest
): Promise<ReportListResponse> {
  return apiPostRaw<ListReportsRequest, ReportListResponse>(
    '/api/service/v1/reports/list',
    request
  );
}

/**
 * Get report detail by ID
 * POST /api/service/v1/reports/get
 */
export async function getReport(
  request: GetReportRequest
): Promise<ReportDetailResponse> {
  return apiPostRaw<GetReportRequest, ReportDetailResponse>(
    '/api/service/v1/reports/get',
    request
  );
}

/**
 * Create a new report
 * POST /api/service/v1/reports/create
 */
export async function createReport(
  request: CreateReportRequest
): Promise<CreateReportResponse> {
  return apiPostRaw<CreateReportRequest, CreateReportResponse>(
    '/api/service/v1/reports/create',
    request
  );
}

/**
 * Delete a report
 * POST /api/service/v1/reports/delete
 */
export async function deleteReport(
  request: DeleteReportRequest
): Promise<DeleteReportResponse> {
  return apiPostRaw<DeleteReportRequest, DeleteReportResponse>(
    '/api/service/v1/reports/delete',
    request
  );
}
