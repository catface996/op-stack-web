# Data Model: 资源管理后端 API 对接

**Feature**: 001-resource-api-integration
**Date**: 2025-12-25

## Overview

本文档定义了资源管理功能涉及的前端数据模型，基于后端 OpenAPI 文档和功能规格说明。

---

## Core Entities

### Resource（资源）

系统管理的基础设施单元。

```typescript
interface Resource {
  id: number;                    // 资源唯一标识
  name: string;                  // 资源名称（必填，max 100）
  description: string | null;    // 资源描述（可选，max 500）
  resourceTypeId: number;        // 资源类型 ID（必填）
  resourceTypeName: string;      // 资源类型名称（只读）
  resourceTypeCode: string;      // 资源类型编码（只读，用于图标映射）
  status: ResourceStatus;        // 资源状态
  statusDisplay: string;         // 状态显示名称（只读）
  attributes: string | null;     // 扩展属性（JSON 格式字符串）
  version: number;               // 版本号（乐观锁）
  createdAt: string;             // 创建时间（ISO 8601）
  updatedAt: string;             // 更新时间（ISO 8601）
  createdBy: number;             // 创建者 ID
}

type ResourceStatus = 'RUNNING' | 'STOPPED' | 'MAINTENANCE' | 'OFFLINE';
```

**Validation Rules**:
- `name`: 必填，1-100 字符
- `description`: 可选，最大 500 字符
- `resourceTypeId`: 必填，必须是有效的资源类型 ID
- `attributes`: 可选，必须是有效的 JSON 字符串

**State Transitions**:
```
RUNNING <-> STOPPED <-> MAINTENANCE <-> OFFLINE
     \________|____________|____________/
           (任意状态可切换到任意其他状态)
```

---

### ResourceType（资源类型）

动态定义的资源分类。

```typescript
interface ResourceType {
  id: number;              // 类型 ID
  code: string;            // 类型编码（如 SERVER, DATABASE）
  name: string;            // 类型名称（如"服务器"）
  description: string;     // 类型描述
  icon: string;            // 图标标识（后端定义）
  systemPreset: boolean;   // 是否系统预置
}
```

**Known Type Codes** (用于图标映射):
- `SERVER` - 服务器
- `DATABASE` - 数据库
- `GATEWAY` - 网关
- `CACHE` - 缓存
- `INFRASTRUCTURE` - 基础设施
- `SUBGRAPH` - 子图（本次范围外）

---

### ResourceAuditLog（审计日志）

资源操作历史记录。

```typescript
interface ResourceAuditLog {
  id: number;                    // 日志 ID
  resourceId: number;            // 资源 ID
  operation: AuditOperation;     // 操作类型
  operationDisplay: string;      // 操作类型显示名称
  oldValue: string | null;       // 旧值（JSON 格式）
  newValue: string | null;       // 新值（JSON 格式）
  operatorId: number;            // 操作人 ID
  operatorName: string;          // 操作人姓名
  operatedAt: string;            // 操作时间（ISO 8601）
}

type AuditOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
```

---

## API Request/Response Types

### Common Response Wrapper

```typescript
interface ApiResponse<T> {
  code: number;          // 业务码
  message: string;       // 消息
  data: T;               // 数据负载
  success: boolean;      // 是否成功
}
```

### Pagination

```typescript
interface PageResult<T> {
  content: T[];          // 数据列表
  page: number;          // 当前页码（从 1 开始）
  size: number;          // 每页大小
  totalElements: number; // 总记录数
  totalPages: number;    // 总页数
  first: boolean;        // 是否第一页
  last: boolean;         // 是否最后一页
}
```

### Resource API Types

```typescript
// 查询资源列表
interface ListResourcesRequest {
  resourceTypeId?: number;  // 可选，按类型过滤
  status?: ResourceStatus;  // 可选，按状态过滤
  keyword?: string;         // 可选，搜索关键词
  page?: number;            // 页码（从 1 开始，默认 1）
  size?: number;            // 每页大小（1-100，默认 10）
}

// 创建资源
interface CreateResourceRequest {
  name: string;             // 必填
  description?: string;     // 可选
  resourceTypeId: number;   // 必填
  attributes?: string;      // 可选，JSON 格式
}

// 更新资源
interface UpdateResourceRequest {
  id: number;               // 必填
  name?: string;            // null 表示不修改
  description?: string;     // null 表示不修改
  attributes?: string;      // null 表示不修改
  version: number;          // 必填，乐观锁
}

// 更新资源状态
interface UpdateResourceStatusRequest {
  id: number;               // 必填
  status: ResourceStatus;   // 必填
  version: number;          // 必填，乐观锁
}

// 删除资源
interface DeleteResourceRequest {
  id: number;               // 必填
  confirmName: string;      // 必填，必须匹配资源名称
}

// 获取单个资源
interface GetResourceRequest {
  id: number;               // 必填
}

// 查询审计日志
interface QueryAuditLogsRequest {
  resourceId: number;       // 必填
  page?: number;            // 页码（从 1 开始）
  size?: number;            // 每页大小
}

// 查询资源类型
interface QueryResourceTypesRequest {
  page?: number;            // 可选
  size?: number;            // 可选
}
```

---

## Frontend State Types

### Resource List State

```typescript
interface ResourceListState {
  // Data
  resources: Resource[];
  resourceTypes: ResourceType[];

  // Pagination
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };

  // Filters
  filters: {
    resourceTypeId?: number;
    status?: ResourceStatus;
    keyword?: string;
  };

  // UI State
  loading: boolean;
  error: string | null;

  // Selected Resource
  selectedResource: Resource | null;
}
```

### Resource Form State

```typescript
interface ResourceFormState {
  // Form Data
  formData: {
    name: string;
    description: string;
    resourceTypeId: number | null;
    attributes: string;
  };

  // Original Resource (for edit mode)
  originalResource: Resource | null;

  // UI State
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
}
```

### Delete Confirmation State

```typescript
interface DeleteConfirmState {
  resource: Resource | null;
  confirmNameInput: string;
  isDeleting: boolean;
  error: string | null;
}
```

---

## Type Code to Icon Mapping

```typescript
import {
  Server,
  Database,
  Shield,
  Activity,
  Cpu,
  Box,
  type LucideIcon
} from 'lucide-react';

const RESOURCE_TYPE_ICONS: Record<string, LucideIcon> = {
  SERVER: Server,
  DATABASE: Database,
  GATEWAY: Shield,
  CACHE: Activity,
  INFRASTRUCTURE: Cpu,
};

const DEFAULT_ICON: LucideIcon = Box;

function getResourceTypeIcon(typeCode: string): LucideIcon {
  return RESOURCE_TYPE_ICONS[typeCode?.toUpperCase()] || DEFAULT_ICON;
}
```

---

## Status Display Mapping

```typescript
const STATUS_CONFIG: Record<ResourceStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  RUNNING: {
    label: '运行中',
    color: 'text-green-500',
    bgColor: 'bg-green-950/20',
  },
  STOPPED: {
    label: '已停止',
    color: 'text-slate-500',
    bgColor: 'bg-slate-800/30',
  },
  MAINTENANCE: {
    label: '维护中',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-950/20',
  },
  OFFLINE: {
    label: '离线',
    color: 'text-red-500',
    bgColor: 'bg-red-950/20',
  },
};
```

---

## Relationships

```
ResourceType (1) ----< (N) Resource
    |
    └── code: 用于前端图标映射

Resource (1) ----< (N) ResourceAuditLog
    |
    └── version: 用于乐观锁控制
```

---

## Notes

1. **ID 类型**: 后端使用 `Long` (int64)，前端使用 `number` (JavaScript 安全整数范围内)
2. **时间格式**: 所有时间字段使用 ISO 8601 格式字符串
3. **JSON 属性**: `attributes` 字段存储 JSON 字符串，前端需解析后展示
4. **版本控制**: 更新操作必须携带正确的 `version` 值
