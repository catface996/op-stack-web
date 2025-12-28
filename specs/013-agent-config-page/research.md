# Research: Agent Configuration Page

**Feature**: 013-agent-config-page
**Date**: 2025-12-28

## Research Tasks

### 1. Existing Agent API Structure

**Question**: What is the current agent update API structure including toolIds?

**Finding**: The agent update API at `/api/service/v1/agents/update` supports the following fields:

```typescript
interface UpdateAgentRequest {
  id: number;              // Required
  name?: string;           // Optional, max 100 chars
  specialty?: string;      // Optional, max 200 chars
  promptTemplateId?: number; // Optional
  model?: string;          // Optional, max 100 chars
  temperature?: number;    // Optional, 0.0-2.0
  topP?: number;           // Optional, 0.0-1.0
  maxTokens?: number;      // Optional, min 1
  maxRuntime?: number;     // Optional, min 1 (seconds)
  toolIds?: number[];      // Optional, full replacement semantics
}
```

**Decision**: Use existing `useAgents` hook's `handleUpdate` function, extending it to support `toolIds` array.

**Rationale**: Leverages existing tested code path, maintains consistency with other agent operations.

**Alternatives considered**: Creating separate tool assignment hook - rejected as API already supports embedded toolIds.

---

### 2. Prompt Template Preview API

**Question**: How to fetch prompt template content for preview?

**Finding**: The existing `usePromptTemplate` hook fetches template detail including full content via `/api/service/v1/prompt-templates/detail`:

```typescript
interface PromptTemplateDTO {
  id: number;
  name: string;
  description?: string;
  content: string;         // Full template content
  usageCode: string;
  currentVersion: number;
  versions: PromptTemplateVersionDTO[];
  // ...
}
```

**Decision**: Use `usePromptTemplate` hook to fetch individual template details when user selects one for preview.

**Rationale**: Reuses existing hook, provides complete template content including version history.

**Alternatives considered**: Fetching all templates with content upfront - rejected due to potential payload size.

---

### 3. Tools Grouped by Category

**Question**: How to display tools grouped by their categories?

**Finding**:
- `useTools` hook can filter by `categoryId`
- `useCategories` hook fetches all categories with pagination
- `ToolDTO` includes `categoryId` and `categoryName` fields

**Decision**:
1. Fetch all categories using `useCategories` with large page size
2. For each category, fetch tools filtered by `categoryId`
3. Use collapsible accordion UI for category groups

**Rationale**: Provides clear organization, allows lazy loading of tools per category if needed.

**Alternatives considered**:
- Fetch all tools at once and group client-side - acceptable for small tool counts but less scalable
- Use single API that returns nested structure - not available in current API

---

### 4. Wizard/Stepper Component Pattern

**Question**: What UI pattern to use for three-stage navigation?

**Finding**: The project uses Tailwind-style CSS classes with Lucide React icons. No existing stepper component exists.

**Decision**: Create a custom `ConfigStepper` component with:
- Horizontal step indicators with numbers/icons
- Step labels (Basic Info, Prompt Template, Tools)
- Visual states: pending, active, completed
- Clickable steps for free navigation

**Rationale**: Matches existing design system, provides flexibility for our specific requirements.

**Alternatives considered**: Third-party stepper library - rejected to avoid new dependencies and maintain design consistency.

---

### 5. Unsaved Changes Detection

**Question**: How to handle unsaved changes when navigating between stages or leaving page?

**Finding**: React has `beforeunload` event for browser navigation, but intra-app navigation needs React Router hooks.

**Decision**:
1. Track dirty state per stage using React state
2. Use `useBlocker` from React Router DOM 7.x for in-app navigation blocking
3. Use `beforeunload` event listener for browser close/refresh
4. Show confirmation dialog when attempting to navigate with unsaved changes

**Rationale**: Comprehensive coverage of all navigation scenarios.

**Alternatives considered**: Auto-save on stage change - explicitly rejected per spec (manual save per stage).

---

### 6. Route Structure

**Question**: What route pattern to use for the configuration page?

**Finding**: Current routes include `/agents` for agent list. Existing patterns:
- `/topologies/:id` for topology detail
- `/resources/:id` for resource detail

**Decision**: Add route `/agents/:id/config` for agent configuration page.

**Rationale**: Follows RESTful resource pattern, clearly indicates configuration context.

**Alternatives considered**:
- `/agents/config/:id` - less RESTful
- Modal approach (current) - explicitly rejected per spec requirements

---

## Summary

All technical unknowns have been resolved:

| Area | Decision | Impact |
|------|----------|--------|
| Agent Update API | Use existing with toolIds | Low - minor type extension |
| Template Preview | Use usePromptTemplate hook | Low - hook already exists |
| Tool Categories | Fetch categories, filter tools | Medium - new grouping logic |
| Stepper Component | Custom component | Medium - new UI component |
| Unsaved Changes | useBlocker + beforeunload | Medium - new detection logic |
| Route | `/agents/:id/config` | Low - route config change |

**Ready for Phase 1: Design & Contracts**
