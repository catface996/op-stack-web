/**
 * Model Management API Service
 *
 * CRUD operations for AI model configurations
 * Feature: 008-model-api-integration
 */

import { apiPost } from './client';
import type {
  ModelDTO,
  ModelListRequest,
  ModelListResponse,
  ModelCreateRequest,
  ModelGetRequest,
  ModelUpdateRequest,
  ModelDeleteRequest,
} from './types';

// API endpoints
const MODELS_API = {
  LIST: '/api/v1/models/list',
  CREATE: '/api/v1/models/create',
  GET: '/api/v1/models/get',
  UPDATE: '/api/v1/models/update',
  DELETE: '/api/v1/models/delete',
} as const;

/**
 * List models with pagination and optional filter
 */
export async function listModels(request: ModelListRequest): Promise<ModelListResponse> {
  return apiPost<ModelListRequest, ModelListResponse>(MODELS_API.LIST, request);
}

/**
 * Create a new model
 */
export async function createModel(request: ModelCreateRequest): Promise<ModelDTO> {
  return apiPost<ModelCreateRequest, ModelDTO>(MODELS_API.CREATE, request);
}

/**
 * Get a single model by ID
 */
export async function getModel(request: ModelGetRequest): Promise<ModelDTO> {
  return apiPost<ModelGetRequest, ModelDTO>(MODELS_API.GET, request);
}

/**
 * Update an existing model
 */
export async function updateModel(request: ModelUpdateRequest): Promise<ModelDTO> {
  return apiPost<ModelUpdateRequest, ModelDTO>(MODELS_API.UPDATE, request);
}

/**
 * Delete a model by ID
 */
export async function deleteModel(request: ModelDeleteRequest): Promise<void> {
  return apiPost<ModelDeleteRequest, void>(MODELS_API.DELETE, request);
}
