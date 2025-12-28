# Quickstart: Topology Report Template Binding

**Feature**: 014-topology-report-template
**Date**: 2025-12-29

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend services running at localhost:8080

## Setup

```bash
# Clone and install (if not already done)
cd op-stack-web
npm install

# Start development server
npm run dev
```

## Development Workflow

### 1. Type Updates First

Update `services/api/types.ts` to add topology report template binding types:

```typescript
// Request types
export interface BindTopologyReportTemplatesRequest {
  topologyId: number;
  templateIds: number[];
}

export interface UnbindTopologyReportTemplatesRequest {
  topologyId: number;
  templateIds: number[];
}

export interface QueryBoundReportTemplatesRequest {
  topologyId: number;
  page?: number;
  size?: number;
  keyword?: string;
}

export interface QueryUnboundReportTemplatesRequest {
  topologyId: number;
  page?: number;
  size?: number;
  keyword?: string;
}

// Response types
export type BindTopologyReportTemplatesResponse = ApiResponse<void>;
export type UnbindTopologyReportTemplatesResponse = ApiResponse<void>;
export type QueryBoundReportTemplatesResponse = ApiResponse<PageResult<ReportTemplateDTO>>;
export type QueryUnboundReportTemplatesResponse = ApiResponse<PageResult<ReportTemplateDTO>>;
```

### 2. API Client

Create `services/api/topologyReportTemplates.ts`:

```typescript
import { apiPostRaw } from './client';
import type { ... } from './types';

export async function bindReportTemplates(request: BindTopologyReportTemplatesRequest) {
  return apiPostRaw('/api/service/v1/topologies/report-templates/bind', request);
}

export async function unbindReportTemplates(request: UnbindTopologyReportTemplatesRequest) {
  return apiPostRaw('/api/service/v1/topologies/report-templates/unbind', request);
}

export async function queryBoundReportTemplates(request: QueryBoundReportTemplatesRequest) {
  return apiPostRaw('/api/service/v1/topologies/report-templates/bound', request);
}

export async function queryUnboundReportTemplates(request: QueryUnboundReportTemplatesRequest) {
  return apiPostRaw('/api/service/v1/topologies/report-templates/unbound', request);
}
```

### 3. Hook Implementation

Create `services/hooks/useTopologyReportTemplates.ts` following `useAgentBinding.ts` pattern:

```typescript
export function useTopologyReportTemplates(topologyId: number) {
  // State for bound/unbound templates
  // Fetch functions for both lists
  // Bind/unbind mutation functions
  // Return all state and functions
}
```

### 4. Component Development Order

Recommended implementation sequence:

1. **Type definitions** - Add request/response types
2. **API client** - Create topologyReportTemplates.ts
3. **Hook** - Create useTopologyReportTemplates.ts
4. **UI Component** - Create TopologyReportTemplates.tsx (two-column layout)
5. **Integration** - Add to TopologyDetailView

### 5. Testing Endpoints

Manual API testing (using curl or REST client):

```bash
# Query bound templates for topology
curl -X POST http://localhost:8080/api/service/v1/topologies/report-templates/bound \
  -H "Content-Type: application/json" \
  -d '{"topologyId": 1, "page": 1, "size": 20}'

# Query unbound templates for topology
curl -X POST http://localhost:8080/api/service/v1/topologies/report-templates/unbound \
  -H "Content-Type: application/json" \
  -d '{"topologyId": 1, "page": 1, "size": 20}'

# Bind templates to topology
curl -X POST http://localhost:8080/api/service/v1/topologies/report-templates/bind \
  -H "Content-Type: application/json" \
  -d '{"topologyId": 1, "templateIds": [1, 2, 3]}'

# Unbind templates from topology
curl -X POST http://localhost:8080/api/service/v1/topologies/report-templates/unbind \
  -H "Content-Type: application/json" \
  -d '{"topologyId": 1, "templateIds": [1]}'
```

## Key Implementation Notes

### Two-Column Layout Pattern

```tsx
// Follow ToolsStage.tsx structure
<div className="grid grid-cols-4 gap-4">
  {/* Left: Available (unbound) - 3 columns */}
  <div className="col-span-3">
    {/* Category groups with template cards */}
  </div>

  {/* Right: Bound - 1 column */}
  <div className="col-span-1">
    {/* Bound template list */}
  </div>
</div>
```

### Category Grouping

```tsx
// Group templates by category
const groupByCategory = (templates: ReportTemplateDTO[]) => {
  const groups = new Map<string, ReportTemplateDTO[]>();
  templates.forEach(t => {
    const existing = groups.get(t.category) || [];
    groups.set(t.category, [...existing, t]);
  });
  return groups;
};
```

### Error Handling Pattern

```tsx
// Follow existing toast/error display patterns
{error && (
  <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3">
    <AlertCircle className="text-red-400" />
    <span className="text-red-400">{error}</span>
  </div>
)}
```

## File Checklist

New files to create:
- [ ] `services/api/topologyReportTemplates.ts`
- [ ] `services/hooks/useTopologyReportTemplates.ts`
- [ ] `components/topology/TopologyReportTemplates.tsx`

Files to modify:
- [ ] `services/api/types.ts` - Add request/response types
- [ ] `services/hooks/index.ts` - Export new hook
- [ ] `components/topology/TopologyDetailView.tsx` - Integrate component

## Common Issues

### API returns 500 error
Verify backend service is running and endpoints are implemented. Check request payload matches expected format.

### Templates not refreshing after bind/unbind
Ensure both bound and unbound lists are refreshed after mutation completes.

### Category grouping not working
Verify `category` field is present in API response. Check for null/undefined handling.
