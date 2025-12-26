# Quickstart: 资源管理后端 API 对接

**Feature**: 001-resource-api-integration
**Date**: 2025-12-25

## Prerequisites

1. **Node.js** 18+ 已安装
2. **后端服务** 运行在 `http://localhost:8080`
3. **有效的 JWT Token**（通过登录接口获取）

## Quick Setup

```bash
# 1. 切换到功能分支
git checkout 001-resource-api-integration

# 2. 安装依赖（如有新增）
npm install

# 3. 配置环境变量
cp .env.example .env.development
# 编辑 .env.development 设置 VITE_API_BASE_URL=http://localhost:8080

# 4. 启动开发服务器
npm run dev
```

## Key Files to Implement

### 1. API 客户端 (`services/api/client.ts`)

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function apiPost<TReq, TRes>(
  endpoint: string,
  data: TReq
): Promise<TRes> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message || 'Request failed');
  }

  // Handle 201 (create) which returns data directly
  if (response.status === 201) {
    return response.json();
  }

  const result = await response.json();
  return result.data;
}
```

### 2. 资源服务 (`services/api/resources.ts`)

```typescript
import { apiPost } from './client';
import type {
  ListResourcesRequest,
  ResourceDTO,
  PageResult,
  // ... other types
} from './types';

export const resourceApi = {
  list: (params: ListResourcesRequest) =>
    apiPost<ListResourcesRequest, PageResult<ResourceDTO>>(
      '/api/v1/resources/query',
      params
    ),

  create: (data: CreateResourceRequest) =>
    apiPost<CreateResourceRequest, ResourceDTO>(
      '/api/v1/resources/create',
      data
    ),

  get: (id: number) =>
    apiPost<GetResourceRequest, ResourceDTO>(
      '/api/v1/resources/get',
      { id }
    ),

  update: (data: UpdateResourceRequest) =>
    apiPost<UpdateResourceRequest, ResourceDTO>(
      '/api/v1/resources/update',
      data
    ),

  delete: (id: number, confirmName: string) =>
    apiPost<DeleteResourceRequest, void>(
      '/api/v1/resources/delete',
      { id, confirmName }
    ),

  updateStatus: (data: UpdateResourceStatusRequest) =>
    apiPost<UpdateResourceStatusRequest, ResourceDTO>(
      '/api/v1/resources/update-status',
      data
    ),
};
```

### 3. 资源类型 Hook (`services/hooks/useResourceTypes.ts`)

```typescript
import { useState, useEffect } from 'react';
import { resourceApi } from '../api/resources';
import type { ResourceTypeDTO } from '../api/types';

export function useResourceTypes() {
  const [types, setTypes] = useState<ResourceTypeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resourceApi.getTypes({})
      .then(setTypes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { types, loading };
}
```

## Testing the Integration

### Manual Testing Checklist

1. **资源列表加载**
   - [ ] 页面加载时显示 loading 状态
   - [ ] 成功获取并显示资源列表
   - [ ] 分页功能正常工作
   - [ ] 搜索过滤功能正常

2. **创建资源**
   - [ ] 资源类型下拉从 API 动态获取
   - [ ] 表单验证正常工作
   - [ ] 创建成功后刷新列表
   - [ ] 名称重复时显示错误

3. **编辑资源**
   - [ ] 编辑表单预填充当前数据
   - [ ] 更新成功后刷新列表
   - [ ] 版本冲突时显示提示

4. **删除资源**
   - [ ] 确认对话框显示资源名称
   - [ ] 名称输入匹配校验
   - [ ] 删除成功后从列表移除

5. **错误处理**
   - [ ] 401 错误提示重新登录
   - [ ] 403 错误提示无权限
   - [ ] 网络错误显示重试按钮

### E2E Test Command

```bash
# 运行 Playwright 测试
npx playwright test tests/e2e/resources.spec.ts
```

## API Documentation

- **Swagger UI**: http://localhost:8080/swagger-ui/index.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

## Troubleshooting

### CORS 错误

确保后端配置了 CORS 允许来自 `http://localhost:3000` 的请求。

### 401 Unauthorized

检查 JWT Token 是否有效，可能需要重新登录获取新 Token。

### 版本冲突 (409)

编辑资源时出现版本冲突，说明数据已被其他用户修改。刷新页面获取最新数据后重试。

## References

- [Feature Spec](./spec.md)
- [Implementation Plan](./plan.md)
- [Research Notes](./research.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/)
