# Research: Topologies Management Page

**Feature**: 003-topologies-management
**Date**: 2025-12-25

## Research Summary

This document captures technical decisions and research findings for the Topologies Management Page feature.

---

## Decision 1: Data Fetching Strategy

### Question
Should pagination and filtering be handled server-side or client-side?

### Decision
**Hybrid approach**: Server-side pagination, client-side filtering for loaded data.

### Rationale
- Server-side pagination reduces initial load time and memory usage
- Client-side filtering provides instant (<300ms) search response for loaded pages
- Matches the existing pattern in `ApiResourceDetailView.tsx` and other components
- Scale (~100 Topologies) is manageable for either approach

### Alternatives Considered
1. **Pure server-side**: Better for large datasets but adds latency to every search
2. **Pure client-side**: Load all data upfront - rejected due to potential performance impact with many Topologies

### Implementation Notes
- Use `resourceApi.list()` with pagination parameters
- Implement debounced server-side search when user types (300ms debounce)
- Cache current page data for instant filtering within loaded results

---

## Decision 2: State Management

### Question
Should Topology list state be managed locally or in a shared context?

### Decision
**Local state with custom hooks**.

### Rationale
- Follows existing pattern (`useResourceAuditLogs`, `useTopology`)
- No global state needed - Topologies list is self-contained
- Simpler implementation without context providers
- Easy to add caching later if needed

### Alternatives Considered
1. **React Context**: Adds complexity without clear benefit for this use case
2. **Redux/Zustand**: Overkill for single-page data management

### Implementation Notes
- Create `useTopologies` hook encapsulating list fetch, pagination, search
- Create `useTopologyDetail` hook for single topology fetch with members
- Keep state co-located with components that use it

---

## Decision 3: Component Extraction Strategy

### Question
Which parts of existing `TopologiesManagement.tsx` should be extracted into separate files?

### Decision
**Extract modal components and create new member management components**.

### Rationale
- `TopologiesManagement.tsx` is 553 lines - manageable but can be improved
- Modals (`TopologyFormModal`, `TopologyDetailModal`) are self-contained
- New member management UI needs new components anyway
- Keep main list rendering in `TopologiesManagement.tsx` for minimal disruption

### Components to Extract/Create

| Component | Source | Destination | Action |
|-----------|--------|-------------|--------|
| `TopologyFormModal` | Lines 424-501 | `components/topology/TopologyFormModal.tsx` | Extract, add API |
| `TopologyDetailModal` | Lines 503-550 | `components/topology/TopologyDetailModal.tsx` | Extract, add API |
| `TemplateMultiSelect` | Lines 320-422 | Keep inline or move to shared | Keep for now |
| `AddMembersDialog` | New | `components/topology/AddMembersDialog.tsx` | Create |
| `MembersList` | New | `components/topology/MembersList.tsx` | Create |

### Implementation Notes
- Start with minimal extraction - only what's needed for API integration
- Avoid over-engineering; keep related code together

---

## Decision 4: Type Mapping Strategy

### Question
How to handle the mismatch between `TopologyGroup` (frontend, string IDs) and `ResourceDTO` (API, numeric IDs)?

### Decision
**Create adapter functions in hooks, gradually migrate to API types**.

### Rationale
- Direct migration would require changes throughout App.tsx and other components
- Adapter pattern allows incremental migration
- Eventually deprecate `TopologyGroup` interface in favor of `ResourceDTO`

### Type Mapping

| Frontend (TopologyGroup) | Backend (ResourceDTO) | Notes |
|-------------------------|----------------------|-------|
| `id: string` | `id: number` | Convert with `String(id)` / `Number(id)` |
| `name: string` | `name: string` | Direct mapping |
| `description: string` | `description: string \| null` | Handle null |
| `nodeCount: number` | N/A (computed) | Fetch member count separately |
| `createdAt: string` | `createdAt: string` | Direct mapping |
| `tags?: string[]` | `attributes.tags` | Parse from JSON attributes |
| `nodeIds: string[]` | N/A (fetch members) | Use members API |
| `templateIds?: string[]` | `attributes.templateIds` | Parse from JSON attributes |

### Implementation Notes
```typescript
// Adapter function example
function resourceToTopologyGroup(resource: ResourceDTO): TopologyGroup {
  const attrs = resource.attributes ? JSON.parse(resource.attributes) : {};
  return {
    id: String(resource.id),
    name: resource.name,
    description: resource.description || '',
    nodeCount: 0, // Will be filled by separate member count query
    createdAt: resource.createdAt,
    tags: attrs.tags || [],
    nodeIds: [], // Will be filled by members query
    templateIds: attrs.templateIds || [],
  };
}
```

---

## Decision 5: Error Handling Pattern

### Question
How to handle API errors consistently across all operations?

### Decision
**Use existing `ApiError` class and toast-style notifications**.

### Rationale
- Existing `services/api/client.ts` already has `ApiError` class
- Components like `ApiResourceDetailView.tsx` show error patterns
- Consistent UX across all API operations

### Error Handling Flow
1. API call fails → `ApiError` thrown
2. Hook catches error → Sets error state
3. Component renders error UI with retry option
4. User clicks retry → Re-trigger API call

### Implementation Notes
- All hooks should expose `error` and `refetch/retry` properties
- Loading states during API calls
- Optimistic updates for better UX (rollback on error)

---

## Decision 6: Resource Type for Topologies

### Question
What `resourceTypeCode` should be used when creating Topologies?

### Decision
**Use a dedicated "SUBGRAPH" or "TOPOLOGY" resource type**.

### Rationale
- Topologies need to be distinguished from regular resources
- `isSubgraph` attribute alone may not be sufficient for all queries
- Having a specific type allows backend to optimize queries

### Verification Needed
- Check with backend team if a "SUBGRAPH" type exists
- If not, use any valid type + `isSubgraph=true` attribute
- May need to create the type via resource types API first

### Implementation Notes
- Query available resource types on app load
- Use first matching type for Topology creation
- Fallback: use generic "SERVICE" type with `isSubgraph=true`

---

## Open Questions (Resolved)

1. ~~Does backend support filtering by JSON attributes?~~
   **Resolved**: Assume yes; verify during implementation. Fallback to client-side filtering if not.

2. ~~Can we delete a Topology with members?~~
   **Resolved**: Yes, members are just removed from the group, not deleted.

3. ~~What happens to existing mock data during migration?~~
   **Resolved**: Remove mock data usage entirely; initial load will show empty state if no Topologies exist.

---

## References

- Spec 002-topology-api: Member management APIs
- `services/api/resources.ts`: Resource CRUD patterns
- `services/api/topology.ts`: Member management API client
- `components/ApiResourceDetailView.tsx`: Error handling patterns
