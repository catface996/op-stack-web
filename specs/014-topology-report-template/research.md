# Research: Topology Report Template Binding

## Research Tasks Completed

### 1. Existing Binding Pattern Analysis

**Question**: What is the existing pattern for binding entities (agent-tool binding)?

**Finding**: The project uses a consistent binding pattern implemented in:
- `services/hooks/useAgentBinding.ts` - Hook managing bound/unbound state with pagination
- `services/api/agentBinding.ts` - API client with `queryBoundTools`, `queryUnboundTools`, `bindTools`
- `components/agent-config/ToolsStage.tsx` - Two-column UI component

**Decision**: Replicate the `useAgentBinding` pattern for `useTopologyReportTemplates` hook.

**Rationale**: Consistent patterns reduce learning curve and ensure predictable behavior across features.

**Alternatives considered**: Creating a generic binding hook - rejected as it adds unnecessary abstraction for two use cases.

---

### 2. Existing Report Template Types

**Question**: What report template types already exist in the codebase?

**Finding**: From `services/api/types.ts`:
```typescript
export type ReportTemplateCategory = 'Incident' | 'Performance' | 'Security' | 'Audit';

export interface ReportTemplateDTO {
  id: number;
  name: string;
  description?: string;
  category: ReportTemplateCategory;
  content: string;
  tags?: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

**Decision**: Reuse existing `ReportTemplateDTO` type for bound/unbound template lists.

**Rationale**: Leverages existing type definitions, maintains consistency.

**Alternatives considered**: Creating a simplified DTO for binding - rejected as full DTO provides useful info (category, description) for UI.

---

### 3. TopologyDetailView Integration Point

**Question**: Where should the report templates section be added in TopologyDetailView?

**Finding**: `TopologyDetailView` has:
- Main graph visualization area
- Sidebar with members list and add dialog
- Existing pattern of sections within the sidebar

**Decision**: Add report templates as a new collapsible section in the sidebar, below members list, OR as a modal/panel triggered from a button.

**Rationale**: Maintains existing UI structure while adding new functionality.

**Alternatives considered**: Creating a separate page - rejected as binding is contextual to the topology being viewed.

---

### 4. API Contract Verification

**Question**: What are the expected API request/response formats for the new endpoints?

**Finding**: Based on backend API specification and constitution:

**Bind API** - `POST /api/service/v1/topologies/report-templates/bind`
```typescript
// Request
{ topologyId: number; templateIds: number[] }
// Response
{ code: 0, success: true, message: "success", data: null }
```

**Unbind API** - `POST /api/service/v1/topologies/report-templates/unbind`
```typescript
// Request
{ topologyId: number; templateIds: number[] }
// Response
{ code: 0, success: true, message: "success", data: null }
```

**Query Bound** - `POST /api/service/v1/topologies/report-templates/bound`
```typescript
// Request
{ topologyId: number; page?: number; size?: number; keyword?: string }
// Response
{ code: 0, success: true, data: { content: ReportTemplateDTO[], page, size, totalElements, totalPages, first, last } }
```

**Query Unbound** - `POST /api/service/v1/topologies/report-templates/unbound`
```typescript
// Request
{ topologyId: number; page?: number; size?: number; keyword?: string }
// Response
{ code: 0, success: true, data: { content: ReportTemplateDTO[], page, size, totalElements, totalPages, first, last } }
```

**Decision**: Follow constitution pagination format exactly.

**Rationale**: Ensures consistency with other API integrations in the project.

---

### 5. UI Pattern Reference

**Question**: What UI pattern should be followed for the two-column binding interface?

**Finding**: `ToolsStage.tsx` implements:
- Left panel: Available (unbound) items grouped by category
- Right panel: Bound items
- Search bar across both panels
- Add/Remove buttons on each item
- Bind All / Clear All bulk actions
- Loading and error states

**Decision**: Create `TopologyReportTemplates.tsx` following same structure, adapted for report templates (grouped by category: Incident, Performance, Security, Audit).

**Rationale**: Users familiar with agent-tool binding will immediately understand topology-template binding.

**Alternatives considered**: Simpler list without categories - rejected as categories help organize templates.

---

## Summary

| Area | Decision | Impact |
|------|----------|--------|
| Hook Pattern | Replicate useAgentBinding | Low - straightforward adaptation |
| Types | Reuse ReportTemplateDTO | Low - no new types needed |
| UI Placement | Sidebar section or modal | Low - follows existing patterns |
| API Format | Constitution-compliant pagination | Low - standard format |
| UI Pattern | Two-column with categories | Medium - new component following ToolsStage |
