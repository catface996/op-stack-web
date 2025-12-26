# Implementation Plan: Topology API Separation

**Branch**: `004-topology-api-separation` | **Date**: 2025-12-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-topology-api-separation/spec.md`

## Summary

Migrate the frontend from using Resource API with client-side filtering (by `isSubgraph` attribute) to the new dedicated Topology Management API (`/api/v1/topologies/*`). This is a refactoring task that updates API endpoints and types while maintaining existing UI functionality.

## Technical Context

**Language/Version**: TypeScript 5.8.2, React 18.2.0
**Primary Dependencies**: React, D3.js 7.9.0, Lucide React, Vite 6.2.0
**Storage**: Backend API (proxied to localhost:8080)
**Testing**: Playwright (E2E available, no unit test framework configured)
**Target Platform**: Web browser (desktop-first)
**Project Type**: Single-page application (SPA) with Vite
**Performance Goals**: 2s page load for 100 Topologies, 300ms search response
**Constraints**: Must maintain backward compatibility during migration, no UI changes required
**Scale/Scope**: ~100 Topologies, ~1000 members per Topology max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No constitution violations. This is a refactoring task following established patterns:
- ✅ Use existing API client patterns (from 001-resource-api)
- ✅ Follow existing component structure
- ✅ Maintain TypeScript strict mode compliance
- ✅ No new dependencies required

## Project Structure

### Documentation (this feature)

```text
specs/004-topology-api-separation/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
services/
├── api/
│   ├── types.ts               # ADD: TopologyDTO, topology request/response types
│   ├── resources.ts           # NO CHANGES (resources API remains for non-topology resources)
│   └── topology.ts            # MODIFY: Add topology CRUD methods, update endpoints
└── hooks/
    ├── useTopologies.ts       # MODIFY: Use new /api/v1/topologies/query endpoint
    ├── useTopologyMutations.ts # MODIFY: Use new topology CRUD endpoints
    └── useMembers.ts          # REVIEW: Check if member endpoints changed

components/
├── TopologiesManagement.tsx    # MODIFY: Use TopologyDTO instead of ResourceDTO
├── topology/
│   └── TopologyDetailView.tsx  # MODIFY: Use topologyApi.get() instead of resourceApi.get()

App.tsx                        # REVIEW: May need type updates
```

**Structure Decision**: Frontend-only SPA. Changes are primarily in services/api and services/hooks layers. Components need type updates but no structural changes.

## API Migration Summary

### Old API → New API Mapping

| Operation | Old Endpoint | New Endpoint |
|-----------|--------------|--------------|
| List | `POST /api/v1/resources/query` + filter | `POST /api/v1/topologies/query` |
| Create | `POST /api/v1/resources/create` | `POST /api/v1/topologies/create` |
| Get | `POST /api/v1/resources/get` | `POST /api/v1/topologies/get` |
| Update | `POST /api/v1/resources/update` | `POST /api/v1/topologies/update` |
| Delete | `POST /api/v1/resources/delete` | `POST /api/v1/topologies/delete` |

### New TopologyDTO Schema

```typescript
interface TopologyDTO {
  id: number;
  name: string;
  description: string;
  status: string;           // RUNNING/STOPPED/MAINTENANCE/OFFLINE
  statusDisplay: string;    // Localized display name
  attributes: string;       // JSON string for extended attributes
  memberCount: number;      // NEW: Direct member count (no parsing needed)
  version: number;          // For optimistic locking
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}
```

### Key Differences from ResourceDTO

1. **No resourceTypeId/resourceTypeName/resourceTypeCode** - Topologies are a single type
2. **memberCount field** - Direct count, no need to parse from attributes
3. **No isSubgraph attribute** - Topologies are implicitly subgraphs

## Implementation Phases

### Phase Overview

| Phase | Focus | Tasks | Dependencies |
|-------|-------|-------|--------------|
| 1 | Setup | Add types | None |
| 2 | API Layer | Update topology.ts | Phase 1 |
| 3 | Hooks | Update useTopologies, useTopologyMutations | Phase 2 |
| 4 | Components | Update TopologiesManagement, TopologyDetailView | Phase 3 |
| 5 | Cleanup | Remove old filtering logic | Phase 4 |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Member APIs also changed | Medium | Medium | Verify member endpoint paths in API docs |
| Type mismatches during migration | Low | Low | Use adapter functions, gradual migration |
| Missing operatorId in requests | Low | High | Ensure all requests include operatorId |

## Complexity Tracking

No constitution violations to justify. This is a straightforward API migration.
