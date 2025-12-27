# Quickstart: Report and Report Template API Integration

**Feature**: 011-report-api-integration
**Date**: 2024-12-28

## Prerequisites

1. Backend service running at `localhost:8080`
2. Vite dev server running (`npm run dev`)
3. API proxy configured in `vite.config.ts` (already set up)

## Implementation Order

### Phase 1: API Layer (services/api/)

1. **Add types to `services/api/types.ts`**
   - ReportDTO, ReportTemplateDTO
   - Request/Response types
   - Enum types

2. **Create `services/api/reports.ts`**
   - `listReports(request)` - List with pagination
   - `getReport(id)` - Get single report
   - `createReport(data)` - Create new report
   - `deleteReport(id)` - Delete report

3. **Create `services/api/report-templates.ts`**
   - `listReportTemplates(request)` - List with pagination
   - `getReportTemplate(id)` - Get single template
   - `createReportTemplate(data)` - Create new template
   - `updateReportTemplate(data)` - Update with optimistic lock
   - `deleteReportTemplate(id)` - Delete template

### Phase 2: Hooks Layer (services/hooks/)

4. **Create `useReports.ts`**
   - Pattern: Follow `useTools.ts`
   - Features: pagination, type/status filter, keyword search

5. **Create `useReportTemplates.ts`**
   - Pattern: Follow `useCategories.ts`
   - Features: pagination, category filter, keyword search

6. **Create `useReportTemplateMutations.ts`**
   - Pattern: Follow `usePromptTemplateMutations.ts`
   - Features: create, update, delete operations

### Phase 3: Component Integration

7. **Modify `ReportManagement.tsx`**
   - Replace `INITIAL_REPORTS` with `useReports()` hook
   - Wire up filters and pagination
   - Handle loading/error states

8. **Modify `ReportTemplateManagement.tsx`**
   - Replace mock data with `useReportTemplates()` hook
   - Wire up CRUD operations
   - Handle optimistic locking errors

### Phase 4: Type Migration

9. **Update `types.ts`**
   - Change `Report.id` from `string` to `number`
   - Change `Report.createdAt` from `number` to `string`
   - Update `ReportTemplate` interface similarly

## Quick Code Examples

### API Function Pattern

```typescript
// services/api/reports.ts
import { apiPostRaw } from './client';
import type { ListReportsRequest, ReportListResponse } from './types';

export async function listReports(request: ListReportsRequest): Promise<ReportListResponse> {
  return apiPostRaw<ListReportsRequest, ReportListResponse>(
    '/api/service/v1/reports/list',
    request
  );
}
```

### Hook Pattern

```typescript
// services/hooks/useReports.ts
const fetchReports = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await listReports({ page, size, type: typeFilter, keyword });
    const isSuccess = response.code === 0 || response.success === true;
    if (isSuccess && response.data) {
      setReports(response.data.content || []);
      setTotal(response.data.totalElements || 0);
      setTotalPages(response.data.totalPages || 1);
    } else {
      setError(response.message || 'Failed to load reports');
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load reports');
  } finally {
    setLoading(false);
  }
}, [page, size, typeFilter, keyword]);
```

### Component Usage

```typescript
// components/ReportManagement.tsx
const {
  reports,
  loading,
  error,
  page,
  totalPages,
  setPage,
  setTypeFilter,
  setSearch,
  refresh
} = useReports({ size: 8 });
```

## Testing Checklist

- [ ] Report list loads from API
- [ ] Report type filter works
- [ ] Report status filter works
- [ ] Report search works
- [ ] Report pagination works
- [ ] Report detail view loads
- [ ] Template list loads from API
- [ ] Template category filter works
- [ ] Template search works
- [ ] Template create works
- [ ] Template update works (with version conflict handling)
- [ ] Template delete works
- [ ] Loading states display correctly
- [ ] Error states display with retry option

## Common Issues

### Version Conflict on Template Update

If you get a 409 error when updating a template:
1. Re-fetch the template to get latest version
2. Retry update with new `expectedVersion`

### Empty Response

Check that:
1. Backend is returning `data.content` array
2. Response unwrapping uses `response.data.content`

### Type Mismatch

Remember:
- API IDs are `number` (int64)
- API dates are ISO 8601 `string`
- Mock data uses `string` IDs and `number` timestamps
