# API Contracts Summary: Agent Configuration Page

**Feature**: 013-agent-config-page
**Date**: 2025-12-28

## Overview

This feature uses existing backend APIs. No new API endpoints are required.

## APIs Used

### 1. Agent Management

**Get Agent**
- Endpoint: `POST /api/service/v1/agents/get`
- Request: `{ id: number }`
- Response: `AgentDTO` with all fields including `toolIds`
- Used by: Loading agent data on page mount

**Update Agent**
- Endpoint: `POST /api/service/v1/agents/update`
- Request: `UpdateAgentRequest` (see below)
- Response: `AgentDTO`
- Used by: All three save operations (Basic Info, Prompt Template, Tools)

```typescript
// Extended UpdateAgentRequest (toolIds is new)
interface UpdateAgentRequest {
  id: number;
  name?: string;
  specialty?: string;
  promptTemplateId?: number;
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  maxRuntime?: number;
  toolIds?: number[];  // Full replacement semantics
}
```

### 2. Prompt Template Management

**List Templates**
- Endpoint: `POST /api/service/v1/prompt-templates/list`
- Request: `{ page, size, keyword?, usageCode? }`
- Response: `PageResult<PromptTemplateDTO>`
- Used by: Template selection list

**Get Template Detail**
- Endpoint: `POST /api/service/v1/prompt-templates/detail`
- Request: `{ id: number }`
- Response: `PromptTemplateDTO` with full content
- Used by: Template preview panel

### 3. Tool Category Management

**List Categories**
- Endpoint: `POST /api/tools/v1/categories/list`
- Request: `{ page, size, keyword? }`
- Response: `PageResult<ToolCategoryDTO>`
- Used by: Tools stage category accordion

### 4. Tool Management

**List Tools**
- Endpoint: `POST /api/tools/v1/tools/list`
- Request: `{ page, size, category_id?, status?, search? }`
- Response: `PageResult<ToolDTO>`
- Used by: Tools within each category

## Type Updates Required

### services/api/types.ts

Add `toolIds` to `UpdateAgentRequest`:

```typescript
export interface UpdateAgentRequest {
  id: number;
  name?: string;
  specialty?: string;
  promptTemplateId?: number;
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  maxRuntime?: number;
  toolIds?: number[];  // NEW: Array of tool IDs (full replacement)
}
```

Add `toolIds` to `AgentDTO`:

```typescript
export interface AgentDTO {
  // ... existing fields ...
  toolIds?: number[];  // NEW: Currently assigned tool IDs
}
```

### services/hooks/useAgents.ts

Update `AgentWithApiFields` interface:

```typescript
export interface AgentWithApiFields extends Agent {
  // ... existing fields ...
  toolIds: number[];  // NEW: Assigned tool IDs
}
```

Update `toFrontendAgent` function to map `toolIds`:

```typescript
export function toFrontendAgent(dto: AgentDTO): AgentWithApiFields {
  return {
    // ... existing mappings ...
    toolIds: dto.toolIds || [],
  };
}
```

## Existing Hooks to Use

| Hook | Purpose | From |
|------|---------|------|
| `useAgents` | Agent CRUD, update with toolIds | services/hooks/useAgents.ts |
| `usePromptTemplates` | List templates with search | services/hooks/usePromptTemplates.ts |
| `usePromptTemplate` | Get template detail for preview | services/hooks/usePromptTemplate.ts |
| `useCategories` | List tool categories | services/hooks/useCategories.ts |
| `useTools` | List tools, filter by category | services/hooks/useTools.ts |

## Response Format Compliance

All APIs follow the constitution's response format:

```json
{
  "code": 0,
  "message": "success",
  "success": true,
  "data": { ... }
}
```

Paginated responses include:
- `data.content`: Array of items
- `data.page`, `data.size`: Current pagination
- `data.totalElements`, `data.totalPages`: Total counts
- `data.first`, `data.last`: Boundary flags
