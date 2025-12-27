# Research: Report and Report Template API Integration

**Feature**: 011-report-api-integration
**Date**: 2024-12-28

## Research Summary

No NEEDS CLARIFICATION items in Technical Context. All technologies and patterns are established in the codebase.

## Decisions

### 1. API Client Pattern

**Decision**: Use `apiPostRaw` from `services/api/client.ts`

**Rationale**:
- Returns full response wrapper with `{ code, success, message, data }`
- Required for proper error handling and pagination metadata extraction
- Constitution-compliant (Section III: API Client Conventions)

**Alternatives Considered**:
- `apiPost`: Auto-extracts `data` field but loses access to `code`/`success` for error handling

### 2. Hook Pattern for Lists

**Decision**: Follow `useTools.ts` / `useCategories.ts` pattern

**Rationale**:
- Established pattern in codebase with proven success
- Handles pagination, loading, error states consistently
- Uses `useCallback` for stable function references
- Constitution-compliant response handling

**Pattern Elements**:
- State: items[], loading, error, page, totalPages, total
- Actions: setPage, setFilter, setSearch, refresh
- Response parsing: `response.data.content`, `response.data.totalElements`

### 3. Hook Pattern for Single Item

**Decision**: Follow `usePromptTemplate.ts` pattern for fetching single items

**Rationale**:
- Simple fetch on mount with ID parameter
- Loading and error state handling
- Optional auto-fetch control

### 4. Hook Pattern for Mutations

**Decision**: Follow `usePromptTemplateMutations.ts` pattern

**Rationale**:
- Separates CRUD operations into dedicated hook
- Returns loading state per operation
- Provides callbacks for success/error handling

### 5. Type Definitions Location

**Decision**: Add new types to `types.ts` (root) for shared types, `services/api/types.ts` for API-specific types

**Rationale**:
- Existing `Report` and `ReportTemplate` interfaces are in `types.ts`
- API request/response types follow pattern in `services/api/types.ts`
- Maintains separation between domain types and API types

### 6. ID Type Handling

**Decision**: Backend uses `int64` IDs, frontend will use `number` type

**Rationale**:
- Backend OpenAPI shows `format: int64` for IDs
- Current mock data uses `string` IDs - need migration
- TypeScript `number` is safe for int64 values in JS (up to 2^53)

**Migration Note**: Existing `Report.id` is `string`, will change to `number`

### 7. Date Handling

**Decision**: Use ISO 8601 string format from API, format on display

**Rationale**:
- Backend returns `format: date-time` (ISO 8601)
- Current mock uses `number` (timestamp) - need migration
- `new Date(isoString).toLocaleDateString()` for display

**Migration Note**: `Report.createdAt` changes from `number` to `string`

## API Verification

### Report APIs (Verified from backend OpenAPI)

| Endpoint | Method | Verified |
|----------|--------|----------|
| `/api/service/v1/reports/list` | POST | Yes |
| `/api/service/v1/reports/get` | POST | Yes |
| `/api/service/v1/reports/create` | POST | Yes |
| `/api/service/v1/reports/delete` | POST | Yes |

### Report Template APIs (Verified from backend OpenAPI)

| Endpoint | Method | Verified |
|----------|--------|----------|
| `/api/service/v1/report-templates/list` | POST | Yes |
| `/api/service/v1/report-templates/get` | POST | Yes |
| `/api/service/v1/report-templates/create` | POST | Yes |
| `/api/service/v1/report-templates/update` | POST | Yes |
| `/api/service/v1/report-templates/delete` | POST | Yes |

## Constitution Compliance Verification

| Principle | Implementation |
|-----------|----------------|
| Page starts at 1 | Request uses `page: 1` as default |
| Size 1-100 range | UI defaults to 8, backend validates |
| Response unwrapping | Extract `response.data.content` |
| Error handling | Check `code === 0 \|\| success === true` |
| POST-only | All endpoints use POST method |

## No Open Questions

All technical decisions have been made based on existing codebase patterns and backend API documentation.
