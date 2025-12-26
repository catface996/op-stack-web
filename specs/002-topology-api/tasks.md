# Tasks: Topology Management API Integration

**Input**: Design documents from `/specs/002-topology-api/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No tests explicitly requested in specification. E2E tests omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- **Components**: `components/`
- **Services/API**: `services/api/`
- **Hooks**: `services/hooks/`
- **Types**: `services/api/types.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: API types and service foundation

- [x] T001 [P] Add topology-related TypeScript types to services/api/types.ts (TopologyNode, TopologyEdge, SubgraphMember, SubgraphBoundary, Relationship, RelationshipType, RelationshipDirection, RelationshipStatus, AncestorNode)
- [x] T002 [P] Add topology API request/response types to services/api/types.ts (TopologyQueryRequest, TopologyQueryResponse, MembersAddRequest, MembersRemoveRequest, MembersQueryRequest, RelationshipCreateRequest, RelationshipUpdateRequest, CycleDetectionRequest, CycleDetectionResponse, AncestorsQueryRequest)
- [x] T003 Create topology API service file services/api/topology.ts with API endpoints constants

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core API service functions and data transformation utilities

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement queryTopology API function in services/api/topology.ts for /api/v1/resources/topology/query endpoint
- [x] T005 [P] Implement queryMembers API function in services/api/topology.ts for /api/v1/resources/members/query endpoint
- [x] T006 [P] Implement queryMembersWithRelations API function in services/api/topology.ts for /api/v1/resources/members-with-relations/query endpoint
- [x] T007 [P] Implement addMembers API function in services/api/topology.ts for /api/v1/resources/members/add endpoint
- [x] T008 [P] Implement removeMembers API function in services/api/topology.ts for /api/v1/resources/members/remove endpoint
- [x] T009 [P] Implement queryAncestors API function in services/api/topology.ts for /api/v1/resources/ancestors/query endpoint
- [x] T010 [P] Implement createRelationship API function in services/api/topology.ts for /api/v1/relationships/create endpoint
- [x] T011 [P] Implement updateRelationship API function in services/api/topology.ts for /api/v1/relationships/update endpoint
- [x] T012 [P] Implement deleteRelationship API function in services/api/topology.ts for /api/v1/relationships/delete endpoint
- [x] T013 [P] Implement queryResourceRelationships API function in services/api/topology.ts for /api/v1/relationships/resource/query endpoint
- [x] T014 [P] Implement detectCycles API function in services/api/topology.ts for /api/v1/relationships/resource/cycle-detection endpoint
- [x] T015 Create transformToD3 utility function in services/api/topology.ts to convert API TopologyQueryResponse to D3-compatible Topology format
- [x] T016 Create mapRelationshipType utility function in services/api/topology.ts to map API RelationshipType to TopologyGraph link types (API_CALL/DATA_FLOW→call, DEPENDENCY→dependency, DEPLOYMENT→deployment)
- [x] T017 Export topologyApi object from services/api/topology.ts and update services/api/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Topology Graph (Priority: P1) 🎯 MVP

**Goal**: Display interactive topology graph with resources and relationships from real API data

**Independent Test**: Open a subgraph resource detail page, select topology tab, verify nodes and edges render correctly with proper styling

### Implementation for User Story 1

- [x] T018 [P] [US1] Create useTopology hook in services/hooks/useTopology.ts that fetches topology data for a subgraphId and transforms it to D3 format
- [x] T019 [US1] Modify components/TopologyGraph.tsx to accept optional resourceId prop and fetch data via useTopology hook when provided
- [ ] T020 [US1] Update TopologyGraph node rendering to use isSubgraph property for visual distinction of subgraph boundaries (dashed border, different background)
- [ ] T021 [US1] Implement node hover tooltip in components/TopologyGraph.tsx showing resource name, type, and status
- [ ] T022 [US1] Add inline expansion state management to TopologyGraph.tsx for SubgraphBoundary with expanded/collapsed toggle
- [ ] T023 [US1] Implement single-click handler on subgraph nodes to toggle inline expansion (show/hide member nodes within boundary)
- [ ] T024 [US1] Implement double-click handler on subgraph nodes to navigate to that subgraph's dedicated topology view
- [x] T025 [US1] Add loading state display in TopologyGraph.tsx during API fetch operations (FR-016)
- [x] T026 [US1] Add error state display with retry option in TopologyGraph.tsx when API fails (FR-017)
- [x] T027 [US1] Add Topology tab to components/ApiResourceDetailView.tsx that renders TopologyGraph when resource isSubgraph=true

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Manage Subgraph Members (Priority: P1)

**Goal**: Add and remove resources from subgraphs with cycle detection

**Independent Test**: Add a resource to a subgraph and verify it appears in member list and graph

### Implementation for User Story 2

- [ ] T028 [P] [US2] Create useMembers hook in services/hooks/useMembers.ts for paginated member list with add/remove operations
- [ ] T029 [P] [US2] Create useCycleDetection hook in services/hooks/useCycleDetection.ts that checks for circular references before adding members
- [ ] T030 [US2] Create AddMembersDialog component in components/topology/AddMembersDialog.tsx with resource selection (searchable list of available resources)
- [ ] T031 [US2] Implement cycle detection call in AddMembersDialog.tsx before confirming member addition (FR-011)
- [ ] T032 [US2] Create CycleDetectionErrorModal component in components/topology/CycleDetectionErrorModal.tsx showing cycle path visualization and error message
- [ ] T033 [US2] Add "Add Members" button to topology view that opens AddMembersDialog
- [ ] T034 [US2] Implement member removal confirmation dialog with remove button on member items
- [ ] T035 [US2] Update topology graph to refresh after member add/remove operations
- [ ] T036 [US2] Add empty state component to TopologyGraph.tsx when subgraph has no members with guidance to add members

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Manage Resource Relationships (Priority: P2)

**Goal**: Create, view, and delete relationships between resources

**Independent Test**: Create a relationship between two resources and verify it appears as an edge in the graph

### Implementation for User Story 3

- [ ] T037 [P] [US3] Create useRelationships hook in services/hooks/useRelationships.ts for CRUD operations on relationships
- [ ] T038 [US3] Create CreateRelationshipDialog component in components/topology/CreateRelationshipDialog.tsx with form for type (DEPENDENCY, DATA_FLOW, API_CALL, DEPLOYMENT), direction (UNIDIRECTIONAL, BIDIRECTIONAL), strength (1-10), and optional description
- [ ] T039 [US3] Update TopologyGraph port click handler to open CreateRelationshipDialog with source/target pre-filled (extend existing handlePortClick)
- [ ] T040 [US3] Add multi-node selection capability to TopologyGraph.tsx (shift+click to select multiple nodes)
- [ ] T041 [US3] Add "Create Relationship" button that appears when exactly 2 nodes are selected
- [ ] T042 [US3] Implement right-click context menu on relationship edges with "Delete" option
- [ ] T043 [US3] Create DeleteRelationshipConfirmDialog component in components/topology/DeleteRelationshipConfirmDialog.tsx
- [ ] T044 [US3] Update edge rendering in TopologyGraph.tsx to show relationship type visually (dashed for DEPENDENCY, solid cyan for API_CALL/DATA_FLOW, solid dark for DEPLOYMENT per research.md)
- [ ] T045 [US3] Handle optimistic locking (version field) in relationship update operations with conflict error handling (FR-015)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Navigate Subgraph Hierarchy (Priority: P2)

**Goal**: Navigate through nested subgraphs with breadcrumb trail

**Independent Test**: Double-click a nested subgraph node and verify navigation to that subgraph's detail view with breadcrumb

### Implementation for User Story 4

- [ ] T046 [P] [US4] Create useAncestors hook in services/hooks/useAncestors.ts that fetches ancestor chain for a resource
- [ ] T047 [US4] Create BreadcrumbNavigation component in components/topology/BreadcrumbNavigation.tsx displaying ancestor chain (FR-006)
- [ ] T048 [US4] Integrate BreadcrumbNavigation into topology view above the graph
- [ ] T049 [US4] Implement breadcrumb click handler to navigate to clicked ancestor's topology view
- [ ] T050 [US4] Update subgraph double-click navigation to include breadcrumb context update

**Checkpoint**: At this point, User Stories 1-4 should all work independently

---

## Phase 7: User Story 5 - View Member List (Priority: P3)

**Goal**: Paginated list view of subgraph members in card and list modes

**Independent Test**: View members tab and verify pagination works correctly with 8 items in card mode, 10 items in list mode

### Implementation for User Story 5

- [ ] T051 [P] [US5] Create usePaginatedMembers hook in services/hooks/usePaginatedMembers.ts with viewMode-aware page size (8 for card, 10 for list)
- [ ] T052 [US5] Create MembersListView component in components/topology/MembersListView.tsx with card/list view toggle
- [ ] T053 [US5] Implement card view mode in MembersListView showing member cards with icon, name, type, status (8 per page)
- [ ] T054 [US5] Implement list view mode in MembersListView showing table with member details (10 per page)
- [ ] T055 [US5] Add pagination controls to MembersListView (page navigation, page size display)
- [ ] T056 [US5] Add Members tab to ApiResourceDetailView.tsx that renders MembersListView when resource isSubgraph=true
- [ ] T057 [US5] Implement member click to navigate to member's detail view or show details panel

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T058 [P] Add loading spinners and skeleton states to all topology components for consistent UX
- [ ] T059 [P] Standardize error messages and retry buttons across all topology API operations
- [ ] T060 Performance optimization: Implement node/edge filtering for topologies with >100 nodes
- [ ] T061 Add keyboard shortcuts to TopologyGraph (Escape to cancel linking, Delete to remove selected)
- [ ] T062 Run quickstart.md validation to ensure all setup steps work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (both P1 priority)
  - US3 and US4 can proceed in parallel (both P2 priority)
  - US5 is lowest priority (P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories (can run parallel with US1)
- **User Story 3 (P2)**: Can start after Foundational - Benefits from US1 graph rendering but independently testable
- **User Story 4 (P2)**: Can start after Foundational - Benefits from US1 navigation but independently testable
- **User Story 5 (P3)**: Can start after Foundational - No dependencies on other stories

### Within Each User Story

- Hooks before components that use them
- Base components before specialized dialogs
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002 can run in parallel (different type groups in same file)
- T005-T014 can all run in parallel (different API functions)
- T018 can run parallel with other US1 prep work
- T028, T029 can run in parallel (different hooks)
- T037 can run parallel with other US3 prep work
- T046 can run parallel with other US4 prep work
- T051 can run parallel with other US5 prep work
- T058, T059 can run in parallel (different cross-cutting concerns)

---

## Parallel Example: Foundational Phase

```bash
# Launch all API function implementations in parallel:
Task: "Implement queryMembers API function in services/api/topology.ts"
Task: "Implement queryMembersWithRelations API function in services/api/topology.ts"
Task: "Implement addMembers API function in services/api/topology.ts"
Task: "Implement removeMembers API function in services/api/topology.ts"
Task: "Implement queryAncestors API function in services/api/topology.ts"
Task: "Implement createRelationship API function in services/api/topology.ts"
Task: "Implement updateRelationship API function in services/api/topology.ts"
Task: "Implement deleteRelationship API function in services/api/topology.ts"
Task: "Implement queryResourceRelationships API function in services/api/topology.ts"
Task: "Implement detectCycles API function in services/api/topology.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T017)
3. Complete Phase 3: User Story 1 (T018-T027)
4. **STOP and VALIDATE**: Open subgraph resource, verify topology displays correctly
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test: Topology graph displays → Deploy/Demo (MVP!)
3. Add User Story 2 → Test: Can add/remove members → Deploy/Demo
4. Add User Story 3 → Test: Can create relationships → Deploy/Demo
5. Add User Story 4 → Test: Breadcrumb navigation works → Deploy/Demo
6. Add User Story 5 → Test: Member list pagination works → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (View Topology)
   - Developer B: User Story 2 (Manage Members)
3. Then:
   - Developer A: User Story 3 (Manage Relationships)
   - Developer B: User Story 4 (Navigate Hierarchy)
4. Finally:
   - Any developer: User Story 5 (Member List)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- API functions use existing apiPost client from services/api/client.ts
- operatorId is automatically injected in development mode
