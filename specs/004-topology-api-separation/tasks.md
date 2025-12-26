# Tasks: Topology API Separation

**Input**: Design documents from `/specs/004-topology-api-separation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: No tests explicitly requested in specification. E2E tests omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- **Types**: `services/api/types.ts`
- **API**: `services/api/topology.ts`
- **Hooks**: `services/hooks/`
- **Components**: `components/`, `components/topology/`

---

## Phase 1: Setup (Types and API Infrastructure)

**Purpose**: Add new TopologyDTO types and request/response types

- [x] T001 [P] Add TopologyDTO interface to services/api/types.ts based on backend schema
- [x] T002 [P] Add QueryTopologiesRequest interface to services/api/types.ts
- [x] T003 [P] Add CreateTopologyRequest interface to services/api/types.ts
- [x] T004 [P] Add UpdateTopologyRequest interface to services/api/types.ts
- [x] T005 [P] Add DeleteTopologyRequest and GetTopologyRequest interfaces to services/api/types.ts

---

## Phase 2: Foundational (API Layer Updates)

**Purpose**: Update topology.ts with new CRUD endpoints - BLOCKS all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Add TOPOLOGY_CRUD_ENDPOINTS constant to services/api/topology.ts with new /api/v1/topologies/* paths
- [x] T007 [P] Add topologyApi.query() method for POST /api/v1/topologies/query in services/api/topology.ts
- [x] T008 [P] Add topologyApi.create() method for POST /api/v1/topologies/create in services/api/topology.ts
- [x] T009 [P] Add topologyApi.get() method for POST /api/v1/topologies/get in services/api/topology.ts
- [x] T010 [P] Add topologyApi.update() method for POST /api/v1/topologies/update in services/api/topology.ts
- [x] T011 [P] Add topologyApi.delete() method for POST /api/v1/topologies/delete in services/api/topology.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Topology List (Priority: P1) 🎯 MVP

**Goal**: Display paginated list of Topologies using new /api/v1/topologies/query endpoint

**Independent Test**: Navigate to Topologies page, verify list loads with topology names and member counts from TopologyDTO.memberCount

### Implementation for User Story 1

- [x] T012 [US1] Update useTopologies hook to call topologyApi.query() instead of resourceApi.list() in services/hooks/useTopologies.ts
- [x] T013 [US1] Remove client-side isSubgraph filtering logic from useTopologies hook in services/hooks/useTopologies.ts
- [x] T014 [US1] Update resourceToTopologyListItem() adapter to map TopologyDTO to TopologyListItem in services/hooks/useTopologies.ts
- [x] T015 [US1] Update TopologyListItem usage in TopologiesManagement.tsx to use TopologyDTO.memberCount directly
- [x] T016 [US1] Verify pagination works with new API response structure in TopologiesManagement.tsx

**Checkpoint**: User Story 1 should be fully functional - users can view paginated topology list

---

## Phase 4: User Story 2 - Create Topology via New API (Priority: P1)

**Goal**: Create new Topology using dedicated /api/v1/topologies/create endpoint

**Independent Test**: Click "Create Topology", fill form, submit, verify new Topology appears in list

### Implementation for User Story 2

- [x] T017 [US2] Update useTopologyMutations.create() to call topologyApi.create() in services/hooks/useTopologyMutations.ts
- [x] T018 [US2] Remove resourceTypeId and isSubgraph attribute handling from create() in services/hooks/useTopologyMutations.ts
- [x] T019 [US2] Update CreateTopologyRequest to only include name, description, operatorId in services/hooks/useTopologyMutations.ts
- [x] T020 [US2] Verify form submission works with new API endpoint in TopologiesManagement.tsx

**Checkpoint**: User Stories 1 AND 2 work - users can view list and create new Topologies

---

## Phase 5: User Story 3 - Update Topology via New API (Priority: P1)

**Goal**: Edit existing Topology using dedicated /api/v1/topologies/update endpoint

**Independent Test**: Click edit on a Topology, modify fields, save, verify changes persist

### Implementation for User Story 3

- [x] T021 [US3] Update useTopologyMutations.update() to call topologyApi.update() in services/hooks/useTopologyMutations.ts
- [x] T022 [US3] Remove isSubgraph attribute serialization from update() in services/hooks/useTopologyMutations.ts
- [x] T023 [US3] Ensure version field is passed correctly for optimistic locking in services/hooks/useTopologyMutations.ts
- [x] T024 [US3] Handle 409 version conflict error with user-friendly message in services/hooks/useTopologyMutations.ts

**Checkpoint**: User Stories 1-3 work - users can view, create, and edit Topologies

---

## Phase 6: User Story 4 - Delete Topology via New API (Priority: P2)

**Goal**: Delete Topology using dedicated /api/v1/topologies/delete endpoint

**Independent Test**: Click delete on a Topology, confirm in dialog, verify Topology is removed

### Implementation for User Story 4

- [x] T025 [US4] Update useTopologyMutations.remove() to call topologyApi.delete() in services/hooks/useTopologyMutations.ts
- [x] T026 [US4] Update DeleteTopologyRequest to use new schema (id, operatorId only) in services/hooks/useTopologyMutations.ts
- [x] T027 [US4] Verify delete confirmation dialog works with new API in TopologiesManagement.tsx

**Checkpoint**: User Stories 1-4 work - full CRUD for Topologies using new API

---

## Phase 7: User Story 5 - View Topology Details via New API (Priority: P1)

**Goal**: View Topology details using dedicated /api/v1/topologies/get endpoint

**Independent Test**: Click on a Topology to open detail view, verify all fields display correctly

### Implementation for User Story 5

- [x] T028 [US5] Update TopologyDetailView to call topologyApi.get() instead of resourceApi.get() in components/topology/TopologyDetailView.tsx
- [x] T029 [US5] Update TopologyDetailView to use TopologyDTO type instead of ResourceDTO in components/topology/TopologyDetailView.tsx
- [x] T030 [US5] Display TopologyDTO.memberCount in the detail header in components/topology/TopologyDetailView.tsx

**Checkpoint**: All user stories complete - full Topology management with new API

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and consistency improvements

- [x] T031 [P] Remove TOPOLOGY_RESOURCE_TYPE_ID constant from useTopologyMutations.ts (no longer needed)
- [x] T032 [P] Remove serializeTopologyAttributes usage from useTopologyMutations.ts (no longer needed for isSubgraph)
- [x] T033 [P] Update TypeScript types: deprecate or remove ResourceDTO usage for topologies
- [x] T034 [P] Add consistent loading spinners to all topology API operations
- [x] T035 Run TypeScript type checking to verify no type errors after migration

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (View List) is prerequisite for others (MVP)
  - US2-US4 (CRUD) can proceed after US1
  - US5 (Detail View) can proceed after US1
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Foundation for all other stories
- **User Story 2 (P1)**: Depends on US1 (needs list refresh)
- **User Story 3 (P1)**: Depends on US2 (reuses mutation patterns)
- **User Story 4 (P2)**: Depends on US1 (needs list refresh)
- **User Story 5 (P1)**: Depends on US1 (navigation from list)

### Within Each User Story

- Types before API methods
- API methods before hooks
- Hooks before components
- Core implementation before integration

### Parallel Opportunities

- T001, T002, T003, T004, T005 can run in parallel (different type definitions)
- T007, T008, T009, T010, T011 can run in parallel (different API methods)
- T031, T032, T033, T034 can run in parallel (different cleanup concerns)

---

## Parallel Example: Foundational Phase

```bash
# Launch API methods in parallel:
Task: "Add topologyApi.query() method for POST /api/v1/topologies/query"
Task: "Add topologyApi.create() method for POST /api/v1/topologies/create"
Task: "Add topologyApi.get() method for POST /api/v1/topologies/get"
Task: "Add topologyApi.update() method for POST /api/v1/topologies/update"
Task: "Add topologyApi.delete() method for POST /api/v1/topologies/delete"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T011)
3. Complete Phase 3: User Story 1 (T012-T016)
4. **STOP and VALIDATE**: Navigate to Topologies, verify list loads from new API
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test: List displays from new API → Deploy/Demo (MVP!)
3. Add User Story 2 → Test: Can create Topologies → Deploy/Demo
4. Add User Story 3 → Test: Can edit Topologies → Deploy/Demo
5. Add User Story 4 → Test: Can delete Topologies → Deploy/Demo
6. Add User Story 5 → Test: Can view details → Deploy/Demo
7. Each story adds value without breaking previous stories

### Single Developer Strategy

Execute tasks sequentially in priority order:
1. T001-T011 (Setup + Foundational)
2. T012-T016 (US1 - View List - MVP)
3. T017-T020 (US2 - Create)
4. T021-T024 (US3 - Update)
5. T025-T027 (US4 - Delete)
6. T028-T030 (US5 - Details)
7. T031-T035 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- New API uses operatorId (hardcode to 1 for now until auth is implemented)
- Backend automatically sets SUBGRAPH type for topologies - no need to send resourceTypeId
