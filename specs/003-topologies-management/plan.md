# Implementation Plan: Topologies Management Page

**Branch**: `003-topologies-management` | **Date**: 2025-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-topologies-management/spec.md`

## Summary

Refactor the existing `TopologiesManagement.tsx` component to replace mock data with real backend API integration. The implementation will leverage the existing Resource API (`/api/v1/resources/*`) for Topology CRUD operations and the Topology API (`/api/v1/resources/members/*`) for member management. Topologies are Resources with `isSubgraph=true` attribute.

## Technical Context

**Language/Version**: TypeScript 5.8.2, React 18.2.0
**Primary Dependencies**: React, D3.js 7.9.0, Lucide React, Vite 6.2.0
**Storage**: Backend API (proxied to localhost:8080)
**Testing**: Playwright (E2E available, no unit test framework configured)
**Target Platform**: Web browser (desktop-first)
**Project Type**: Single-page application (SPA) with Vite
**Performance Goals**: 2s page load for 100 Topologies, 300ms search response
**Constraints**: Must integrate with existing API client infrastructure, maintain current UI/UX patterns
**Scale/Scope**: ~100 Topologies, ~1000 members per Topology max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution template is not customized. No specific principle violations to check. Proceeding with standard best practices:
- ✅ Use existing API client patterns (from 001-resource-api)
- ✅ Follow existing component structure
- ✅ Maintain TypeScript strict mode compliance

## Project Structure

### Documentation (this feature)

```text
specs/003-topologies-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (reference existing topology-api contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
components/
├── TopologiesManagement.tsx    # Main list view (MODIFY)
├── TopologyDetailView.tsx      # Detail view with members (CREATE/MODIFY)
├── topology/                   # New subdirectory for modular components
│   ├── TopologyFormModal.tsx   # Create/Edit form (EXTRACT from existing)
│   ├── TopologyDetailModal.tsx # Quick view modal (EXTRACT from existing)
│   ├── AddMembersDialog.tsx    # Resource selection for adding members
│   └── MembersList.tsx         # Paginated member list component

services/
├── api/
│   ├── types.ts               # Existing types (ADD subgraph filter types)
│   ├── resources.ts           # Existing Resource API (USE for CRUD)
│   └── topology.ts            # Existing Topology API (USE for members)
└── hooks/
    ├── useTopologies.ts       # New hook: fetch/manage topology list
    ├── useTopology.ts         # Existing hook (from 002-topology-api)
    └── useMembers.ts          # New hook: fetch/manage members

App.tsx                        # Route handling (MODIFY for topology-detail)
```

**Structure Decision**: Frontend-only SPA with existing component/services structure. New components go in `components/topology/` subdirectory for modularity. Reuse existing API services and extend with new hooks.

## Complexity Tracking

No constitution violations to justify. Implementation follows established patterns.

## Implementation Phases

### Phase Overview

| Phase | Focus | Deliverables | Dependencies |
|-------|-------|--------------|--------------|
| 0 | Research | research.md | None |
| 1 | Design | data-model.md, contracts reference | Phase 0 |
| 2 | Tasks | tasks.md | Phase 1 |

### Phase 0: Research Decisions

Key decisions to document:
1. **Data fetching strategy**: Server-side vs client-side pagination/filtering
2. **State management**: Local state vs shared context for topology data
3. **Component extraction**: Which parts of existing TopologiesManagement.tsx to extract
4. **Integration approach**: How to handle TopologyGroup (frontend type) vs ResourceDTO (API type)

### Phase 1: Design Artifacts

Generate:
1. `data-model.md` - Entity mappings between frontend and backend
2. Reference existing `002-topology-api/contracts/` for member management APIs
3. `quickstart.md` - Setup and verification steps

## API Integration Summary

### Topology CRUD (via Resource API)

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `POST /api/v1/resources/query` | Filter by `isSubgraph=true` in attributes |
| Create | `POST /api/v1/resources/create` | Set `attributes.isSubgraph=true` |
| Get | `POST /api/v1/resources/get` | By ID |
| Update | `POST /api/v1/resources/update` | Include version for optimistic locking |
| Delete | `POST /api/v1/resources/delete` | By ID |

### Member Management (via Topology API)

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List Members | `POST /api/v1/resources/members/query` | Paginated |
| Add Members | `POST /api/v1/resources/members/add` | Array of memberIds |
| Remove Members | `POST /api/v1/resources/members/remove` | Array of memberIds |
| Cycle Detection | `POST /api/v1/relationships/resource/cycle-detection` | Before adding subgraphs |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Backend API not supporting isSubgraph filter | Low | High | Verify API capability early; fallback to client-side filtering |
| ID type mismatch (string vs number) | Medium | Medium | Type adapter functions in hooks |
| Existing TopologyGroup interface coupling | Medium | Low | Create adapter layer, deprecate old interface |
