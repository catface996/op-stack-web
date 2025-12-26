# Feature Specification: 资源管理后端 API 对接

**Feature Branch**: `001-resource-api-integration`
**Created**: 2025-12-25
**Status**: Draft
**Input**: User description: "当前项目，资源管理部分，需要对接后端接口，后端接口的swagger文档是：http://localhost:8080/swagger-ui/index.html#/%E8%B5%84%E6%BA%90%E7%AE%A1%E7%90%86"

## Clarifications

### Session 2025-12-25

- Q: 后端 API 基础路径是什么？ → A: `/api/v1` (带版本号，已通过 OpenAPI 文档确认)
- Q: 前端资源类型如何适配后端动态类型？ → A: 完全适配后端，资源类型从 API 动态获取，UI 图标根据 typeCode 映射
- Q: 本次功能范围？ → A: 仅实现资源 CRUD（创建、查询、更新、删除、状态管理、审计日志），资源关系和子图管理留待后续迭代

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 查看资源列表 (Priority: P1)

作为运维工程师，我需要查看系统中所有已注册的基础设施资源列表，以便了解当前系统的资源状态和配置情况。

**Why this priority**: 这是资源管理的核心功能，用户必须首先能够看到资源列表才能进行后续操作。这是所有其他资源操作的基础。

**Independent Test**: 可以通过访问资源管理页面，验证能否从后端获取并展示资源列表来测试。即使没有其他功能，用户也能获得资源总览的价值。

**Acceptance Scenarios**:

1. **Given** 用户已登录系统并进入资源管理页面，**When** 页面加载完成，**Then** 系统调用 `POST /api/v1/resources/query` 获取资源列表，显示资源名称、类型、状态等信息
2. **Given** 用户在资源管理页面，**When** 资源列表超过单页显示数量，**Then** 系统提供分页功能（页码从 1 开始），用户可以翻页查看所有资源
3. **Given** 用户在资源管理页面，**When** 用户在搜索框输入关键词，**Then** 系统通过 `keyword` 参数调用后端 API 进行服务端搜索过滤
4. **Given** 用户在资源管理页面，**When** 后端服务不可用，**Then** 系统显示友好的错误提示，告知用户无法获取数据

---

### User Story 2 - 创建新资源 (Priority: P1)

作为运维工程师，我需要能够添加新的基础设施资源到系统中，以便系统能够跟踪和管理这些资源。

**Why this priority**: 创建资源是数据入口，没有创建功能，系统将无法积累和管理资源数据，这是核心业务功能。

**Independent Test**: 可以通过点击添加按钮、填写表单、提交数据，验证资源是否成功创建并出现在列表中来测试。

**Acceptance Scenarios**:

1. **Given** 用户在资源管理页面，**When** 用户点击"添加资源"按钮，**Then** 系统弹出资源创建表单，并调用 `POST /api/v1/resource-types/query` 获取可用的资源类型列表
2. **Given** 用户已打开资源创建表单，**When** 用户填写完整的资源信息（名称、资源类型 ID、可选描述和扩展属性）并提交，**Then** 系统调用 `POST /api/v1/resources/create`，成功后（HTTP 201）关闭表单并刷新列表
3. **Given** 用户已打开资源创建表单，**When** 用户提交的数据不完整或格式错误，**Then** 系统显示相应的验证错误信息（名称必填，最大 100 字符；描述最大 500 字符）
4. **Given** 用户已提交创建请求，**When** 后端返回 409 错误（资源名称已存在），**Then** 系统显示"资源名称已存在"的错误提示

---

### User Story 3 - 编辑资源信息 (Priority: P2)

作为运维工程师，我需要能够修改现有资源的信息，以便在资源配置变更时保持数据准确性。

**Why this priority**: 编辑功能允许用户修正错误和更新变化，是维护数据准确性的必要功能，但优先级略低于创建和查看。

**Independent Test**: 可以通过选择一个资源、修改其属性、保存变更，验证变更是否持久化到后端来测试。

**Acceptance Scenarios**:

1. **Given** 用户在资源列表中，**When** 用户点击某资源的编辑按钮，**Then** 系统调用 `POST /api/v1/resources/get` 获取最新数据，打开预填充该资源当前数据的编辑表单
2. **Given** 用户在编辑表单中，**When** 用户修改信息并保存，**Then** 系统调用 `POST /api/v1/resources/update`（携带当前 version），成功后关闭表单并刷新列表
3. **Given** 用户正在编辑资源，**When** 后端返回 409 版本冲突错误，**Then** 系统提示"数据已被其他用户修改，请刷新后重试"
4. **Given** 用户正在编辑资源，**When** 用户取消编辑，**Then** 系统关闭表单，不保存任何变更

---

### User Story 4 - 删除资源 (Priority: P2)

作为运维工程师，我需要能够删除不再需要的资源记录，以保持系统数据的整洁。

**Why this priority**: 删除功能帮助维护数据质量，但需要谨慎操作，因此优先级在创建和编辑之后。

**Independent Test**: 可以通过选择一个资源、确认删除操作，验证资源是否从后端移除来测试。

**Acceptance Scenarios**:

1. **Given** 用户在资源列表中，**When** 用户点击某资源的删除按钮，**Then** 系统弹出确认对话框，要求用户输入资源名称以确认删除
2. **Given** 用户看到删除确认对话框，**When** 用户输入正确的资源名称并确认，**Then** 系统调用 `POST /api/v1/resources/delete`（携带 id 和 confirmName），成功后关闭对话框并从列表中移除该资源
3. **Given** 用户看到删除确认对话框，**When** 用户输入的资源名称不匹配，**Then** 系统显示"资源名称确认不匹配"错误，不执行删除
4. **Given** 用户看到删除确认对话框，**When** 用户取消操作，**Then** 系统关闭对话框，不执行删除

---

### User Story 5 - 查看资源详情 (Priority: P3)

作为运维工程师，我需要查看单个资源的详细信息，包括其扩展属性和审计历史。

**Why this priority**: 详情查看是深度信息获取功能，在基本的增删改查功能完成后提供更丰富的信息展示。

**Independent Test**: 可以通过点击资源卡片进入详情页，验证是否能展示完整的资源详细信息来测试。

**Acceptance Scenarios**:

1. **Given** 用户在资源列表中，**When** 用户点击某资源进入详情视图，**Then** 系统调用 `POST /api/v1/resources/get` 获取该资源的完整信息并展示
2. **Given** 用户在资源详情页面，**When** 用户查看审计日志标签页，**Then** 系统调用 `POST /api/v1/resources/audit-logs/query` 展示该资源的操作历史

---

### User Story 6 - 更新资源状态 (Priority: P3)

作为运维工程师，我需要能够快速更新资源的运行状态，以反映资源的实际运行情况。

**Why this priority**: 状态更新是资源运维的常见操作，但不如基本 CRUD 功能优先。

**Independent Test**: 可以通过在资源详情或列表中切换状态，验证状态变更是否持久化来测试。

**Acceptance Scenarios**:

1. **Given** 用户在资源详情或列表中，**When** 用户选择更改资源状态（RUNNING/STOPPED/MAINTENANCE/OFFLINE），**Then** 系统调用 `POST /api/v1/resources/update-status` 更新状态
2. **Given** 状态更新请求已发送，**When** 后端返回成功，**Then** 系统更新界面显示新状态

---

### Edge Cases

- 当后端服务不可用时，系统显示"服务暂时不可用，请稍后重试"的错误提示，并提供重试按钮
- 当网络请求超时（超过 30 秒）时，系统自动中断请求并提示用户网络连接问题
- 当用户尝试创建重复名称的资源时，系统显示后端返回的 409 冲突错误信息
- 当资源列表为空时，系统显示空状态提示，引导用户创建第一个资源
- 当用户搜索无匹配结果时，系统显示"未找到匹配的资源"提示
- 当删除操作失败（如资源被其他实体引用或权限不足）时，系统显示具体的失败原因（403/404）
- 当编辑时发生版本冲突（409），系统提示用户刷新后重试
- 当用户无权限操作时（401/403），系统显示相应的权限错误提示

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须通过 `POST /api/v1/resources/query` 获取资源列表数据，支持按资源类型 ID、状态、关键词过滤
- **FR-002**: 系统必须支持资源列表的分页展示，分页参数为 `page`（从 1 开始）和 `size`（1-100）
- **FR-003**: 系统必须通过后端 API 的 `keyword` 参数实现服务端搜索过滤
- **FR-004**: 系统必须通过 `POST /api/v1/resources/create` 创建新资源，必填字段：name、resourceTypeId
- **FR-005**: 系统必须通过 `POST /api/v1/resource-types/query` 动态获取可用的资源类型列表，并用于资源创建/编辑表单的类型选择
- **FR-005a**: 系统必须根据资源类型的 `code` 字段映射对应的 UI 图标样式，未知类型使用默认图标
- **FR-006**: 系统必须通过 `POST /api/v1/resources/update` 编辑资源，使用 version 字段实现乐观锁
- **FR-007**: 系统必须通过 `POST /api/v1/resources/delete` 删除资源，删除前要求用户输入资源名称确认（confirmName）
- **FR-008**: 系统必须在所有后端交互时显示适当的加载状态
- **FR-009**: 系统必须正确处理各类 HTTP 错误码：400（参数无效）、401（未认证）、403（无权限）、404（不存在）、409（冲突）
- **FR-010**: 系统必须在数据变更操作成功后自动刷新资源列表
- **FR-011**: 系统必须通过 `POST /api/v1/resources/get` 获取单个资源详情
- **FR-012**: 系统必须通过 `POST /api/v1/resources/update-status` 支持更新资源状态（RUNNING/STOPPED/MAINTENANCE/OFFLINE）
- **FR-013**: 系统必须在所有 API 请求中携带 JWT Token（Authorization: Bearer <token>）

### Key Entities

- **Resource（资源）**: 系统管理的基础设施单元
  - id: 资源唯一标识（Long）
  - name: 资源名称（必填，最大 100 字符）
  - description: 资源描述（可选，最大 500 字符）
  - resourceTypeId: 资源类型 ID（必填）
  - resourceTypeName: 资源类型名称（只读）
  - resourceTypeCode: 资源类型编码（只读）
  - status: 资源状态（RUNNING/STOPPED/MAINTENANCE/OFFLINE）
  - attributes: 扩展属性（JSON 格式字符串）
  - version: 版本号（乐观锁）
  - createdAt/updatedAt: 时间戳
  - createdBy: 创建者 ID

- **ResourceType（资源类型）**: 动态定义的资源分类
  - id: 类型 ID
  - code: 类型编码（如 SERVER）
  - name: 类型名称（如"服务器"）
  - description: 类型描述
  - icon: 图标标识
  - systemPreset: 是否系统预置

- **ResourceAuditLog（审计日志）**: 资源操作历史记录
  - operation: 操作类型（CREATE/UPDATE/DELETE 等）
  - oldValue/newValue: 变更前后的值（JSON）
  - operatorId/operatorName: 操作人信息
  - operatedAt: 操作时间

## API Integration Details

### API 设计特点

- **POST-Only API**: 所有接口均使用 POST 方法，参数通过请求体传递
- **统一响应格式**: `{ code, message, data, success }`
- **分页响应格式**: `{ content, page, size, totalElements, totalPages, first, last }`
- **乐观锁**: 更新操作需携带当前 version，版本不匹配返回 409
- **安全删除**: 删除需要用户输入资源名称确认

### 核心 API 端点

| 操作 | 端点 | 说明 |
|------|------|------|
| 查询列表 | POST /api/v1/resources/query | 支持分页、类型、状态、关键词过滤 |
| 创建资源 | POST /api/v1/resources/create | 返回 201，需 name 和 resourceTypeId |
| 获取详情 | POST /api/v1/resources/get | 通过 id 获取单个资源 |
| 更新资源 | POST /api/v1/resources/update | 需携带 version 实现乐观锁 |
| 删除资源 | POST /api/v1/resources/delete | 需 confirmName 匹配资源名称 |
| 更新状态 | POST /api/v1/resources/update-status | 快速更新运行状态 |
| 资源类型 | POST /api/v1/resource-types/query | 获取可用资源类型列表 |
| 审计日志 | POST /api/v1/resources/audit-logs/query | 查询操作历史 |

## Scope

### In Scope

- 资源列表查询（分页、过滤、搜索）
- 资源创建、编辑、删除
- 资源状态更新
- 资源详情查看
- 资源审计日志查看
- 动态资源类型获取和展示

### Out of Scope (后续迭代)

- 资源关系管理（relationships API）
- 子图/成员管理（members API）
- 拓扑图查询和展示（topology API）
- 祖先链查询（ancestors API）

## Assumptions

- 用户已通过系统认证，JWT Token 存储在前端并在请求时自动携带
- 后端 API 基础地址可配置（开发环境 localhost:8080，生产环境待定）
- 资源类型列表相对稳定，可在页面加载时获取一次并缓存
- 扩展属性（attributes）为可选字段，前端不做结构校验，仅验证 JSON 格式有效性

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户能在 3 秒内完成资源列表的加载和展示
- **SC-002**: 用户能在 1 分钟内完成一个新资源的创建流程
- **SC-003**: 95% 的后端 API 调用能成功完成并正确显示结果
- **SC-004**: 所有后端错误（400/401/403/404/409）都能以用户可理解的中文信息展示
- **SC-005**: 数据变更操作后，用户能立即在界面上看到最新状态
- **SC-006**: 系统支持管理至少 1000 个资源而不影响基本操作的响应速度
