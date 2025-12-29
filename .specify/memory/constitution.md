<!--
  ============================================================================
  SYNC IMPACT REPORT
  ============================================================================
  Version Change: 1.1.0 → 1.2.0 (Added Destructive Action Confirmation Pattern)

  Modified Principles: N/A

  Added Sections:
  - V. Destructive Action Confirmation Pattern (under Frontend Development Standards)

  Removed Sections: N/A

  Templates Requiring Updates:
  - .specify/templates/plan-template.md: ✅ No update needed (generic template)
  - .specify/templates/spec-template.md: ✅ No update needed (generic template)
  - .specify/templates/tasks-template.md: ✅ No update needed (generic template)

  Follow-up TODOs:
  - Existing delete/unbind modals in codebase should be updated to comply with this principle
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

### V. Destructive Action Confirmation Pattern

All destructive actions (delete, unbind, remove, etc.) MUST implement a two-step confirmation dialog with name verification:

**Rules**:
1. A confirmation modal MUST be displayed before executing any destructive action
2. The modal MUST display the name of the object being deleted/unbound
3. The user MUST type the exact name of the object to enable the confirm button
4. The confirm button MUST remain disabled until the typed name matches exactly
5. The modal MUST clearly indicate this is a destructive/irreversible action

**UI Pattern**:

```tsx
{/* Destructive Action Confirmation Modal */}
{itemToDelete && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-slate-900 border border-red-500/30 rounded-xl shadow-2xl w-full max-w-sm">
      <div className="flex items-center justify-between p-4 border-b border-red-500/20">
        <h3 className="font-bold text-red-400 text-sm">Confirm Delete</h3>
        <button onClick={() => setItemToDelete(null)} className="text-slate-500 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm text-slate-400">
          This action cannot be undone. To confirm, please type the name:
        </p>
        <p className="text-sm font-bold text-white bg-slate-800 px-3 py-2 rounded">
          {itemToDelete.name}
        </p>
        <input
          type="text"
          value={confirmationInput}
          onChange={(e) => setConfirmationInput(e.target.value)}
          placeholder="Type name to confirm"
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm
                     placeholder-slate-500 focus:outline-none focus:border-red-500/50"
        />
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => { setItemToDelete(null); setConfirmationInput(''); }}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={confirmationInput !== itemToDelete.name || isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold text-white
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

**Required State Variables**:
```tsx
const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null);
const [confirmationInput, setConfirmationInput] = useState('');
const [isDeleting, setIsDeleting] = useState(false);
```

**Button Disabled Condition**:
```tsx
disabled={confirmationInput !== itemToDelete.name || isDeleting}
```

**Rationale**: Requiring users to type the name of the object being deleted prevents accidental deletions and ensures users consciously acknowledge which item they are removing. This pattern is especially critical for irreversible operations and follows industry best practices (GitHub repository deletion, AWS resource deletion, etc.).

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

**Version**: 1.2.0 | **Ratified**: 2025-12-27 | **Last Amended**: 2025-12-29
