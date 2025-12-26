# Tasks: Backend API Reintegration

**Input**: Design documents from `/specs/005-api-reintegration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Frontend-only web application
- Services: `services/api/`, `services/hooks/`
- Components: `components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and foundational API changes that all user stories depend on

- [x] T001 Add NodeDTO interface to services/api/types.ts
- [x] T002 Add NodeTypeDTO interface to services/api/types.ts
- [x] T003 Update TopologyDTO to add coordinatorAgentId field in services/api/types.ts
- [x] T004 [P] Add node-related request types (QueryNodesRequest, CreateNodeRequest, GetNodeRequest, UpdateNodeRequest, DeleteNodeRequest) to services/api/types.ts
- [x] T005 [P] Update member request types to use topologyId instead of resourceId (QueryMembersRequest, AddMembersRequest, RemoveMembersRequest) in services/api/types.ts
- [x] T006 Add node-related response type aliases to services/api/types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core API services that MUST be complete before user story hooks can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create new node API service file services/api/nodes.ts with ENDPOINTS constant
- [x] T008 [P] Implement nodeApi.query method in services/api/nodes.ts
- [x] T009 [P] Implement nodeApi.create method in services/api/nodes.ts
- [x] T010 [P] Implement nodeApi.get method in services/api/nodes.ts
- [x] T011 [P] Implement nodeApi.update method in services/api/nodes.ts
- [x] T012 [P] Implement nodeApi.delete method in services/api/nodes.ts
- [x] T013 [P] Implement nodeApi.getTypes method in services/api/nodes.ts
- [x] T014 Update topology API member endpoints from /api/v1/resources/members/* to /api/v1/topologies/members/* in services/api/topology.ts
- [x] T015 Update topologyApi.queryMembers to use topologyId parameter in services/api/topology.ts
- [x] T016 Update topologyApi.addMembers to use topologyId parameter in services/api/topology.ts
- [x] T017 Update topologyApi.removeMembers to use topologyId parameter in services/api/topology.ts
- [x] T018 Export nodeApi from services/api/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Topology CRUD Operations (Priority: P1) 🎯 MVP

**Goal**: All topology CRUD operations work with the updated backend API endpoints

**Independent Test**: Create a new topology, view it in the list, update its name, delete it - all operations should succeed without UI changes.

### Implementation for User Story 1

- [x] T019 [US1] Update useTopologies hook to pass operatorId in query request in services/hooks/useTopologies.ts
- [x] T020 [US1] Update useTopology hook to use correct GetTopologyRequest format in services/hooks/useTopology.ts
- [x] T021 [US1] Update useTopologyMutations.create to include operatorId in services/hooks/useTopologyMutations.ts
- [x] T022 [US1] Update useTopologyMutations.update to include operatorId and coordinatorAgentId support in services/hooks/useTopologyMutations.ts
- [x] T023 [US1] Update useTopologyMutations.delete to include operatorId in services/hooks/useTopologyMutations.ts
- [x] T024 [US1] Verify TopologiesManagement component works without code changes (UI unchanged) in components/TopologiesManagement.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Topology Member Management (Priority: P1)

**Goal**: Add and remove members from topologies using the new /api/v1/topologies/members/* endpoints

**Independent Test**: Add a node to a topology, verify it appears in members list, remove it, verify it's removed.

### Implementation for User Story 2

- [x] T025 [US2] Update useMembers hook to use topologyId instead of resourceId in services/hooks/useMembers.ts
- [x] T026 [US2] Update useMemberMutations.add to use topologyId parameter in services/hooks/useMemberMutations.ts
- [x] T027 [US2] Update useMemberMutations.remove to use topologyId parameter in services/hooks/useMemberMutations.ts
- [x] T028 [US2] Update useMemberMutations.checkCycle to use correct parameter name in services/hooks/useMemberMutations.ts
- [x] T029 [US2] Verify MembersList component works without code changes (UI unchanged) in components/topology/MembersList.tsx
- [x] T030 [US2] Verify AddMembersDialog component works without code changes (UI unchanged) in components/topology/AddMembersDialog.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Resource Node CRUD Operations (Priority: P1)

**Goal**: All node CRUD operations work with the new /api/v1/nodes/* endpoints

**Independent Test**: Create a new node, view it in the list, update its name, delete it - all operations should succeed.

### Implementation for User Story 3

- [x] T031 [US3] Create useNodes hook similar to useResources but using nodeApi in services/hooks/useNodes.ts
- [x] T032 [US3] Create useNodeMutations hook for node CRUD operations in services/hooks/useNodeMutations.ts
- [x] T033 [US3] Update useResources hook to use nodeApi internally (or create adapter) in services/hooks/useResources.ts
- [x] T034 [US3] Export useNodes and useNodeMutations from services/hooks/index.ts
- [x] T035 [US3] Update ResourceManagement component imports if needed in components/ResourceManagement.tsx
- [x] T036 [US3] Update ResourceDetailView component imports if needed in components/ResourceDetailView.tsx
- [x] T037 [US3] Remove confirmName requirement from delete operations (nodeApi.delete doesn't need it)

**Checkpoint**: At this point, all P1 user stories should be independently functional

---

## Phase 6: User Story 4 - Node Type Query (Priority: P2)

**Goal**: Node types are fetched from the new /api/v1/nodes/types/query endpoint

**Independent Test**: Open create node form, verify node types dropdown is populated from API.

### Implementation for User Story 4

- [x] T038 [US4] Create useNodeTypes hook using nodeApi.getTypes in services/hooks/useNodeTypes.ts
- [x] T039 [US4] Update useResourceTypes to use nodeApi.getTypes internally (backward compatibility) in services/hooks/useResourceTypes.ts
- [x] T040 [US4] Export useNodeTypes from services/hooks/index.ts
- [x] T041 [US4] Verify node type dropdown works in create/edit forms

**Checkpoint**: Node types work with new endpoint

---

## Phase 7: User Story 5 - Query Nodes by Topology (Priority: P2)

**Goal**: Nodes can be filtered by topology using the topologyId parameter

**Independent Test**: Select a topology filter, verify only nodes belonging to that topology are shown.

### Implementation for User Story 5

- [x] T042 [US5] Update useNodes hook to support topologyId filter parameter in services/hooks/useNodes.ts
- [x] T043 [US5] Update useResources hook to support topologyId filter if needed in services/hooks/useResources.ts
- [x] T044 [US5] Verify filtering works in ResourceManagement component

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and verification across all user stories

- [x] T045 [P] Remove any deprecated endpoint references in services/api/topology.ts
- [x] T046 [P] Remove any deprecated endpoint references in services/api/resources.ts
- [x] T047 [P] Add DEFAULT_OPERATOR_ID constant (value: 1) to centralize hardcoded operatorId
- [x] T048 Update services/api/index.ts exports to include all new APIs
- [x] T049 Update services/hooks/index.ts exports to include all new hooks
- [ ] T050 Run quickstart.md validation - verify all manual testing steps pass
- [ ] T051 Verify no deprecated API endpoints are called (check Network tab)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Topology CRUD): Can start immediately after Foundational
  - US2 (Member Management): Can start immediately after Foundational
  - US3 (Node CRUD): Can start immediately after Foundational
  - US4 (Node Types): Depends on US3 for nodeApi
  - US5 (Topology Filter): Depends on US3 for useNodes
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 4 (P2)**: Depends on User Story 3 (uses nodeApi)
- **User Story 5 (P2)**: Depends on User Story 3 (uses useNodes)

### Within Each User Story

- Hook updates before component verification
- Exports after implementation
- Verification last

### Parallel Opportunities

- **Phase 1**: T004, T005 can run in parallel (different type groups)
- **Phase 2**: T008-T013 can run in parallel (different methods in same file)
- **User Stories**: US1, US2, US3 can all run in parallel after Foundational
- **Phase 8**: T045, T046, T047 can run in parallel (different files)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all nodeApi methods together:
Task: "Implement nodeApi.query method in services/api/nodes.ts"
Task: "Implement nodeApi.create method in services/api/nodes.ts"
Task: "Implement nodeApi.get method in services/api/nodes.ts"
Task: "Implement nodeApi.update method in services/api/nodes.ts"
Task: "Implement nodeApi.delete method in services/api/nodes.ts"
Task: "Implement nodeApi.getTypes method in services/api/nodes.ts"
```

## Parallel Example: P1 User Stories

```bash
# After Foundational is complete, launch all P1 stories together:
# Developer A: User Story 1 (Topology CRUD)
# Developer B: User Story 2 (Member Management)
# Developer C: User Story 3 (Node CRUD)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (type definitions)
2. Complete Phase 2: Foundational (API services)
3. Complete Phase 3: User Story 1 (Topology CRUD)
4. **STOP and VALIDATE**: Test topology CRUD independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Topology CRUD works
3. Add User Story 2 → Test independently → Member management works
4. Add User Story 3 → Test independently → Node CRUD works (full P1 MVP!)
5. Add User Story 4 → Test independently → Node types work
6. Add User Story 5 → Test independently → Topology filter works
7. Complete Polish → Full feature complete

### Recommended Order for Single Developer

1. Phase 1: Setup (T001-T006)
2. Phase 2: Foundational (T007-T018)
3. Phase 3: User Story 1 (T019-T024) - Test
4. Phase 4: User Story 2 (T025-T030) - Test
5. Phase 5: User Story 3 (T031-T037) - Test
6. Phase 6: User Story 4 (T038-T041) - Test
7. Phase 7: User Story 5 (T042-T044) - Test
8. Phase 8: Polish (T045-T051)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No UI changes required - only service layer updates
- Use operatorId: 1 as placeholder until authentication is implemented
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
