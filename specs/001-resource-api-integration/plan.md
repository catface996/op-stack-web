# Implementation Plan: 资源管理后端 API 对接

**Branch**: `001-resource-api-integration` | **Date**: 2025-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-resource-api-integration/spec.md`

## Summary

将现有的资源管理前端组件（ResourceManagement、ResourceDetailView）从使用模拟数据改为对接后端 RESTful API。核心改动包括：创建 API 服务层封装所有后端调用，实现动态资源类型获取，处理各类 HTTP 错误码，以及支持乐观锁和安全删除确认机制。

## Technical Context

**Language/Version**: TypeScript 5.8, React 18.2
**Primary Dependencies**: React, Vite 6.2, Lucide-React (icons)
**Storage**: N/A (后端 API 提供数据持久化)
**Testing**: Playwright (已配置)
**Target Platform**: Web Browser (Vite dev server port 3000)
**Project Type**: Web frontend (单页应用)
**Performance Goals**: 资源列表加载 < 3 秒，API 调用成功率 > 95%
**Constraints**: 需兼容现有 UI 组件结构，保持现有样式风格
**Scale/Scope**: 支持管理 1000+ 资源，6 个用户故事，8 个 API 端点

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: Constitution 文件使用模板占位符，未定义具体项目约束。以下为通用最佳实践检查：

| Gate | Status | Notes |
|------|--------|-------|
| 代码复用 | PASS | 复用现有 UI 组件，新增 API 服务层 |
| 测试覆盖 | PASS | 使用 Playwright 进行 E2E 测试 |
| 错误处理 | PASS | 规格说明定义了完整的错误码处理 |
| 类型安全 | PASS | TypeScript 强类型，定义 API 响应类型 |

## Project Structure

### Documentation (this feature)

```text
specs/001-resource-api-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API 类型定义)
└── tasks.md             # Phase 2 output (由 /speckit.tasks 生成)
```

### Source Code (repository root)

```text
# 现有项目结构 (保持不变)
/
├── App.tsx                    # 主应用组件
├── index.tsx                  # 入口文件
├── types.ts                   # 类型定义
├── components/
│   ├── ResourceManagement.tsx # 资源列表管理 (需修改)
│   ├── ResourceDetailView.tsx # 资源详情视图 (需修改)
│   └── ui/
│       └── StyledSelect.tsx   # 下拉组件 (复用)
└── services/
    ├── geminiService.ts       # 现有 AI 服务
    └── mockData.ts            # 模拟数据 (将被替代)

# 新增文件
/
├── services/
│   ├── api/
│   │   ├── client.ts          # HTTP 客户端封装 (含 JWT 处理)
│   │   ├── resources.ts       # 资源 API 服务
│   │   └── types.ts           # API 请求/响应类型
│   └── hooks/
│       ├── useResources.ts    # 资源列表 Hook
│       └── useResourceTypes.ts # 资源类型 Hook
└── tests/
    └── e2e/
        └── resources.spec.ts  # E2E 测试
```

**Structure Decision**: 采用分层服务架构，将 API 调用封装在 `services/api/` 目录下，使用 React Hooks 提供数据访问接口，保持组件层的简洁。

## Complexity Tracking

> **无违规需要说明** - 本功能为标准前端 API 集成，无特殊复杂度引入。
