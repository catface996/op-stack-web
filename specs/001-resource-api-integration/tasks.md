# Tasks: 资源管理后端 API 对接

**Feature**: 001-resource-api-integration
**Generated**: 2025-12-25
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Overview

本任务清单基于 6 个用户故事组织，优先级从 P1 到 P3，确保按依赖顺序实现。

## Task Summary

| Phase | Description | Task Count | Priority |
|-------|-------------|------------|----------|
| 0 | 基础设施准备 | 3 | Setup |
| 1 | API 基础层 | 4 | Foundation |
| 2 | US1 - 查看资源列表 | 5 | P1 |
| 3 | US2 - 创建新资源 | 4 | P1 |
| 4 | US3 - 编辑资源信息 | 3 | P2 |
| 5 | US4 - 删除资源 | 3 | P2 |
| 6 | US5 - 查看资源详情 | 3 | P3 |
| 7 | US6 - 更新资源状态 | 2 | P3 |
| 8 | 收尾与测试 | 3 | Final |

---

## Phase 0: 基础设施准备

### Task 0.1: 配置环境变量

**File**: `.env.development`, `.env.example`
**Type**: Configuration
**Dependencies**: None
**Acceptance**: 环境变量文件存在，包含 `VITE_API_BASE_URL`

**Steps**:
1. 创建 `.env.development` 文件（如不存在）
2. 添加 `VITE_API_BASE_URL=http://localhost:8080`
3. 创建 `.env.example` 作为模板

**Code Reference**:
```env
# .env.development
VITE_API_BASE_URL=http://localhost:8080
```

---

### Task 0.2: 创建 services 目录结构

**File**: `services/api/`, `services/hooks/`
**Type**: Structure
**Dependencies**: None
**Acceptance**: 目录结构存在

**Steps**:
1. 创建 `services/api/` 目录
2. 创建 `services/hooks/` 目录

---

### Task 0.3: 添加 Vite 环境类型声明

**File**: `vite-env.d.ts` 或 `env.d.ts`
**Type**: TypeScript
**Dependencies**: Task 0.1
**Acceptance**: TypeScript 能识别 `import.meta.env.VITE_API_BASE_URL`

**Steps**:
1. 检查是否存在 `vite-env.d.ts`
2. 如需要，添加 `ImportMetaEnv` 接口声明

---

## Phase 1: API 基础层

### Task 1.1: 创建 API 类型定义

**File**: `services/api/types.ts`
**Type**: TypeScript
**Dependencies**: Phase 0
**Acceptance**: 所有 API 相关类型已定义，无 TypeScript 错误
**Reference**: [contracts/api-types.ts](./contracts/api-types.ts)

**Steps**:
1. 从 `contracts/api-types.ts` 复制类型定义
2. 导出所有类型供其他模块使用

**Key Types**:
- `ApiResponse<T>`, `PageResult<T>`
- `ResourceDTO`, `ResourceTypeDTO`, `ResourceAuditLogDTO`
- `ResourceStatus`, `AuditOperation`
- 所有 Request 类型
- `ApiError`, `HTTP_STATUS`, `ERROR_MESSAGES`

---

### Task 1.2: 创建 HTTP 客户端

**File**: `services/api/client.ts`
**Type**: TypeScript
**Dependencies**: Task 1.1, Task 0.1
**Acceptance**: HTTP 客户端能发送 POST 请求，自动附加 JWT Token
**Reference**: [quickstart.md](./quickstart.md)

**Steps**:
1. 创建 `API_BASE_URL` 常量（从环境变量读取）
2. 实现 `setAuthToken(token: string | null)` 函数
3. 实现 `ApiError` 类（包含 status 和 message）
4. 实现 `apiPost<TReq, TRes>(endpoint, data)` 泛型函数
5. 处理 HTTP 错误，映射为中文错误消息

**Code Skeleton**:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
let authToken: string | null = null;

export function setAuthToken(token: string | null) { ... }

export class ApiError extends Error {
  constructor(public status: number, message: string) { ... }
}

export async function apiPost<TReq, TRes>(endpoint: string, data: TReq): Promise<TRes> {
  // 1. 构建请求 headers（Content-Type, Authorization）
  // 2. 发送 fetch POST 请求
  // 3. 处理非 2xx 响应，抛出 ApiError
  // 4. 处理 201 响应（直接返回 data）
  // 5. 处理 200 响应（返回 result.data）
}
```

---

### Task 1.3: 创建资源 API 服务

**File**: `services/api/resources.ts`
**Type**: TypeScript
**Dependencies**: Task 1.1, Task 1.2
**Acceptance**: 所有 8 个 API 端点均已封装
**Reference**: [contracts/api-endpoints.md](./contracts/api-endpoints.md)

**Steps**:
1. 导入 `apiPost` 和相关类型
2. 实现 `resourceApi` 对象，包含以下方法：
   - `list(params)` → `/api/v1/resources/query`
   - `create(data)` → `/api/v1/resources/create`
   - `get(id)` → `/api/v1/resources/get`
   - `update(data)` → `/api/v1/resources/update`
   - `delete(id, confirmName)` → `/api/v1/resources/delete`
   - `updateStatus(data)` → `/api/v1/resources/update-status`
   - `getTypes(params)` → `/api/v1/resource-types/query`
   - `getAuditLogs(params)` → `/api/v1/resources/audit-logs/query`

---

### Task 1.4: 创建资源类型图标映射

**File**: `services/api/resources.ts` (追加)
**Type**: TypeScript
**Dependencies**: Task 1.3
**Acceptance**: 能根据 typeCode 返回对应的 Lucide 图标组件
**Reference**: [data-model.md](./data-model.md)

**Steps**:
1. 导入 Lucide-React 图标（Server, Database, Shield, Activity, Cpu, Box）
2. 创建 `RESOURCE_TYPE_ICONS` 映射表
3. 导出 `getResourceTypeIcon(typeCode: string)` 函数

---

## Phase 2: US1 - 查看资源列表 (P1)

> **User Story**: 作为运维工程师，我需要查看系统中所有已注册的基础设施资源列表

### Task 2.1: 创建 useResourceTypes Hook

**File**: `services/hooks/useResourceTypes.ts`
**Type**: React Hook
**Dependencies**: Task 1.3
**Acceptance**: Hook 能获取并返回资源类型列表，包含 loading 状态
**Reference**: [quickstart.md](./quickstart.md)

**Steps**:
1. 创建 `useResourceTypes()` Hook
2. 使用 `useState` 管理 types 和 loading 状态
3. 使用 `useEffect` 在组件挂载时调用 `resourceApi.getTypes({})`
4. 处理错误并设置 loading 状态

---

### Task 2.2: 创建 useResources Hook

**File**: `services/hooks/useResources.ts`
**Type**: React Hook
**Dependencies**: Task 1.3
**Acceptance**: Hook 能获取分页资源列表，支持过滤和刷新

**Steps**:
1. 创建 `useResources(filters)` Hook
2. 管理 resources, pagination, loading, error 状态
3. 实现 `fetchResources()` 函数，调用 `resourceApi.list()`
4. 实现 `refresh()` 函数供外部调用
5. 使用 `useEffect` 在 filters 变化时重新获取数据

**State Interface**:
```typescript
interface UseResourcesResult {
  resources: ResourceDTO[];
  pagination: { page: number; size: number; totalElements: number; totalPages: number };
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
}
```

---

### Task 2.3: 修改 ResourceManagement 组件 - 数据层

**File**: `components/ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Task 2.1, Task 2.2
**Acceptance**: 资源列表从 API 获取，显示 loading 状态

**Steps**:
1. 导入 `useResources` 和 `useResourceTypes` Hooks
2. 替换本地 nodes 状态为 API 数据
3. 添加 loading 状态显示
4. 添加 error 状态显示和重试按钮
5. 移除硬编码的资源类型，使用 API 返回的类型列表

---

### Task 2.4: 修改 ResourceManagement 组件 - 过滤功能

**File**: `components/ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Task 2.3
**Acceptance**: 搜索和类型过滤通过后端 API 实现

**Steps**:
1. 修改搜索功能，使用 `keyword` 参数调用 API
2. 添加防抖处理（300ms）避免频繁请求
3. 修改类型过滤，使用 `resourceTypeId` 参数
4. 修改状态过滤，使用 `status` 参数
5. 过滤条件变化时重置到第一页

---

### Task 2.5: 修改 ResourceManagement 组件 - 分页功能

**File**: `components/ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Task 2.3
**Acceptance**: 分页控件能切换页码，显示总数信息

**Steps**:
1. 添加分页 UI 组件（如不存在）
2. 显示当前页/总页数和总记录数
3. 实现页码切换逻辑
4. 实现每页数量切换逻辑

---

## Phase 3: US2 - 创建新资源 (P1)

> **User Story**: 作为运维工程师，我需要能够添加新的基础设施资源到系统中

### Task 3.1: 修改资源创建表单 - 类型下拉

**File**: `components/ResourceManagement.tsx` (或独立表单组件)
**Type**: React Component (修改)
**Dependencies**: Task 2.1
**Acceptance**: 资源类型下拉从 API 动态获取

**Steps**:
1. 在表单中使用 `useResourceTypes` 获取类型列表
2. 渲染类型下拉选项
3. 处理类型列表加载中状态

---

### Task 3.2: 修改资源创建表单 - 验证逻辑

**File**: `components/ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Task 3.1
**Acceptance**: 表单验证符合后端要求

**Steps**:
1. 添加 name 必填验证（1-100 字符）
2. 添加 description 长度验证（最大 500 字符）
3. 添加 resourceTypeId 必填验证
4. 添加 attributes JSON 格式验证（如有输入）

---

### Task 3.3: 修改资源创建表单 - API 调用

**File**: `components/ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Task 3.2, Task 1.3
**Acceptance**: 创建成功后刷新列表，错误正确显示

**Steps**:
1. 替换本地创建逻辑为 `resourceApi.create()` 调用
2. 处理 201 成功响应，关闭表单并刷新列表
3. 处理 409 错误（名称重复），显示错误提示
4. 处理其他错误，显示友好提示

---

### Task 3.4: 添加创建操作 loading 状态

**File**: `components/ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Task 3.3
**Acceptance**: 创建过程中显示 loading，禁用提交按钮

**Steps**:
1. 添加 isSubmitting 状态
2. 提交时设置 loading 状态
3. 完成或错误时恢复按钮状态

---

## Phase 4: US3 - 编辑资源信息 (P2)

> **User Story**: 作为运维工程师，我需要能够修改现有资源的信息

### Task 4.1: 实现编辑表单数据预填充

**File**: `components/ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Phase 3, Task 1.3
**Acceptance**: 编辑表单正确预填充当前资源数据

**Steps**:
1. 点击编辑时，调用 `resourceApi.get(id)` 获取最新数据
2. 将返回数据填充到表单
3. 保存原始 version 用于乐观锁

---

### Task 4.2: 实现编辑 API 调用

**File**: `components/ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Task 4.1
**Acceptance**: 更新成功后刷新列表，版本冲突正确处理

**Steps**:
1. 提交时调用 `resourceApi.update()` 携带 version
2. 处理成功响应，关闭表单并刷新列表
3. 处理 409 版本冲突，提示用户刷新后重试
4. 处理其他错误

---

### Task 4.3: 添加编辑取消功能

**File**: `components/ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Task 4.1
**Acceptance**: 取消编辑不保存任何变更

**Steps**:
1. 确保取消按钮清除表单状态
2. 不发送任何 API 请求

---

## Phase 5: US4 - 删除资源 (P2)

> **User Story**: 作为运维工程师，我需要能够删除不再需要的资源记录

### Task 5.1: 创建删除确认对话框

**File**: `components/ResourceManagement.tsx` (或独立组件)
**Type**: React Component (新增/修改)
**Dependencies**: Phase 4
**Acceptance**: 对话框显示资源名称，要求输入确认

**Steps**:
1. 创建 DeleteConfirmDialog 组件
2. 显示待删除资源的名称
3. 提供输入框让用户输入确认名称
4. 输入匹配时启用"确认删除"按钮

---

### Task 5.2: 实现删除 API 调用

**File**: `components/ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Task 5.1, Task 1.3
**Acceptance**: 删除成功后从列表移除，错误正确显示

**Steps**:
1. 调用 `resourceApi.delete(id, confirmName)`
2. 处理成功响应，关闭对话框并刷新列表
3. 处理 400 错误（名称不匹配）
4. 处理 403/404 错误

---

### Task 5.3: 添加删除操作 loading 状态

**File**: `components/ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Task 5.2
**Acceptance**: 删除过程中显示 loading，禁用按钮

**Steps**:
1. 添加 isDeleting 状态
2. 删除过程中禁用确认按钮
3. 完成后恢复状态

---

## Phase 6: US5 - 查看资源详情 (P3)

> **User Story**: 作为运维工程师，我需要查看单个资源的详细信息，包括其扩展属性和审计历史

### Task 6.1: 修改 ResourceDetailView 组件 - API 获取详情

**File**: `components/ResourceDetailView.tsx`
**Type**: React Component (修改)
**Dependencies**: Phase 5, Task 1.3
**Acceptance**: 详情从 API 获取，不依赖列表传递的完整对象

**Steps**:
1. 修改组件接收 resourceId 而非完整对象
2. 使用 `resourceApi.get(id)` 获取详情
3. 添加 loading 状态显示
4. 添加 error 状态处理

---

### Task 6.2: 创建 useResourceAuditLogs Hook

**File**: `services/hooks/useResourceAuditLogs.ts`
**Type**: React Hook
**Dependencies**: Task 1.3
**Acceptance**: Hook 能获取指定资源的审计日志列表

**Steps**:
1. 创建 `useResourceAuditLogs(resourceId)` Hook
2. 调用 `resourceApi.getAuditLogs({ resourceId })`
3. 管理 logs, loading, pagination 状态

---

### Task 6.3: 添加审计日志标签页

**File**: `components/ResourceDetailView.tsx`
**Type**: React Component (修改)
**Dependencies**: Task 6.2
**Acceptance**: 详情页显示审计日志标签页

**Steps**:
1. 添加审计日志标签页 UI
2. 使用 `useResourceAuditLogs` Hook 获取数据
3. 展示操作类型、操作人、操作时间
4. 可选：展示 oldValue/newValue 变更对比

---

## Phase 7: US6 - 更新资源状态 (P3)

> **User Story**: 作为运维工程师，我需要能够快速更新资源的运行状态

### Task 7.1: 添加状态切换 UI

**File**: `components/ResourceDetailView.tsx` 或 `ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Phase 6
**Acceptance**: 用户能从 UI 切换资源状态

**Steps**:
1. 添加状态下拉选择器或按钮组
2. 显示当前状态
3. 提供 RUNNING/STOPPED/MAINTENANCE/OFFLINE 选项

---

### Task 7.2: 实现状态更新 API 调用

**File**: `components/ResourceDetailView.tsx` 或 `ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Task 7.1, Task 1.3
**Acceptance**: 状态更新成功后界面刷新

**Steps**:
1. 调用 `resourceApi.updateStatus({ id, status, version })`
2. 处理成功响应，更新 UI
3. 处理 409 版本冲突
4. 处理其他错误

---

## Phase 8: 收尾与测试

### Task 8.1: 统一错误处理

**File**: 各组件
**Type**: Cross-cutting
**Dependencies**: Phase 7
**Acceptance**: 所有 API 错误显示用户友好的中文消息

**Steps**:
1. 检查所有 API 调用点的错误处理
2. 确保 401 错误提示重新登录
3. 确保 403 错误提示无权限
4. 确保网络错误显示重试选项

---

### Task 8.2: 添加空状态处理

**File**: `components/ResourceManagement.tsx`
**Type**: React Component (修改)
**Dependencies**: Phase 7
**Acceptance**: 列表为空或搜索无结果时显示友好提示

**Steps**:
1. 添加空列表状态 UI
2. 添加搜索无结果状态 UI
3. 引导用户创建第一个资源

---

### Task 8.3: 编写 E2E 测试

**File**: `tests/e2e/resources.spec.ts`
**Type**: Test
**Dependencies**: Task 8.2
**Acceptance**: 核心用户流程测试通过

**Steps**:
1. 测试资源列表加载
2. 测试资源创建流程
3. 测试资源编辑流程
4. 测试资源删除流程
5. 测试搜索和过滤功能
6. 测试错误处理场景

---

## Dependency Graph

```
Phase 0 (Setup)
    ├── 0.1 环境变量
    ├── 0.2 目录结构
    └── 0.3 类型声明
           │
           v
Phase 1 (API Foundation)
    ├── 1.1 类型定义 ────────┐
    │                        │
    ├── 1.2 HTTP 客户端 <────┤
    │                        │
    └── 1.3 资源 API 服务 <──┘
           │
           ├── 1.4 图标映射
           │
           v
Phase 2 (US1: 资源列表)
    ├── 2.1 useResourceTypes Hook
    ├── 2.2 useResources Hook
    ├── 2.3 数据层改造
    ├── 2.4 过滤功能
    └── 2.5 分页功能
           │
           v
Phase 3 (US2: 创建资源)
    ├── 3.1 类型下拉
    ├── 3.2 验证逻辑
    ├── 3.3 API 调用
    └── 3.4 Loading 状态
           │
           v
Phase 4 (US3: 编辑资源)
    ├── 4.1 数据预填充
    ├── 4.2 API 调用
    └── 4.3 取消功能
           │
           v
Phase 5 (US4: 删除资源)
    ├── 5.1 确认对话框
    ├── 5.2 API 调用
    └── 5.3 Loading 状态
           │
           v
Phase 6 (US5: 资源详情)
    ├── 6.1 详情获取
    ├── 6.2 审计日志 Hook
    └── 6.3 审计日志 UI
           │
           v
Phase 7 (US6: 状态更新)
    ├── 7.1 状态切换 UI
    └── 7.2 API 调用
           │
           v
Phase 8 (Final)
    ├── 8.1 错误处理
    ├── 8.2 空状态
    └── 8.3 E2E 测试
```

---

## Checklist Summary

- [x] Phase 0: 基础设施准备 (3 tasks)
- [x] Phase 1: API 基础层 (4 tasks)
- [x] Phase 2: US1 - 查看资源列表 (5 tasks)
- [x] Phase 3: US2 - 创建新资源 (4 tasks)
- [x] Phase 4: US3 - 编辑资源信息 (3 tasks)
- [x] Phase 5: US4 - 删除资源 (3 tasks)
- [x] Phase 6: US5 - 查看资源详情 (3 tasks)
- [x] Phase 7: US6 - 更新资源状态 (2 tasks)
- [x] Phase 8: 收尾与测试 (3 tasks)

**Total**: 30 tasks across 9 phases
