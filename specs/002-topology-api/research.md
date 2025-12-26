# Research: Topology Management API Integration

**Feature**: 002-topology-api
**Date**: 2025-12-25

## Research Tasks

### 1. Backend API Endpoints

**Source**: Feature specification FR-001 through FR-011

The following API endpoints are specified for integration:

| Endpoint | Purpose | FR |
|----------|---------|-----|
| `/api/v1/resources/topology/query` | Fetch topology graph data | FR-001 |
| `/api/v1/resources/members/add` | Add members to subgraph | FR-002 |
| `/api/v1/resources/members/remove` | Remove members from subgraph | FR-003 |
| `/api/v1/resources/members/query` | Query paginated member list | FR-004 |
| `/api/v1/resources/members-with-relations/query` | Fetch members with relationships | FR-005 |
| `/api/v1/resources/ancestors/query` | Query ancestor breadcrumb | FR-006 |
| `/api/v1/relationships/create` | Create relationship | FR-007 |
| `/api/v1/relationships/update` | Update relationship | FR-008 |
| `/api/v1/relationships/delete` | Delete relationship | FR-009 |
| `/api/v1/relationships/resource/query` | Query resource relationships | FR-010 |
| `/api/v1/relationships/resource/cycle-detection` | Detect cycles | FR-011 |

**Decision**: Follow existing API patterns from Feature 001 (resource-api-integration)
**Rationale**: Consistency with existing codebase, reuse of apiPost client
**Alternatives Considered**: None - existing pattern is well-established

### 2. Data Transformation: API to D3

**Research Question**: How to transform API response data to D3.js visualization format?

**Current TopologyGraph.tsx Structure**:
```typescript
interface Topology {
  nodes: TopologyNode[];
  links: TopologyLink[];
}

interface TopologyNode {
  id: string;
  label: string;
  type: string;
  layer: TopologyLayer;
  isShadow?: boolean;
}

interface TopologyLink {
  source: string;
  target: string;
  type: 'call' | 'dependency' | 'deployment' | 'inferred';
  confidence?: number;
}
```

**Decision**: Create transformer functions in topology.ts to convert API DTOs to D3 format
**Rationale**: Separation of concerns - API layer handles data fetching, transformation layer adapts to visualization
**Alternatives Considered**:
- Direct use of API DTOs - Rejected due to type mismatch with existing visualization code

### 3. Relationship Types Mapping

**Research Question**: How to map API relationship types to visualization edge styles?

**Spec Clarification**: 4 standard types - DEPENDENCY, DATA_FLOW, API_CALL, DEPLOYMENT

**Decision**: Map relationship types as follows:
| API Type | D3 Link Type | Visual Style |
|----------|--------------|--------------|
| API_CALL | call | Solid cyan, animated flow |
| DEPENDENCY | dependency | Dashed gray |
| DATA_FLOW | call | Solid cyan, animated flow |
| DEPLOYMENT | deployment | Solid dark gray, lower opacity |

**Rationale**: Maintain visual consistency with existing TopologyGraph styling
**Alternatives Considered**: Creating new visual styles - Rejected to minimize visual changes

### 4. Inline Subgraph Expansion

**Research Question**: How to implement inline expansion of nested subgraphs?

**Current Behavior**: Double-click navigates to subgraph detail view

**Decision**: Implement collapsible group nodes
- Single-click: Toggle expansion state, show/hide member nodes within a visual boundary
- Double-click: Navigate to dedicated subgraph view (existing behavior)
- Expanded subgraphs render members within a dashed boundary box

**Rationale**: Provides both quick preview and full navigation options
**Alternatives Considered**:
- Modal popup for inline preview - Rejected as less intuitive than inline expansion

### 5. Pagination Strategy for Members View

**Research Question**: How to implement view-mode-aware pagination?

**Spec Clarification**:
- Card mode: 8 items per page
- List mode: 10 items per page

**Decision**: Create custom hook `usePaginatedMembers` with view mode parameter
```typescript
interface UsePaginatedMembersOptions {
  subgraphId: number;
  viewMode: 'card' | 'list';
}
// Returns page size based on viewMode: card=8, list=10
```

**Rationale**: Single hook manages pagination complexity, view mode determines page size
**Alternatives Considered**:
- Separate hooks per view mode - Rejected as duplicative

### 6. Cycle Detection UX

**Research Question**: How to present cycle detection errors to users?

**Decision**:
1. Call cycle-detection API before adding member
2. If cycle detected, show modal with:
   - Error message explaining circular reference
   - Visual path showing the cycle (e.g., A → B → C → A)
   - Cancel action only (no force option)

**Rationale**: Clear error messaging with visual context helps users understand and fix issues
**Alternatives Considered**:
- Toast notification - Rejected as insufficient for understanding cycle path

### 7. Optimistic Locking Implementation

**Research Question**: How to handle version conflicts in update operations?

**Current Pattern** (from resources.ts): Version field in update requests

**Decision**: Follow existing pattern from Feature 001
1. Include `version` field in all update requests
2. Handle 409 Conflict response with user-friendly message
3. Offer "Refresh and retry" option

**Rationale**: Consistent with existing resource management patterns
**Alternatives Considered**: None - proven pattern already in use

## Summary of Decisions

| Area | Decision | Impact |
|------|----------|--------|
| API Integration | Use existing apiPost client | Low risk, consistent patterns |
| Data Transform | Create topology.ts transformer | New file, ~100 lines |
| Relationship Types | Map 4 types to existing visual styles | Visual consistency |
| Inline Expansion | Collapsible group nodes | Medium complexity, modify TopologyGraph |
| Pagination | View-mode-aware hook | New hook, ~50 lines |
| Cycle Detection | Modal with visual path | New modal component |
| Optimistic Locking | Follow existing pattern | Low risk, proven approach |

## Open Questions

None - all clarifications resolved in spec.md and this research.
