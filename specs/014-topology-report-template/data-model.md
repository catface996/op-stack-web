# Data Model: Topology Report Template Binding

## Entities

### ReportTemplateDTO (Existing)

Reused from Feature 011-report-api-integration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Template ID (int64) |
| name | string | Yes | Template name (max 100 chars) |
| description | string | No | Template description (max 500 chars) |
| category | ReportTemplateCategory | Yes | One of: Incident, Performance, Security, Audit |
| content | string | Yes | Template content with placeholders |
| tags | string[] | No | Array of tags |
| version | number | Yes | Optimistic lock version |
| createdAt | string | Yes | ISO 8601 timestamp |
| updatedAt | string | Yes | ISO 8601 timestamp |

### TopologyReportTemplateBinding (Conceptual)

This is a relationship entity managed by the backend. Frontend only sees it through the bound/unbound query APIs.

| Field | Type | Description |
|-------|------|-------------|
| topologyId | number | Topology being configured |
| templateId | number | Report template bound to topology |

## API Request Types

### BindTopologyReportTemplatesRequest

```typescript
interface BindTopologyReportTemplatesRequest {
  topologyId: number;
  templateIds: number[];
}
```

### UnbindTopologyReportTemplatesRequest

```typescript
interface UnbindTopologyReportTemplatesRequest {
  topologyId: number;
  templateIds: number[];
}
```

### QueryBoundReportTemplatesRequest

```typescript
interface QueryBoundReportTemplatesRequest {
  topologyId: number;
  page?: number;    // 1-based, default 1
  size?: number;    // default 20, max 100
  keyword?: string; // Search in name, description
}
```

### QueryUnboundReportTemplatesRequest

```typescript
interface QueryUnboundReportTemplatesRequest {
  topologyId: number;
  page?: number;
  size?: number;
  keyword?: string;
}
```

## API Response Types

### BindTopologyReportTemplatesResponse

```typescript
type BindTopologyReportTemplatesResponse = ApiResponse<void>;
// { code: 0, success: true, message: "success", data: null }
```

### UnbindTopologyReportTemplatesResponse

```typescript
type UnbindTopologyReportTemplatesResponse = ApiResponse<void>;
// { code: 0, success: true, message: "success", data: null }
```

### QueryBoundReportTemplatesResponse

```typescript
type QueryBoundReportTemplatesResponse = ApiResponse<PageResult<ReportTemplateDTO>>;
// { code: 0, success: true, data: { content: [...], page, size, totalElements, totalPages, first, last } }
```

### QueryUnboundReportTemplatesResponse

```typescript
type QueryUnboundReportTemplatesResponse = ApiResponse<PageResult<ReportTemplateDTO>>;
// Same structure as bound query
```

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| topologyId | Required, must be valid topology ID | "Topology ID is required" |
| templateIds | Required for bind/unbind, array of valid IDs | "At least one template must be selected" |
| page | Optional, minimum 1 | Defaults to 1 |
| size | Optional, 1-100 | Defaults to 20 |

## State Transitions

```
Template State (relative to a Topology)
┌─────────┐      bind()       ┌───────┐
│ Unbound │ ────────────────► │ Bound │
└─────────┘                   └───────┘
     ▲                            │
     │         unbind()           │
     └────────────────────────────┘
```

## Relationships

- A **Topology** can have zero or more **ReportTemplates** bound to it
- A **ReportTemplate** can be bound to zero or more **Topologies** (many-to-many)
- Binding uses full replacement semantics at individual template level (bind adds, unbind removes)
