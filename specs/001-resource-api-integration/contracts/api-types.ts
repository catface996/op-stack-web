/**
 * API Types for Resource Management
 *
 * 基于后端 OpenAPI 文档定义的 TypeScript 类型
 * Feature: 001-resource-api-integration
 * Date: 2025-12-25
 */

// ============================================================================
// Common Types
// ============================================================================

/**
 * 统一 API 响应包装器
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

/**
 * 分页结果
 */
export interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ============================================================================
// Resource Types
// ============================================================================

/**
 * 资源状态枚举
 */
export type ResourceStatus = 'RUNNING' | 'STOPPED' | 'MAINTENANCE' | 'OFFLINE';

/**
 * 资源 DTO
 */
export interface ResourceDTO {
  id: number;
  name: string;
  description: string | null;
  resourceTypeId: number;
  resourceTypeName: string;
  resourceTypeCode: string;
  status: ResourceStatus;
  statusDisplay: string;
  attributes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

/**
 * 资源类型 DTO
 */
export interface ResourceTypeDTO {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  systemPreset: boolean;
}

/**
 * 审计操作类型
 */
export type AuditOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';

/**
 * 资源审计日志 DTO
 */
export interface ResourceAuditLogDTO {
  id: number;
  resourceId: number;
  operation: AuditOperation;
  operationDisplay: string;
  oldValue: string | null;
  newValue: string | null;
  operatorId: number;
  operatorName: string;
  operatedAt: string;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * 查询资源列表请求
 */
export interface ListResourcesRequest {
  resourceTypeId?: number;
  status?: ResourceStatus;
  keyword?: string;
  page?: number;
  size?: number;
}

/**
 * 创建资源请求
 */
export interface CreateResourceRequest {
  name: string;
  description?: string;
  resourceTypeId: number;
  attributes?: string;
}

/**
 * 获取单个资源请求
 */
export interface GetResourceRequest {
  id: number;
}

/**
 * 更新资源请求
 */
export interface UpdateResourceRequest {
  id: number;
  name?: string;
  description?: string;
  attributes?: string;
  version: number;
}

/**
 * 更新资源状态请求
 */
export interface UpdateResourceStatusRequest {
  id: number;
  status: ResourceStatus;
  version: number;
}

/**
 * 删除资源请求
 */
export interface DeleteResourceRequest {
  id: number;
  confirmName: string;
}

/**
 * 查询审计日志请求
 */
export interface QueryAuditLogsRequest {
  resourceId: number;
  page?: number;
  size?: number;
}

/**
 * 查询资源类型请求
 */
export interface QueryResourceTypesRequest {
  page?: number;
  size?: number;
}

// ============================================================================
// Response Types (Aliases for clarity)
// ============================================================================

export type ListResourcesResponse = ApiResponse<PageResult<ResourceDTO>>;
export type CreateResourceResponse = ResourceDTO; // 201 直接返回 ResourceDTO
export type GetResourceResponse = ApiResponse<ResourceDTO>;
export type UpdateResourceResponse = ApiResponse<ResourceDTO>;
export type UpdateResourceStatusResponse = ApiResponse<ResourceDTO>;
export type DeleteResourceResponse = ApiResponse<void>;
export type QueryAuditLogsResponse = ApiResponse<PageResult<ResourceAuditLogDTO>>;
export type QueryResourceTypesResponse = ApiResponse<ResourceTypeDTO[]>;

// ============================================================================
// Error Types
// ============================================================================

/**
 * API 错误响应
 */
export interface ApiError {
  code: number;
  message: string;
  httpStatus: number;
}

/**
 * HTTP 错误码常量
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * 错误消息映射
 */
export const ERROR_MESSAGES: Record<number, string> = {
  [HTTP_STATUS.BAD_REQUEST]: '请求参数无效',
  [HTTP_STATUS.UNAUTHORIZED]: '登录已过期，请重新登录',
  [HTTP_STATUS.FORBIDDEN]: '您没有权限执行此操作',
  [HTTP_STATUS.NOT_FOUND]: '请求的资源不存在',
  [HTTP_STATUS.CONFLICT]: '操作冲突，请刷新后重试',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: '服务暂时不可用，请稍后重试',
};
