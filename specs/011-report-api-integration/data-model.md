# Data Model: Report and Report Template API Integration

**Feature**: 011-report-api-integration
**Date**: 2024-12-28

## Entities

### ReportDTO (from API)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number (int64) | Yes | Report unique identifier |
| title | string | Yes | Report title (max 200 chars) |
| type | ReportType | Yes | Report type enum |
| status | ReportStatus | Yes | Report status enum |
| author | string | Yes | Author name (max 100 chars) |
| summary | string | No | Brief summary (max 500 chars) |
| content | string | No | Full content (Markdown format) |
| tags | string[] | No | Array of tags |
| topologyId | number (int64) | No | Associated topology ID |
| createdAt | string (ISO 8601) | Yes | Creation timestamp |

### ReportTemplateDTO (from API)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number (int64) | Yes | Template unique identifier |
| name | string | Yes | Template name (max 100 chars) |
| description | string | No | Template description (max 500 chars) |
| category | ReportTemplateCategory | Yes | Template category enum |
| content | string | Yes | Template content with placeholders |
| tags | string[] | No | Array of tags |
| version | number | Yes | Optimistic lock version |
| createdAt | string (ISO 8601) | Yes | Creation timestamp |
| updatedAt | string (ISO 8601) | Yes | Last update timestamp |

## Enums

### ReportType

```typescript
type ReportType = 'Diagnosis' | 'Audit' | 'Performance' | 'Security';
```

### ReportStatus

```typescript
type ReportStatus = 'Draft' | 'Final' | 'Archived';
```

### ReportTemplateCategory

```typescript
type ReportTemplateCategory = 'Incident' | 'Performance' | 'Security' | 'Audit';
```

## Request Types

### ListReportsRequest

```typescript
interface ListReportsRequest {
  page?: number;      // Default: 1, min: 1
  size?: number;      // Default: 10, range: 1-100
  type?: ReportType;  // Filter by type
  status?: ReportStatus;  // Filter by status
  keyword?: string;   // Search in title, summary, tags
  sortBy?: 'title' | 'type' | 'status' | 'created_at';
  sortOrder?: 'asc' | 'desc';  // Default: desc
}
```

### GetReportRequest

```typescript
interface GetReportRequest {
  id: number;  // Required
}
```

### CreateReportRequest

```typescript
interface CreateReportRequest {
  title: string;      // Required, max 200 chars
  type: ReportType;   // Required
  status?: ReportStatus;  // Default: 'Final'
  author: string;     // Required, max 100 chars
  summary?: string;   // Optional, max 500 chars
  content?: string;   // Optional, Markdown
  tags?: string[];    // Optional
  topologyId?: number;  // Optional
}
```

### DeleteReportRequest

```typescript
interface DeleteReportRequest {
  id: number;  // Required
}
```

### ListReportTemplatesRequest

```typescript
interface ListReportTemplatesRequest {
  page?: number;      // Default: 1
  size?: number;      // Default: 10
  category?: ReportTemplateCategory;  // Filter by category
  keyword?: string;   // Search in name, description, tags
}
```

### GetReportTemplateRequest

```typescript
interface GetReportTemplateRequest {
  id: number;  // Required
}
```

### CreateReportTemplateRequest

```typescript
interface CreateReportTemplateRequest {
  name: string;       // Required, max 100 chars
  description?: string;  // Optional, max 500 chars
  category: ReportTemplateCategory;  // Required
  content: string;    // Required, Markdown with placeholders
  tags?: string[];    // Optional
}
```

### UpdateReportTemplateRequest

```typescript
interface UpdateReportTemplateRequest {
  id: number;         // Required
  name?: string;      // Optional, max 100 chars
  description?: string;  // Optional, max 500 chars
  category?: ReportTemplateCategory;  // Optional
  content?: string;   // Optional
  tags?: string[];    // Optional
  expectedVersion: number;  // Required for optimistic locking
}
```

### DeleteReportTemplateRequest

```typescript
interface DeleteReportTemplateRequest {
  id: number;  // Required
}
```

## Response Types

### Paginated Response (Generic)

```typescript
interface PaginatedData<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  success: boolean;
  data: T;
}
```

### Specific Response Types

```typescript
type ReportListResponse = ApiResponse<PaginatedData<ReportDTO>>;
type ReportDetailResponse = ApiResponse<ReportDTO>;
type ReportTemplateListResponse = ApiResponse<PaginatedData<ReportTemplateDTO>>;
type ReportTemplateDetailResponse = ApiResponse<ReportTemplateDTO>;
```

## Relationships

```
Report
  └── topologyId (optional) ──references──> Topology

ReportTemplate
  └── (standalone, no relationships)
```

## State Transitions

### Report Status

Reports are immutable after creation. Status is set at creation time and cannot be changed.

```
(none) ──create──> Draft | Final | Archived
```

### ReportTemplate Lifecycle

```
(none) ──create──> Active
Active ──update──> Active (version++)
Active ──delete──> (soft deleted)
```

## Validation Rules

### Report

1. `title` is required and max 200 characters
2. `type` must be one of: Diagnosis, Audit, Performance, Security
3. `status` must be one of: Draft, Final, Archived (default: Final)
4. `author` is required and max 100 characters
5. `summary` max 500 characters if provided
6. `topologyId` must reference valid topology if provided

### ReportTemplate

1. `name` is required and max 100 characters
2. `category` must be one of: Incident, Performance, Security, Audit
3. `content` is required (template with placeholders)
4. `description` max 500 characters if provided
5. `expectedVersion` must match current version for updates (optimistic locking)

## Migration Notes

### From Mock Data to API

| Field | Mock Type | API Type | Action |
|-------|-----------|----------|--------|
| Report.id | string | number | Change type |
| Report.createdAt | number | string | Change type, format display |
| ReportTemplate.id | string | number | Change type |
| ReportTemplate.updatedAt | number | string | Change type, format display |
| ReportTemplate.createdAt | - | string | Add field |
| ReportTemplate.version | - | number | Add field for optimistic locking |
