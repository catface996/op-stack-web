/**
 * Tool Categories API Service
 *
 * CRUD operations for tool category management
 * Feature: 010-tool-category-management
 */

import { apiPostRaw } from './client';
import type {
  ToolCategoryDTO,
  ToolCategoryListRequest,
  ToolCategoryListResponse,
  ToolCategoryCreateRequest,
  ToolCategoryUpdateRequest,
  ToolCategoryIdRequest,
} from '../../types';

// API endpoints - routed through gateway to tools service
const CATEGORIES_API = {
  LIST: '/api/tools/v1/categories/list',
  CREATE: '/api/tools/v1/categories/create',
  GET: '/api/tools/v1/categories/get',
  UPDATE: '/api/tools/v1/categories/update',
  DELETE: '/api/tools/v1/categories/delete',
} as const;

/**
 * List categories with pagination
 */
export async function listCategories(request: ToolCategoryListRequest): Promise<ToolCategoryListResponse> {
  return apiPostRaw<ToolCategoryListRequest, ToolCategoryListResponse>(CATEGORIES_API.LIST, request);
}

/**
 * Create a new category
 */
export async function createCategory(request: ToolCategoryCreateRequest): Promise<ToolCategoryDTO> {
  return apiPostRaw<ToolCategoryCreateRequest, ToolCategoryDTO>(CATEGORIES_API.CREATE, request);
}

/**
 * Get a single category by ID
 */
export async function getCategory(request: ToolCategoryIdRequest): Promise<ToolCategoryDTO> {
  return apiPostRaw<ToolCategoryIdRequest, ToolCategoryDTO>(CATEGORIES_API.GET, request);
}

/**
 * Update an existing category
 */
export async function updateCategory(request: ToolCategoryUpdateRequest): Promise<ToolCategoryDTO> {
  return apiPostRaw<ToolCategoryUpdateRequest, ToolCategoryDTO>(CATEGORIES_API.UPDATE, request);
}

/**
 * Delete a category by ID
 * Note: Will fail if category has tools assigned
 */
export async function deleteCategory(request: ToolCategoryIdRequest): Promise<void> {
  return apiPostRaw<ToolCategoryIdRequest, void>(CATEGORIES_API.DELETE, request);
}
