# Tasks: Model Management API Integration

**Input**: Design documents from `/specs/008-model-api-integration/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/model-api.md, research.md, quickstart.md

**Tests**: Tests are NOT explicitly requested. Test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend SPA**: `services/`, `components/` at repository root
- Per plan.md structure decision

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add Model types and API service layer

- [x] T001 [P] Add Model TypeScript types (ModelDTO, ModelListRequest, ModelListResponse, ModelCreateRequest, ModelGetRequest, ModelUpdateRequest, ModelDeleteRequest) to services/api/types.ts
- [x] T002 [P] Create Model API service with CRUD functions (listModels, createModel, getModel, updateModel, deleteModel) in services/api/models.ts
- [x] T003 Export models API from services/api/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create React hooks that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create useModels hook with pagination, loading, error states, refresh, and is_active filter in services/hooks/useModels.ts
- [x] T005 Create useModelMutations hook with createModel, updateModel, deleteModel, loading, error in services/hooks/useModelMutations.ts
- [x] T006 Export new hooks from services/hooks/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Model List (Priority: P1) 🎯 MVP

**Goal**: Display models from backend API with pagination and card/list view

**Independent Test**: Load Model Management page, verify models display from API with correct fields and pagination

### Implementation for User Story 1

- [x] T007 [US1] Update ModelManagement.tsx: Import useModels hook, replace local models state with hook data
- [x] T008 [US1] Update ModelManagement.tsx: Update model card to display backend fields (name, model_id, description, is_active, max_tokens, temperature, top_p, region)
- [x] T009 [US1] Update ModelManagement.tsx: Update list view table to display backend fields
- [x] T010 [US1] Update ModelManagement.tsx: Connect pagination to useModels hook (page, totalPages)
- [x] T011 [US1] Update ModelManagement.tsx: Add loading state display during API fetch
- [x] T012 [US1] Update ModelManagement.tsx: Add error state display with retry button
- [x] T013 [US1] Update ModelManagement.tsx: Add empty state when no models exist
- [x] T014 [US1] Update ModelManagement.tsx: Replace search filter with is_active toggle filter

**Checkpoint**: Model list displays from API with pagination, loading/error states - MVP complete

---

## Phase 4: User Story 2 - Create New Model (Priority: P1)

**Goal**: Allow creating new models via API

**Independent Test**: Click "New Model", fill form, submit, verify model appears in list

### Implementation for User Story 2

- [x] T015 [US2] Update ModelFormModal: Redesign form fields to match backend schema (name, model_id required; description, is_active, max_tokens, temperature, top_p, region optional)
- [x] T016 [US2] Update ModelFormModal: Add form validation for required fields (name, model_id non-empty)
- [x] T017 [US2] Update ModelFormModal: Add validation for temperature (0.0-2.0) and top_p (0.0-1.0) ranges
- [x] T018 [US2] Update ModelFormModal: Connect form submit to createModel from useModelMutations
- [x] T019 [US2] Update ModelFormModal: Display API error messages in modal
- [x] T020 [US2] Update ModelFormModal: Add loading state during API call
- [x] T021 [US2] Update ModelManagement.tsx: Call refresh() after successful create

**Checkpoint**: Create model flow works end-to-end with validation

---

## Phase 5: User Story 3 - Edit Existing Model (Priority: P2)

**Goal**: Allow editing model configurations via API

**Independent Test**: Click Edit on model, modify fields, save, verify changes persist

### Implementation for User Story 3

- [x] T022 [US3] Update ModelFormModal: Detect edit mode (model prop not null), pre-populate form with existing data
- [x] T023 [US3] Update ModelFormModal: Connect save to updateModel from useModelMutations
- [x] T024 [US3] Update ModelManagement.tsx: Pass selected model to modal for editing
- [x] T025 [US3] Update ModelManagement.tsx: Call refresh() after successful update

**Checkpoint**: Edit model flow works with form pre-population and API persistence

---

## Phase 6: User Story 4 - Delete Model (Priority: P2)

**Goal**: Allow deleting models via API with confirmation

**Independent Test**: Click Delete on model, confirm, verify model removed from list

### Implementation for User Story 4

- [x] T026 [US4] Create DeleteConfirmModal component in components/ModelManagement.tsx (reuse pattern from prompt templates)
- [x] T027 [US4] Update ModelManagement.tsx: Add deleteConfirmId state for tracking model to delete
- [x] T028 [US4] Update ModelManagement.tsx: Connect delete confirmation to deleteModel from useModelMutations
- [x] T029 [US4] Update ModelManagement.tsx: Handle delete error display
- [x] T030 [US4] Update ModelManagement.tsx: Call refresh() after successful delete, handle empty page navigation

**Checkpoint**: Delete model flow works with confirmation modal

---

## Phase 7: User Story 5 - Toggle Model Active Status (Priority: P3)

**Goal**: Quick toggle of is_active status without opening edit form

**Independent Test**: Click status toggle, verify API called and UI updates

### Implementation for User Story 5

- [x] T031 [US5] Update model card: Add clickable status toggle indicator
- [x] T032 [US5] Update ModelManagement.tsx: Add handleToggleStatus function using updateModel mutation
- [x] T033 [US5] Update list view: Add status toggle in table row
- [x] T034 [US5] Update ModelManagement.tsx: Show loading indicator during toggle operation

**Checkpoint**: Status toggle works in both card and list views

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, consistency, edge cases

- [x] T035 [P] Remove deprecated AIModel type usage from types.ts (if still referenced)
- [x] T036 [P] Remove mock model data and props drilling from App.tsx or parent component
- [x] T037 Update ModelManagement props interface: Remove models, onAdd, onUpdate, onDelete props (now uses hooks internally)
- [ ] T038 Verify all edge cases: empty list, timeout (10s), validation errors, pagination after delete
- [ ] T039 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 can run in parallel (independent)
  - US3 can run after US2 (shares form component)
  - US4 can run in parallel with US3
  - US5 can run after US1 (needs card/list rendering complete)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies
- **User Story 2 (P1)**: Can start after Foundational - No dependencies
- **User Story 3 (P2)**: Depends on US2 (shares ModelFormModal)
- **User Story 4 (P2)**: Can start after Foundational - No dependencies
- **User Story 5 (P3)**: Depends on US1 (needs card/list view complete)

### Within Each User Story

- Hook integration before UI updates
- Core functionality before error handling
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002 can run in parallel (different files)
- T035, T036 can run in parallel (different files)
- US1 and US2 can be worked on simultaneously after Foundational
- US3 and US4 can be worked on simultaneously

---

## Parallel Example: Setup Phase

```bash
# Launch all setup tasks together:
Task: "Add Model TypeScript types to services/api/types.ts"
Task: "Create Model API service in services/api/models.ts"
```

---

## Parallel Example: User Stories 1 & 2

```bash
# After Foundational phase, these can run in parallel:
# Developer A: User Story 1 (View List)
Task: "Update ModelManagement.tsx: Import useModels hook..."

# Developer B: User Story 2 (Create Model)
Task: "Update ModelFormModal: Redesign form fields..."
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (types + API service)
2. Complete Phase 2: Foundational (hooks)
3. Complete Phase 3: User Story 1 (View List)
4. Complete Phase 4: User Story 2 (Create Model)
5. **STOP and VALIDATE**: Test view + create flow end-to-end
6. Deploy/demo basic CRUD

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (View) → Test → Deploy (read-only MVP)
3. Add US2 (Create) → Test → Deploy (create capability)
4. Add US3 (Edit) → Test → Deploy (full edit)
5. Add US4 (Delete) → Test → Deploy (full CRUD)
6. Add US5 (Toggle) → Test → Deploy (convenience feature)
7. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
