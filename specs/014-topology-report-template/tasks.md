# Tasks: Topology Report Template Binding

**Input**: Design documents from `/specs/014-topology-report-template/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not requested - manual testing via browser

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `components/`, `services/` at repository root

---

## Phase 1: Setup (Type Definitions)

**Purpose**: Add TypeScript type definitions for the new API endpoints

- [x] T001 [P] Add `BindTopologyReportTemplatesRequest` interface in services/api/types.ts
- [x] T002 [P] Add `UnbindTopologyReportTemplatesRequest` interface in services/api/types.ts
- [x] T003 [P] Add `QueryBoundReportTemplatesRequest` interface in services/api/types.ts
- [x] T004 [P] Add `QueryUnboundReportTemplatesRequest` interface in services/api/types.ts
- [x] T005 [P] Add response type aliases (`BindTopologyReportTemplatesResponse`, etc.) in services/api/types.ts

---

## Phase 2: Foundational (API Client & Hook)

**Purpose**: Core infrastructure that MUST be complete before UI implementation

**⚠️ CRITICAL**: No UI work can begin until this phase is complete

- [x] T006 Create API client file services/api/topologyReportTemplates.ts with `bindReportTemplates` function
- [x] T007 Add `unbindReportTemplates` function in services/api/topologyReportTemplates.ts
- [x] T008 Add `queryBoundReportTemplates` function in services/api/topologyReportTemplates.ts
- [x] T009 Add `queryUnboundReportTemplates` function in services/api/topologyReportTemplates.ts
- [x] T010 Create `useTopologyReportTemplates` hook in services/hooks/useTopologyReportTemplates.ts (following useAgentBinding pattern)
- [x] T011 Export `useTopologyReportTemplates` from services/hooks/index.ts

**Checkpoint**: API integration ready - UI implementation can now begin

---

## Phase 3: User Story 1 & 2 - View, Bind, and Unbind Report Templates (Priority: P1) 🎯 MVP

**Goal**: Users can view available/bound templates and bind/unbind them in a two-column layout

**Independent Test**: Navigate to topology detail view, access report templates section, bind a template, verify it moves to bound list. Then unbind it, verify it moves back to available list.

### Implementation for User Story 1 & 2

- [x] T012 [US1] Create `TopologyReportTemplates.tsx` component file in components/topology/ with basic structure
- [x] T013 [US1] Implement two-column layout container (grid-cols-4: 3 cols available, 1 col bound) in components/topology/TopologyReportTemplates.tsx
- [x] T014 [US1] Implement Available Templates panel (left side) with category grouping in components/topology/TopologyReportTemplates.tsx
- [x] T015 [US1] Implement Bound Templates panel (right side) with category grouping in components/topology/TopologyReportTemplates.tsx
- [x] T016 [US1] Add template card component with name, description, category badge in components/topology/TopologyReportTemplates.tsx
- [x] T017 [US1] Implement bind action (+ button) calling hook's bind function in components/topology/TopologyReportTemplates.tsx
- [x] T018 [US2] Implement unbind action (- button) calling hook's unbind function in components/topology/TopologyReportTemplates.tsx
- [x] T019 [US1] Add loading states for both panels in components/topology/TopologyReportTemplates.tsx
- [x] T020 [US1] Add error display with retry option in components/topology/TopologyReportTemplates.tsx
- [x] T021 [US1] Add empty state messages for both panels in components/topology/TopologyReportTemplates.tsx
- [x] T022 [US1] Integrate `TopologyReportTemplates` into `TopologyDetailView.tsx` (add as sidebar section or modal trigger)

**Checkpoint**: Core bind/unbind functionality complete and testable

---

## Phase 4: User Story 3 - Search and Filter Templates (Priority: P2)

**Goal**: Users can search templates by keyword to find specific ones quickly

**Independent Test**: Enter search term, verify both available and bound lists filter to show matching templates

### Implementation for User Story 3

- [x] T023 [US3] Add search input field in header of TopologyReportTemplates component in components/topology/TopologyReportTemplates.tsx
- [x] T024 [US3] Implement search state management with debouncing in components/topology/TopologyReportTemplates.tsx
- [x] T025 [US3] Pass keyword to useTopologyReportTemplates hook in components/topology/TopologyReportTemplates.tsx
- [x] T026 [US3] Add clear search button (X icon) in components/topology/TopologyReportTemplates.tsx

**Checkpoint**: Search functionality complete and testable

---

## Phase 5: User Story 4 - Paginated Template Lists (Priority: P2)

**Goal**: Users can browse through many templates with pagination controls

**Independent Test**: With many templates, verify pagination controls appear and navigation works

### Implementation for User Story 4

- [x] T027 [US4] Add pagination state (boundPage, unboundPage) exposure from hook in services/hooks/useTopologyReportTemplates.ts
- [x] T028 [US4] Add pagination controls (prev/next or page numbers) to Available panel in components/topology/TopologyReportTemplates.tsx
- [x] T029 [US4] Add pagination controls to Bound panel in components/topology/TopologyReportTemplates.tsx
- [x] T030 [US4] Display total count and current page info in components/topology/TopologyReportTemplates.tsx

**Checkpoint**: Pagination functionality complete and testable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [x] T031 Add "Bind All" button for bulk binding in Available panel in components/topology/TopologyReportTemplates.tsx
- [x] T032 Add "Clear All" button for bulk unbinding in Bound panel in components/topology/TopologyReportTemplates.tsx
- [x] T033 Add binding/unbinding operation loading indicator (spinner during mutations) in components/topology/TopologyReportTemplates.tsx
- [x] T034 Verify all edge cases: empty states, network errors, concurrent updates
- [ ] T035 Run quickstart.md manual test scenarios to validate all endpoints

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all UI work
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 & 2 (P1)**: Combined as MVP - core bind/unbind functionality
- **User Story 3 (P2)**: Can be implemented after US1/2, adds search capability
- **User Story 4 (P2)**: Can be implemented after US1/2, adds pagination

### Within Each Phase

- API client functions can be created in parallel (T006-T009)
- UI components build sequentially (layout → panels → actions)
- Polish tasks can be parallelized

### Parallel Opportunities

```
Phase 1 (all parallel):
T001 || T002 || T003 || T004 || T005

Phase 2 (API functions parallel, then hook):
T006 || T007 || T008 || T009
   ↓
T010 → T011
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3)

1. Complete Phase 1: Type definitions
2. Complete Phase 2: API client and hook
3. Complete Phase 3: Core bind/unbind UI
4. **STOP and VALIDATE**: Test bind/unbind manually
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. User Story 1 & 2 → Core functionality (MVP!)
3. User Story 3 → Add search
4. User Story 4 → Add pagination
5. Polish → Final improvements

---

## Notes

- Follow existing patterns from `useAgentBinding` hook and `ToolsStage.tsx` component
- Use `ReportTemplateDTO` from existing types (Feature 011)
- Group templates by `category` field (Incident, Performance, Security, Audit)
- Two-column layout: Available (3 cols) | Bound (1 col)
- Commit after each task or logical group
