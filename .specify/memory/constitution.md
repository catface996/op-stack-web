<!--
  ============================================================================
  SYNC IMPACT REPORT
  ============================================================================
  Version Change: 1.0.0 → 1.1.0 (Added Pagination Controls UI Pattern)

  Modified Principles: N/A

  Added Sections:
  - IV. Pagination Controls UI Pattern (under Frontend Development Standards)

  Removed Sections: N/A

  Templates Requiring Updates:
  - .specify/templates/plan-template.md: No update needed
  - .specify/templates/spec-template.md: No update needed
  - .specify/templates/tasks-template.md: No update needed

  Follow-up TODOs: None
  ============================================================================
-->

# op-stack-web Constitution

## Core Principles

### I. API Pagination Request Format

All paginated API requests MUST use the following JSON structure:

```json
{
  "page": 1,
  "size": 20,
  "tenantId": null,
  "traceId": null,
  "userId": null
}
```

**Rules**:
- `page`: Page number (1-based), defaults to 1, minimum value is 1
- `size`: Page size, defaults to 20, valid range is 1-100
- `tenantId`, `traceId`, `userId`: Gateway-injected fields (hidden from frontend)

**Rationale**: Consistent pagination parameters enable predictable API behavior and simplify client implementation across all services.

### II. API Pagination Response Format

All paginated API responses MUST use the following JSON structure:

```json
{
  "code": 0,
  "message": "success",
  "success": true,
  "data": {
    "content": [],
    "page": 1,
    "size": 10,
    "totalElements": 100,
    "totalPages": 10,
    "first": true,
    "last": false
  }
}
```

**Rules**:
- `code`: Status code, 0 indicates success
- `success`: Boolean success indicator
- `data.content`: Array containing the actual data items
- `data.page`: Current page number (1-based)
- `data.size`: Current page size
- `data.totalElements`: Total record count
- `data.totalPages`: Total page count
- `data.first`: Boolean indicating if this is the first page
- `data.last`: Boolean indicating if this is the last page

**Rationale**: Standardized response format ensures frontend components can implement universal pagination logic without service-specific adaptations.

### III. API Client Conventions

All API calls MUST follow these conventions:

- All API requests use POST method (including queries)
- Frontend MUST extract `data` field from successful responses
- Frontend MUST handle `success: false` responses with appropriate error display
- Type definitions MUST match the actual API response structure

**Rationale**: POST-only pattern simplifies CORS handling and provides consistent request structure; proper response unwrapping ensures data flows correctly through the application.

## API Contract Standards

All API implementations MUST:

1. Return responses wrapped in the standard envelope (`code`, `message`, `success`, `data`)
2. Use camelCase for JSON field names in responses
3. Include proper error codes and messages for failure cases
4. Support pagination parameters for all list endpoints

**Compliance Check**: Before implementing any API integration, verify the backend contract matches the constitution format. Document any deviations in the feature's research.md.

## Frontend Development Standards

Frontend implementations MUST:

1. Define TypeScript interfaces matching the actual API response structure
2. Use `apiPostRaw` or equivalent client that handles response unwrapping
3. Extract paginated data from `response.data.content` (not `response.items`)
4. Calculate pagination state from `totalElements`, `totalPages`, `first`, `last`
5. Handle loading and error states for all async operations

### IV. Pagination Controls UI Pattern

All management pages with pagination MUST use the following standardized pagination controls:

```tsx
{/* Pagination */}
{!loading && !error && totalPages > 0 && (
  <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
    <button
      onClick={() => setPage(page - 1)}
      disabled={page === 1}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
    >
      <ChevronLeft size={14} /> Prev
    </button>
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-slate-500 tracking-widest">Page</span>
      <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{page}</span>
      <span className="text-[10px] text-slate-500 font-bold">/</span>
      <span className="text-xs text-slate-400 font-mono font-bold">{totalPages}</span>
      <span className="text-[10px] text-slate-600 ml-2">({totalElements} total)</span>
    </div>
    <button
      onClick={() => setPage(page + 1)}
      disabled={page >= totalPages}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
    >
      Next <ChevronRight size={14} />
    </button>
  </div>
)}
```

**Rules**:
- Layout: Centered horizontally using `flex justify-center items-center gap-6`
- Position: Always placed outside the scrollable content area with `shrink-0`
- Border: Top border using `pt-4 border-t border-slate-900/50`
- Prev Button: Shows `<ChevronLeft size={14} /> Prev`, disabled when `page === 1`
- Next Button: Shows `Next <ChevronRight size={14} />`, disabled when `page >= totalPages`
- Page Info: Format is `Page {page} / {totalPages} ({totalElements} total)`
- Button Style: `bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300`
- For client-side filtering, append filter status: `({count} total, filtered)`

**Rationale**: Consistent pagination controls across all management pages ensure predictable user experience and maintainable codebase. The centered layout with clear page indicators helps users navigate large datasets efficiently.

## Governance

This constitution supersedes all other practices for the op-stack-web project.

**Amendment Process**:
1. Proposed changes MUST be documented with rationale
2. Changes MUST include migration plan for existing code
3. Version MUST be incremented following semantic versioning:
   - MAJOR: Breaking changes to principles
   - MINOR: New principles or expanded guidance
   - PATCH: Clarifications and typo fixes

**Compliance Review**:
- All PRs MUST verify compliance with constitution principles
- Constitution violations MUST be justified in Complexity Tracking section of plan.md
- Runtime development guidance is maintained in CLAUDE.md

**Version**: 1.1.0 | **Ratified**: 2025-12-27 | **Last Amended**: 2025-12-29
