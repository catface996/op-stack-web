/**
 * Topology Report Template Binding API Service
 *
 * Manage report template bindings for topologies
 * Feature: 014-topology-report-template
 */

import { apiPostRaw } from './client';
import type {
  BindTopologyReportTemplatesRequest,
  BindTopologyReportTemplatesResponse,
  UnbindTopologyReportTemplatesRequest,
  UnbindTopologyReportTemplatesResponse,
  QueryBoundReportTemplatesRequest,
  QueryBoundReportTemplatesResponse,
  QueryUnboundReportTemplatesRequest,
  QueryUnboundReportTemplatesResponse,
} from './types';

// API endpoints
const TOPOLOGY_REPORT_TEMPLATE_API = {
  BIND: '/api/service/v1/topologies/report-templates/bind',
  UNBIND: '/api/service/v1/topologies/report-templates/unbind',
  BOUND: '/api/service/v1/topologies/report-templates/bound',
  UNBOUND: '/api/service/v1/topologies/report-templates/unbound',
} as const;

/**
 * Bind report templates to a topology
 */
export async function bindReportTemplates(
  request: BindTopologyReportTemplatesRequest
): Promise<BindTopologyReportTemplatesResponse> {
  return apiPostRaw<BindTopologyReportTemplatesRequest, BindTopologyReportTemplatesResponse>(
    TOPOLOGY_REPORT_TEMPLATE_API.BIND,
    request
  );
}

/**
 * Unbind report templates from a topology
 */
export async function unbindReportTemplates(
  request: UnbindTopologyReportTemplatesRequest
): Promise<UnbindTopologyReportTemplatesResponse> {
  return apiPostRaw<UnbindTopologyReportTemplatesRequest, UnbindTopologyReportTemplatesResponse>(
    TOPOLOGY_REPORT_TEMPLATE_API.UNBIND,
    request
  );
}

/**
 * Query report templates bound to a topology
 */
export async function queryBoundReportTemplates(
  request: QueryBoundReportTemplatesRequest
): Promise<QueryBoundReportTemplatesResponse> {
  return apiPostRaw<QueryBoundReportTemplatesRequest, QueryBoundReportTemplatesResponse>(
    TOPOLOGY_REPORT_TEMPLATE_API.BOUND,
    request
  );
}

/**
 * Query report templates NOT bound to a topology (available for binding)
 */
export async function queryUnboundReportTemplates(
  request: QueryUnboundReportTemplatesRequest
): Promise<QueryUnboundReportTemplatesResponse> {
  return apiPostRaw<QueryUnboundReportTemplatesRequest, QueryUnboundReportTemplatesResponse>(
    TOPOLOGY_REPORT_TEMPLATE_API.UNBOUND,
    request
  );
}
