# Implementation Plan: Backend API Reintegration

**Branch**: `005-api-reintegration` | **Date**: 2025-12-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-api-reintegration/spec.md`

## Summary

Reintegrate frontend with restructured backend API. The backend has separated concerns into:
- **Topology Management** (`/api/v1/topologies/*`) - For topology CRUD and member management
- **Resource Node Management** (`/api/v1/nodes/*`) - New dedicated endpoints replacing old resource APIs
- **Relationship Management** (`/api/v1/relationships/*`) - Unchanged

This is a service layer refactoring with no UI changes. All existing functionality must continue to work seamlessly.

## Technical Context

**Language/Version**: TypeScript 5.8.2, React 18.2.0
**Primary Dependencies**: Vite 6.2.0, D3.js 7.9.0, Lucide React, React Icons
**Storage**: N/A (backend API handles persistence, proxied to localhost:8080)
**Testing**: Playwright (E2E tests)
**Target Platform**: Web browser (SPA)
**Project Type**: Web application (frontend only)
**Performance Goals**: API calls complete within 3 seconds
**Constraints**: No UI changes, maintain backward compatibility
**Scale/Scope**: ~15 service files, ~25 component files affected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution is not configured. Proceeding with standard development practices:
- ✅ Maintain existing code structure and patterns
- ✅ No breaking changes to UI components
- ✅ Follow existing TypeScript conventions
- ✅ Preserve existing test patterns

## Project Structure

### Documentation (this feature)

```text
specs/005-api-reintegration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── topology-api.yaml
│   ├── nodes-api.yaml
│   └── members-api.yaml
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Frontend-only web application
services/
├── api/
│   ├── client.ts        # HTTP client (unchanged)
│   ├── index.ts         # API exports
│   ├── types.ts         # Type definitions (UPDATE)
│   ├── resources.ts     # Resource API (UPDATE: migrate to nodes)
│   ├── topology.ts      # Topology API (UPDATE: new endpoints)
│   └── nodes.ts         # NEW: Node API service
└── hooks/
    ├── index.ts         # Hook exports
    ├── useTopologies.ts # Topology list hook (UPDATE)
    ├── useTopology.ts   # Single topology hook (UPDATE)
    ├── useTopologyMutations.ts # Topology CRUD (UPDATE)
    ├── useMembers.ts    # Member list hook (UPDATE)
    ├── useMemberMutations.ts # Member CRUD (UPDATE)
    ├── useResources.ts  # Resource list hook (RENAME/UPDATE to useNodes)
    ├── useResourceTypes.ts # Types hook (UPDATE to useNodeTypes)
    └── useResourceAuditLogs.ts # Audit logs (unchanged)

components/
├── ResourceManagement.tsx    # Resource list (UPDATE imports)
├── ResourceDetailView.tsx    # Resource detail (UPDATE imports)
├── TopologiesManagement.tsx  # Topology list (unchanged UI)
├── topology/
│   ├── TopologyDetailView.tsx # Topology detail (unchanged UI)
│   ├── MembersList.tsx       # Members list (unchanged UI)
│   └── AddMembersDialog.tsx  # Add members (unchanged UI)
└── ...

tests/
└── (Playwright E2E tests)
```

**Structure Decision**: Frontend-only React application with service layer abstraction. API services handle backend communication, hooks provide React integration, components consume hooks. This feature only modifies service layer while preserving component interfaces.

## Complexity Tracking

No constitution violations to justify - this is a straightforward API migration with no architectural changes.

## Implementation Phases

### Phase 0: Research (Complete)

See [research.md](./research.md) for:
- API endpoint mapping analysis
- Type definition changes
- Migration strategy decisions

### Phase 1: Design & Contracts (Complete)

See artifacts:
- [data-model.md](./data-model.md) - Entity definitions
- [contracts/](./contracts/) - API contracts
- [quickstart.md](./quickstart.md) - Developer guide

### Phase 2: Tasks (via /speckit.tasks)

Implementation tasks will be generated with dependencies and verification criteria.
