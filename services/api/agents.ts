/**
 * Agent Management API
 *
 * API client for agent CRUD operations
 * Feature: 012-agent-api-integration
 */

import { apiPostRaw } from './client';
import type {
  ListAgentsRequest,
  AgentListResponse,
  GetAgentRequest,
  AgentDetailResponse,
  CreateAgentRequest,
  CreateAgentResponse,
  UpdateAgentRequest,
  UpdateAgentResponse,
  DeleteAgentRequest,
  DeleteAgentResponse,
  AgentTemplateListResponse,
} from './types';

/**
 * List agents with pagination and filters
 * POST /api/service/v1/agents/list
 */
export async function listAgents(
  request: ListAgentsRequest
): Promise<AgentListResponse> {
  return apiPostRaw<ListAgentsRequest, AgentListResponse>(
    '/api/service/v1/agents/list',
    request
  );
}

/**
 * Get agent detail by ID
 * POST /api/service/v1/agents/get
 */
export async function getAgent(
  request: GetAgentRequest
): Promise<AgentDetailResponse> {
  return apiPostRaw<GetAgentRequest, AgentDetailResponse>(
    '/api/service/v1/agents/get',
    request
  );
}

/**
 * Create a new agent
 * POST /api/service/v1/agents/create
 */
export async function createAgent(
  request: CreateAgentRequest
): Promise<CreateAgentResponse> {
  return apiPostRaw<CreateAgentRequest, CreateAgentResponse>(
    '/api/service/v1/agents/create',
    request
  );
}

/**
 * Update agent (unified - basic info + LLM config)
 * POST /api/service/v1/agents/update
 *
 * Can update: name, specialty, promptTemplateId, model, temperature, topP, maxTokens, maxRuntime
 */
export async function updateAgent(
  request: UpdateAgentRequest
): Promise<UpdateAgentResponse> {
  return apiPostRaw<UpdateAgentRequest, UpdateAgentResponse>(
    '/api/service/v1/agents/update',
    request
  );
}

/**
 * Delete an agent
 * POST /api/service/v1/agents/delete
 */
export async function deleteAgent(
  request: DeleteAgentRequest
): Promise<DeleteAgentResponse> {
  return apiPostRaw<DeleteAgentRequest, DeleteAgentResponse>(
    '/api/service/v1/agents/delete',
    request
  );
}

/**
 * List agent configuration templates
 * POST /api/service/v1/agents/templates/list
 */
export async function listAgentTemplates(): Promise<AgentTemplateListResponse> {
  return apiPostRaw<Record<string, never>, AgentTemplateListResponse>(
    '/api/service/v1/agents/templates/list',
    {}
  );
}
