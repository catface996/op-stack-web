# Tasks: URL Routing and Navigation History

**Input**: Design documents from `/specs/006-url-routing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install React Router and create foundational infrastructure

- [x] T001 Install react-router-dom dependency via `npm install react-router-dom`
- [x] T002 Create route constants file in services/routes.ts with ROUTES object and path helpers
- [x] T003 [P] Create NotFound component in components/NotFound.tsx for 404 handling

---

## Phase 2: Foundational (Router Infrastructure)

**Purpose**: Core router setup that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Wrap application with BrowserRouter in index.tsx
- [x] T005 Create Layout component in components/Layout.tsx extracting sidebar and header from App.tsx
- [x] T006 Refactor App.tsx to use Routes and Route components with Layout as parent route
- [x] T007 Define all route paths in App.tsx matching URL patterns from contracts/routes.md
- [x] T008 Update sidebar navigation in Layout.tsx to use NavLink components with active state styling

**Checkpoint**: Router infrastructure ready - URL changes when clicking sidebar items

---

## Phase 3: User Story 1 - URL Reflects Current Page (Priority: P1) 🎯 MVP

**Goal**: Browser URL updates when navigating between pages; direct URL access works

**Independent Test**: Navigate to different pages and verify URL changes; copy URL to new tab and verify same page loads

### Implementation for User Story 1

- [x] T009 [US1] Update TopologiesManagement.tsx to use useNavigate() for navigating to topology detail in components/TopologiesManagement.tsx
- [x] T010 [US1] Update TopologyDetailView.tsx to use useParams() to read topology ID from URL in components/topology/TopologyDetailView.tsx
- [x] T011 [US1] Remove selectedTopologyId state from App.tsx and update TopologyDetailView route to pass ID via URL param
- [x] T012 [P] [US1] Update ResourceManagement.tsx to use useNavigate() for navigating to resource detail in components/ResourceManagement.tsx
- [x] T013 [US1] Update ApiResourceDetailView.tsx to use useParams() to read resource ID from URL in components/ApiResourceDetailView.tsx
- [x] T014 [US1] Remove selectedApiResourceId state from App.tsx and update resource detail route to pass ID via URL param
- [x] T015 [P] [US1] Update ReportManagement.tsx to use useNavigate() for navigating to report detail in components/ReportManagement.tsx
- [x] T016 [US1] Update ReportDetailView.tsx to use useParams() to read report ID from URL in components/ReportDetailView.tsx
- [x] T017 [US1] Remove selectedReportId state from App.tsx and update report detail route
- [x] T018 [US1] Update Dashboard.tsx to use useNavigate() instead of callback props in components/Dashboard.tsx
- [x] T019 [US1] Remove currentView state and renderView() switch statement from App.tsx (routes now handle rendering)
- [x] T020 [US1] Verify page refresh preserves current view for all routes

**Checkpoint**: URL updates on navigation, direct URL access works, page refresh preserves view

---

## Phase 4: User Story 2 - Browser History Navigation (Priority: P1)

**Goal**: Browser back/forward buttons work correctly for all navigation

**Independent Test**: Navigate through multiple pages, use browser back/forward buttons, verify correct pages restore

### Implementation for User Story 2

- [x] T021 [US2] Verify all navigation uses navigate() (push) not navigate(path, {replace: true}) in components/TopologiesManagement.tsx
- [x] T022 [US2] Verify all navigation uses navigate() (push) not navigate(path, {replace: true}) in components/ResourceManagement.tsx
- [x] T023 [P] [US2] Ensure sidebar navigation uses <NavLink> for proper history entries in components/Layout.tsx
- [x] T024 [US2] Test browser back from topology detail returns to topologies list
- [x] T025 [US2] Test browser forward returns to topology detail after going back
- [x] T026 [US2] Test navigation from resources → resource detail → topology detail (via tab) → browser back returns to resource detail

**Checkpoint**: Browser back/forward buttons work correctly for all navigation paths

---

## Phase 5: User Story 3 - Context-Aware Back Navigation (Priority: P2)

**Goal**: UI "Back" buttons use browser history, returning to actual previous page

**Independent Test**: Enter topology detail from different entry points (topologies list vs resource detail), click UI Back button, verify returns to correct origin

### Implementation for User Story 3

- [x] T027 [US3] Update TopologyDetailView.tsx onBack prop to use navigate(-1) instead of fixed navigation in components/topology/TopologyDetailView.tsx
- [x] T028 [US3] Update ApiResourceDetailView.tsx onBack prop to use navigate(-1) instead of fixed navigation in components/ApiResourceDetailView.tsx
- [x] T029 [P] [US3] Update ReportDetailView.tsx onBack to use navigate(-1) in components/ReportDetailView.tsx
- [x] T030 [P] [US3] Update PromptManagement.tsx, ModelManagement.tsx, ToolManagement.tsx onBack to use navigate(-1) in components/
- [x] T031 [US3] Handle edge case: direct URL access with no history - fallback to parent list page in detail view components
- [x] T032 [US3] Remove onBack callback props from detail view components (use internal navigate(-1))

**Checkpoint**: UI Back buttons return to actual previous page based on navigation history

---

## Phase 6: User Story 4 - Deep Linking Support (Priority: P3)

**Goal**: Users can share URLs and access specific pages directly

**Independent Test**: Share URL with another user/browser, verify they land on correct page

### Implementation for User Story 4

- [x] T033 [US4] Update ApiResourceDetailView.tsx to support tab query parameter (?tab=topologies) in components/ApiResourceDetailView.tsx
- [x] T034 [US4] Add useSearchParams() to ApiResourceDetailView.tsx to read and set active tab from URL
- [x] T035 [US4] Verify topology detail loads correctly from direct URL /topologies/123
- [x] T036 [US4] Verify resource detail loads correctly from direct URL /resources/42
- [x] T037 [US4] Verify resource detail with tab loads correctly from direct URL /resources/42?tab=topologies
- [x] T038 [US4] Handle invalid ID in URL (non-numeric) - show appropriate error in detail views

**Checkpoint**: Deep linking fully functional, URLs can be shared and bookmarked

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and edge case handling

- [x] T039 [P] Remove unused navigation callback props from App.tsx (onNavigateToDiagnosis, onEnter, onViewDetail, etc.)
- [x] T040 [P] Remove unused state variables from App.tsx (selectedTopologyId, selectedResourceId, etc.)
- [x] T041 Clean up any remaining setCurrentView calls in components
- [x] T042 [P] Add 404 handling: ensure NotFound component renders for unmatched routes
- [x] T043 Verify all routes work after production build (vite build && vite preview)
- [x] T044 Update any existing tests that rely on old navigation patterns

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 - can run in parallel
  - US3 depends on US1/US2 being functional (needs navigation to work)
  - US4 depends on US1 (needs basic routing to work)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - Can run parallel with US1
- **User Story 3 (P2)**: Depends on US1/US2 - Back navigation needs working routes
- **User Story 4 (P3)**: Depends on US1 - Deep linking needs working routes

### Within Each User Story

- Update list/management components before detail components
- Remove old state/props after new routing is verified working
- Test each route before moving to next

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T002 Create route constants || T003 Create NotFound component
```

**Phase 3 (US1)**:
```
T009 TopologiesManagement || T012 ResourceManagement || T015 ReportManagement
```

**Phase 5 (US3)**:
```
T029 ReportDetailView onBack || T030 Agent sub-pages onBack
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008)
3. Complete Phase 3: User Story 1 (T009-T020)
4. Complete Phase 4: User Story 2 (T021-T026)
5. **STOP and VALIDATE**: URLs work, browser back/forward works
6. Deploy if ready - basic routing is functional

### Incremental Delivery

1. Complete Setup + Foundational → Router infrastructure ready
2. Add User Story 1 → Test independently → URLs reflect current page ✓
3. Add User Story 2 → Test independently → Browser history works ✓
4. Add User Story 3 → Test independently → Context-aware back ✓
5. Add User Story 4 → Test independently → Deep linking works ✓
6. Polish phase → Clean up, verify build

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each phase or logical group
- Key insight: US1 and US2 are both P1 and can be developed together as they're tightly coupled
- The old state-based navigation (currentView, selectedTopologyId, etc.) should be removed AFTER new routing is verified working
