# Research: Tool Category Management

## Existing Patterns Analysis

### Decision: Follow ToolManagement.tsx patterns
**Rationale**: The existing ToolManagement.tsx provides a proven, consistent pattern for CRUD operations that users are already familiar with. Reusing these patterns ensures UI consistency and reduces implementation risk.
**Alternatives considered**:
- Creating a new standalone page → Rejected (breaks navigation flow, inconsistent UX)
- Inline editing in tool list → Rejected (categories are a separate entity, deserve dedicated management)

### Decision: Use tab-based navigation within ToolManagement
**Rationale**: Adding a "类目" tab alongside the existing tools list keeps related functionality grouped together and is consistent with how other management pages work.
**Alternatives considered**:
- Sidebar navigation → Rejected (too complex for just two views)
- Separate route/page → Rejected (categories are closely related to tools)

### Decision: Reuse existing API client pattern (apiPostRaw)
**Rationale**: The tools API service already uses apiPostRaw for direct response handling without wrapper. Categories API follows the same backend pattern.
**Alternatives considered**:
- apiPost with wrapper → Rejected (Categories API returns data directly like Tools API)

## TypeScript Types Analysis

### Decision: Simplify ToolCategoryDTO (remove parent_id)
**Rationale**: Per clarification, categories are flat (no nesting). The existing ToolCategoryDTO in types.ts has parent_id which is not needed for this implementation. We should update it to reflect the flat structure.
**Alternatives considered**:
- Keep parent_id as optional → Rejected (causes confusion, spec explicitly says no hierarchy)

### Decision: Add request/response types for category CRUD
**Rationale**: Following the pattern from tools.ts, we need typed request/response interfaces for type safety and code documentation.
**Types to add**:
- ToolCategoryListRequest
- ToolCategoryListResponse
- ToolCategoryCreateRequest
- ToolCategoryUpdateRequest
- ToolCategoryIdRequest

## UI Component Analysis

### Decision: Create CategoryManagement component in tool/ subfolder
**Rationale**: Keeps category-related components organized together. Following the pattern used for topology/ and prompt/ subfolders.
**Alternatives considered**:
- Root components folder → Rejected (mixing with unrelated components)
- Inline in ToolManagement.tsx → Rejected (file would become too large)

### Decision: Reuse existing UI components
**Rationale**: ConfirmDialog, loading states, error alerts, pagination patterns already exist and are tested.
**Components to reuse**:
- ConfirmDialog (for delete confirmation)
- Loader2 icon (for loading states)
- AlertCircle (for error display)
- ChevronLeft/ChevronRight (for pagination)

## API Integration Analysis

### Decision: Create services/api/categories.ts
**Rationale**: Separation of concerns - categories have their own endpoints and should have their own service file.
**Endpoints to implement**:
- POST /api/tools/v1/categories/list
- POST /api/tools/v1/categories/create
- POST /api/tools/v1/categories/get
- POST /api/tools/v1/categories/update
- POST /api/tools/v1/categories/delete

### Decision: Create useCategories hook
**Rationale**: Following the useTools hook pattern for consistent data fetching and state management.
**Hook features**:
- Pagination support
- Search/filter (if needed)
- Loading/error states
- Refresh capability

## Tool-Category Integration

### Decision: Add category dropdown to ToolFormModal
**Rationale**: Users need to assign categories when creating/editing tools. A dropdown in the existing form is the most intuitive location.
**Implementation**:
- Fetch categories list on modal open
- Show flat list in dropdown
- Allow "无" (none) option for tools without category

### Decision: Display category name on tool cards/list
**Rationale**: Users should see which category a tool belongs to at a glance.
**Implementation**:
- Add category badge/tag to tool card view
- Add category column to tool list view
- Use FolderOpen icon for category indicator

## Error Handling

### Decision: Handle deletion blocked by API
**Rationale**: When a category has tools assigned, the API will reject deletion. We should display a clear error message.
**Implementation**:
- Catch API error response
- Display user-friendly message: "无法删除：该类目下仍有工具"
- Optionally show count of tools in category

### Decision: Handle duplicate name on create/edit
**Rationale**: Category names must be unique. API will reject duplicates.
**Implementation**:
- Catch API error for duplicate name
- Display validation error: "类目名称已存在"
- Keep form open for user to correct
