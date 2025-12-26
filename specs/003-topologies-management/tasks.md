# Tasks: Topologies Management Page

**Input**: Design documents from `/specs/003-topologies-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No tests explicitly requested in specification. E2E tests omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- **Components**: `components/`, `components/topology/`
- **Services/API**: `services/api/`
- **Hooks**: `services/hooks/`
- **Types**: `services/api/types.ts`
- **Main App**: `App.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Types, utilities, and directory structure

- [x] T001 [P] Create components/topology/ directory for modular topology components
- [x] T002 [P] Add TopologyListItem, TopologyFormData, TopologyAttributes types to services/api/types.ts
- [x] T003 [P] Add parseTopologyAttributes and serializeTopologyAttributes utility functions to services/api/types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hooks and adapters that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create useTopologies hook in services/hooks/useTopologies.ts for fetching paginated topology list with search
- [x] T005 [P] Create useTopologyMutations hook in services/hooks/useTopologyMutations.ts for create/update/delete operations
- [x] T006 [P] Create resourceToTopologyListItem adapter function in services/hooks/useTopologies.ts to convert ResourceDTO to TopologyListItem
- [x] T007 Export new hooks from services/hooks/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Topology List (Priority: P1) 🎯 MVP

**Goal**: Display paginated list of Topologies with search and view mode toggle

**Independent Test**: Navigate to Topologies from top menu, verify list loads with pagination, search, and view mode toggle (card/list)

### Implementation for User Story 1

- [x] T008 [US1] Refactor TopologiesManagement.tsx to remove mock data props and add useTopologies hook
- [x] T009 [US1] Update TopologiesManagement.tsx to call API via useTopologies instead of using props.topologyGroups
- [x] T010 [US1] Implement loading state display in TopologiesManagement.tsx during API fetch
- [x] T011 [US1] Implement error state with retry button in TopologiesManagement.tsx when API fails
- [x] T012 [US1] Implement empty state in TopologiesManagement.tsx when no Topologies exist
- [x] T013 [US1] Update search functionality in TopologiesManagement.tsx to use debounced API search
- [x] T014 [US1] Update pagination controls in TopologiesManagement.tsx to work with API pagination
- [x] T015 [US1] Ensure view mode toggle (card/list) works with different page sizes (8 card, 10 list)

**Checkpoint**: User Story 1 should be fully functional - users can view, search, and paginate Topologies

---

## Phase 4: User Story 2 - Create New Topology (Priority: P1)

**Goal**: Create new Topology via form modal with API integration

**Independent Test**: Click "Create Topology" button, fill form, submit, verify new Topology appears in list

### Implementation for User Story 2

- [x] T016 [US2] Extract TopologyFormModal component to components/topology/TopologyFormModal.tsx (kept inline - simpler)
- [x] T017 [US2] Update TopologyFormModal to accept mode prop ('create' | 'edit') and initialData
- [x] T018 [US2] Implement form validation in TopologyFormModal (name required)
- [x] T019 [US2] Connect TopologyFormModal to useTopologyMutations.create() for API submission
- [x] T020 [US2] Add loading state to form submit button during API call
- [x] T021 [US2] Display API error messages in TopologyFormModal on creation failure
- [x] T022 [US2] Update TopologiesManagement.tsx to refresh list after successful creation

**Checkpoint**: User Stories 1 AND 2 work - users can view list and create new Topologies

---

## Phase 5: User Story 3 - Edit Topology (Priority: P1)

**Goal**: Edit existing Topology details with optimistic locking

**Independent Test**: Click edit on a Topology, modify fields, save, verify changes persist after page refresh

### Implementation for User Story 3

- [x] T023 [US3] Reuse TopologyFormModal in edit mode with pre-populated data
- [x] T024 [US3] Connect TopologyFormModal edit mode to useTopologyMutations.update()
- [x] T025 [US3] Pass version field to update request for optimistic locking
- [x] T026 [US3] Handle version conflict error (409) with user-friendly message and refresh option
- [x] T027 [US3] Update TopologiesManagement.tsx to refresh list after successful edit

**Checkpoint**: User Stories 1-3 work - users can view, create, and edit Topologies

---

## Phase 6: User Story 4 - Delete Topology (Priority: P2)

**Goal**: Delete Topology with confirmation dialog

**Independent Test**: Click delete on a Topology, confirm in dialog, verify Topology is removed from list

### Implementation for User Story 4

- [x] T028 [US4] Create DeleteConfirmDialog component in components/topology/DeleteConfirmDialog.tsx (kept inline - simpler)
- [x] T029 [US4] Display Topology name in DeleteConfirmDialog for confirmation
- [x] T030 [US4] Connect DeleteConfirmDialog to useTopologyMutations.delete()
- [x] T031 [US4] Add loading state to delete confirmation button during API call
- [x] T032 [US4] Handle delete error with user-friendly message
- [x] T033 [US4] Update TopologiesManagement.tsx to refresh list after successful deletion

**Checkpoint**: User Stories 1-4 work - full CRUD for Topologies

---

## Phase 7: User Story 5 - View Topology Details and Members (Priority: P1)

**Goal**: Navigate to detail view showing Topology info and paginated member list

**Independent Test**: Click on a Topology to enter detail view, verify member list displays with correct information

### Implementation for User Story 5

- [x] T034 [P] [US5] Create useMembers hook in services/hooks/useMembers.ts for paginated member list
- [x] T035 [P] [US5] Create MembersList component in components/topology/MembersList.tsx
- [x] T036 [US5] Create or update TopologyDetailView component in components/TopologyDetailView.tsx
- [x] T037 [US5] Display Topology name, description, tags, status in TopologyDetailView header
- [x] T038 [US5] Integrate MembersList into TopologyDetailView with useMembers hook
- [x] T039 [US5] Implement pagination controls in MembersList
- [x] T040 [US5] Add member click handler to navigate to resource detail page
- [x] T041 [US5] Update App.tsx topology-detail case to render TopologyDetailView with API data
- [x] T042 [US5] Add empty state to MembersList when Topology has no members

**Checkpoint**: User Stories 1-5 work - users can view Topology details and member list

---

## Phase 8: User Story 6 - Add Members to Topology (Priority: P1)

**Goal**: Add resources as members via selection dialog with cycle detection

**Independent Test**: Open a Topology, click "Add Members", select resources, confirm, verify members appear in list

### Implementation for User Story 6

- [x] T043 [P] [US6] Create useMemberMutations hook in services/hooks/useMemberMutations.ts for add/remove operations
- [x] T044 [P] [US6] Create useAvailableResources hook in services/hooks/useAvailableResources.ts for resource selection (uses existing useResources)
- [x] T045 [US6] Create AddMembersDialog component in components/topology/AddMembersDialog.tsx
- [x] T046 [US6] Implement searchable resource list in AddMembersDialog
- [x] T047 [US6] Implement multi-select with checkboxes in AddMembersDialog
- [x] T048 [US6] Connect AddMembersDialog to useMemberMutations.add() for API submission
- [x] T049 [US6] Implement cycle detection call before adding subgraph members (FR-010)
- [x] T050 [US6] Display cycle detection error with explanation when circular reference detected
- [x] T051 [US6] Add "Add Members" button to TopologyDetailView that opens AddMembersDialog
- [x] T052 [US6] Refresh member list after successful member addition

**Checkpoint**: User Stories 1-6 work - users can add members to Topologies

---

## Phase 9: User Story 7 - Remove Members from Topology (Priority: P1)

**Goal**: Remove members with confirmation, including batch removal

**Independent Test**: Open a Topology, click remove on a member, confirm, verify member is removed from list

### Implementation for User Story 7

- [x] T053 [US7] Add remove button to each member row in MembersList
- [x] T054 [US7] Create RemoveMemberDialog component in components/topology/RemoveMemberDialog.tsx (inline in MembersList for simplicity)
- [x] T055 [US7] Connect RemoveMemberDialog to useMemberMutations.remove() for single member removal
- [x] T056 [US7] Add checkbox selection to MembersList for batch operations
- [x] T057 [US7] Add "Remove Selected" button that appears when members are selected
- [x] T058 [US7] Implement batch removal via useMemberMutations.remove() with multiple memberIds
- [x] T059 [US7] Refresh member list after successful member removal

**Checkpoint**: All user stories complete - full Topology and member management

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T060 [P] Remove unused mock data props from App.tsx for TopologiesManagement
- [x] T061 [P] Add consistent loading spinners across all topology components
- [x] T062 [P] Standardize error message display across all topology API operations
- [ ] T063 Update App.tsx to remove topologyGroups state management (now API-driven)
- [ ] T064 Run quickstart.md validation to ensure all setup steps work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - US1 (View List) is prerequisite for others (MVP)
  - US2-US4 (CRUD) can proceed after US1
  - US5-US7 (Members) can proceed after US1
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Foundation for all other stories
- **User Story 2 (P1)**: Depends on US1 (needs list refresh)
- **User Story 3 (P1)**: Depends on US2 (reuses form modal)
- **User Story 4 (P2)**: Depends on US1 (needs list refresh)
- **User Story 5 (P1)**: Depends on US1 (navigation from list)
- **User Story 6 (P1)**: Depends on US5 (detail view context)
- **User Story 7 (P1)**: Depends on US5 and US6 (member list context)

### Within Each User Story

- Hooks before components that use them
- Base components before specialized dialogs
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002, T003 can run in parallel (different files)
- T005, T006 can run in parallel (different files)
- T034, T035 can run in parallel (different files)
- T043, T044 can run in parallel (different files)
- T060, T061, T062 can run in parallel (different concerns)

---

## Parallel Example: Foundational Phase

```bash
# Launch hooks in parallel:
Task: "Create useTopologyMutations hook in services/hooks/useTopologyMutations.ts"
Task: "Create resourceToTopologyListItem adapter function in services/hooks/useTopologies.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: User Story 1 (T008-T015)
4. **STOP and VALIDATE**: Navigate to Topologies, verify list loads from API
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test: List displays from API → Deploy/Demo (MVP!)
3. Add User Story 2 → Test: Can create Topologies → Deploy/Demo
4. Add User Story 3 → Test: Can edit Topologies → Deploy/Demo
5. Add User Story 4 → Test: Can delete Topologies → Deploy/Demo
6. Add User Story 5 → Test: Can view details/members → Deploy/Demo
7. Add User Story 6 → Test: Can add members → Deploy/Demo
8. Add User Story 7 → Test: Can remove members → Deploy/Demo
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Stories 1-4 (List + CRUD)
   - Developer B: User Stories 5-7 (Detail + Members)
3. Stories integrate via shared hooks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- API functions already exist in services/api/resources.ts and services/api/topology.ts
- Reuse existing TopologyDetailModal pattern for quick view (optional)
