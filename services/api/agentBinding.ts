/**
 * Agent-Tool Binding API Service
 *
 * Manage tool bindings for agents via tools service
 * Feature: 013-agent-config-page
 */

import { apiPostRaw } from './client';
import type { ToolDTO, ApiResponseWrapper, PaginatedData } from '../../types';

// API endpoints
const BINDING_API = {
  BOUND: '/api/tools/v1/agent-bindng/bound',
  UNBOUND: '/api/tools/v1/agent-bindng/unbound',
  BIND: '/api/tools/v1/agent-bindng/bindng',
} as const;

// Request types
export interface BoundToolsRequest {
  agentId: string;
  page?: number;
  size?: number;
  keyword?: string;
  categoryId?: string;
}

export interface UnboundToolsRequest {
  agentId: string;
  page?: number;
  size?: number;
  keyword?: string;
  categoryId?: string;
}

export interface BindToolsRequest {
  agentId: string;
  toolIds?: string[];
}

// Response types
export interface BindingResult {
  agentId: string;
  boundToolCount: number;
  toolIds: string[];
}

export type BindingListResponse = ApiResponseWrapper<PaginatedData<ToolDTO>>;
export type BindToolsResponse = ApiResponseWrapper<BindingResult>;

/**
 * Query tools bound to an agent
 */
export async function queryBoundTools(request: BoundToolsRequest): Promise<BindingListResponse> {
  return apiPostRaw<BoundToolsRequest, BindingListResponse>(BINDING_API.BOUND, request);
}

/**
 * Query tools NOT bound to an agent
 */
export async function queryUnboundTools(request: UnboundToolsRequest): Promise<BindingListResponse> {
  return apiPostRaw<UnboundToolsRequest, BindingListResponse>(BINDING_API.UNBOUND, request);
}

/**
 * Bind tools to an agent (full replacement)
 */
export async function bindTools(request: BindToolsRequest): Promise<BindToolsResponse> {
  return apiPostRaw<BindToolsRequest, BindToolsResponse>(BINDING_API.BIND, request);
}
