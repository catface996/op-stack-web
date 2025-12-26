# Research: 资源管理后端 API 对接

**Feature**: 001-resource-api-integration
**Date**: 2025-12-25

## Research Summary

本文档记录了在实施资源管理 API 对接功能前进行的技术研究和决策。

---

## 1. HTTP 客户端选择

### Decision: 使用原生 Fetch API

### Rationale
- 项目当前无 HTTP 客户端依赖（无 axios 等）
- 现代浏览器原生支持 Fetch API
- 减少项目依赖，保持轻量
- TypeScript 类型支持良好

### Alternatives Considered
| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| Fetch API | 原生支持、无依赖、体积小 | 需手动封装错误处理 | **选用** |
| Axios | 拦截器方便、自动转换 | 增加依赖、项目未使用 | 不选用 |
| ky | 轻量、基于 Fetch | 额外依赖、团队不熟悉 | 不选用 |

---

## 2. 状态管理方案

### Decision: 使用 React Hooks + Context（局部状态）

### Rationale
- 项目当前未使用全局状态管理库（无 Redux/Zustand）
- 资源管理功能相对独立，不需要跨组件共享复杂状态
- 使用自定义 Hooks 封装 API 调用逻辑，保持组件简洁
- 可选配合 Context 在资源管理模块内共享状态

### Alternatives Considered
| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| React Hooks + 局部状态 | 简单、无依赖、易维护 | 跨组件共享需传递 props | **选用** |
| React Query/SWR | 缓存、自动重试 | 新增依赖、学习成本 | 未来可考虑 |
| Zustand/Redux | 全局状态管理 | 过度设计、项目无此需求 | 不选用 |

---

## 3. JWT Token 管理

### Decision: 从外部获取 Token，API 客户端统一注入

### Rationale
- 根据规格说明假设：用户已通过系统认证，JWT Token 存储在前端
- 现有项目可能已有认证机制（AuthPage.tsx 组件存在）
- API 客户端提供统一的 Token 注入点，便于后续集成

### Implementation Approach
```typescript
// services/api/client.ts
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options?.headers,
  };
  // ...
}
```

---

## 4. 错误处理策略

### Decision: 统一错误类型 + 错误码映射

### Rationale
- 后端使用统一响应格式：`{ code, message, data, success }`
- 需要将 HTTP 错误码映射为用户友好的中文消息
- 区分网络错误、业务错误、认证错误

### Error Mapping
| HTTP Code | 业务场景 | 用户提示 |
|-----------|----------|----------|
| 400 | 参数无效 | 显示后端返回的具体错误信息 |
| 401 | 未认证/Token 过期 | "登录已过期，请重新登录" |
| 403 | 无权限 | "您没有权限执行此操作" |
| 404 | 资源不存在 | "请求的资源不存在" |
| 409 | 冲突（名称重复/版本冲突） | 显示后端返回的具体错误信息 |
| 500+ | 服务器错误 | "服务暂时不可用，请稍后重试" |
| Network Error | 网络问题 | "网络连接失败，请检查网络" |

---

## 5. 资源类型图标映射

### Decision: 基于 typeCode 的静态映射表

### Rationale
- 后端 ResourceType 包含 `code` 字段（如 SERVER、DATABASE 等）
- 前端使用 Lucide-React 图标库
- 创建 typeCode 到图标的映射表，未知类型使用默认图标

### Implementation Approach
```typescript
// services/api/resources.ts
import { Server, Database, Shield, Activity, Cpu, Box } from 'lucide-react';

export const RESOURCE_TYPE_ICONS: Record<string, typeof Server> = {
  SERVER: Server,
  DATABASE: Database,
  GATEWAY: Shield,
  CACHE: Activity,
  INFRASTRUCTURE: Cpu,
};

export function getResourceTypeIcon(typeCode: string) {
  return RESOURCE_TYPE_ICONS[typeCode.toUpperCase()] || Box;
}
```

---

## 6. 分页实现方案

### Decision: 后端分页 + 前端状态控制

### Rationale
- 后端 API 支持分页（page 从 1 开始，size 1-100）
- 前端维护当前页码和每页数量状态
- 搜索/过滤时重置到第一页

### State Structure
```typescript
interface PaginationState {
  page: number;      // 当前页（从 1 开始）
  size: number;      // 每页数量
  totalElements: number;
  totalPages: number;
}
```

---

## 7. 乐观锁处理

### Decision: 更新时携带 version，冲突时提示刷新

### Rationale
- 后端使用 version 字段实现乐观锁
- 编辑资源时需保存原始 version
- 409 冲突时提示用户数据已被修改，引导刷新后重试

### Implementation Approach
1. 获取资源详情时保存 version
2. 更新请求携带 version 字段
3. 捕获 409 错误，显示冲突提示
4. 用户确认后重新加载最新数据

---

## 8. 删除确认机制

### Decision: 弹窗输入资源名称确认

### Rationale
- 后端要求 `confirmName` 必须与资源名称完全匹配
- 防止误删除重要资源
- UI 设计：弹窗显示资源名称，用户需手动输入确认

### Implementation Approach
1. 点击删除按钮，弹出确认对话框
2. 显示待删除资源的名称
3. 用户输入框需完全匹配资源名称
4. 匹配成功后启用"确认删除"按钮
5. 调用 API 携带 id 和 confirmName

---

## 9. API 基础地址配置

### Decision: 使用环境变量配置

### Rationale
- 开发环境：localhost:8080
- 生产环境：待定（可能不同域名）
- 通过 Vite 环境变量实现配置

### Implementation Approach
```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:8080

// .env.production
VITE_API_BASE_URL=https://api.example.com

// services/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
```

---

## 10. 现有组件适配分析

### ResourceManagement.tsx 改动点

| 当前实现 | 改动方向 |
|----------|----------|
| 硬编码资源类型（Database/Service/Gateway/Cache/Infrastructure） | 从 API 动态获取资源类型列表 |
| 本地 nodes 状态 | 改为 API 数据 + 本地缓存 |
| 本地搜索过滤 | 改为后端 keyword 参数 |
| 本地分页 | 改为后端分页 |
| 直接调用 onAdd/onUpdate/onDelete | 改为调用 API 服务 |

### ResourceDetailView.tsx 改动点

| 当前实现 | 改动方向 |
|----------|----------|
| 接收完整 node 对象 | 改为接收 resourceId，调用 API 获取详情 |
| 无审计日志功能 | 新增审计日志标签页，调用 audit-logs API |
| 无状态更新功能 | 新增状态切换下拉，调用 update-status API |

---

## Resolved Clarifications

本研究解决了以下技术决策点：

1. ✅ HTTP 客户端：原生 Fetch API
2. ✅ 状态管理：React Hooks + 局部状态
3. ✅ Token 管理：统一注入机制
4. ✅ 错误处理：错误码映射表
5. ✅ 图标映射：typeCode 静态映射
6. ✅ 分页方案：后端分页
7. ✅ 乐观锁：version 字段 + 冲突提示
8. ✅ 删除确认：名称输入验证
9. ✅ API 配置：环境变量
10. ✅ 组件适配：明确改动点

**无需进一步澄清，可进入 Phase 1 设计阶段。**
