# Tasks: Tool Category Management

**Input**: Design documents from `/specs/010-tool-category-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend-only**: `components/`, `services/`, `types.ts` at repository root
- Paths follow existing project structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: TypeScript types and API service layer

- [x] T001 Add category request/response types in types.ts
- [x] T002 [P] Create categories API service in services/api/categories.ts
- [x] T003 [P] Create useCategories hook in services/hooks/useCategories.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core category management component structure

**⚠️ CRITICAL**: User story phases depend on this infrastructure

- [x] T004 Create tool/ subfolder for category components in components/tool/
- [x] T005 Create CategoryManagement base component in components/tool/CategoryManagement.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Tool Categories (Priority: P1) 🎯 MVP

**Goal**: Display flat list of all tool categories with pagination

**Independent Test**: Navigate to Tools page → Click "类目" tab → See category list with name and description

### Implementation for User Story 1

- [x] T006 [US1] Implement category list view with card/list modes in components/tool/CategoryManagement.tsx
- [x] T007 [US1] Add empty state display ("暂无类目" with create button) in components/tool/CategoryManagement.tsx
- [x] T008 [US1] Add pagination controls for category list in components/tool/CategoryManagement.tsx
- [x] T009 [US1] Add tab navigation ("工具" / "类目") in components/ToolManagement.tsx

**Checkpoint**: User can view categories list with pagination - Story 1 complete

---

## Phase 4: User Story 2 - Create New Category (Priority: P1)

**Goal**: Allow users to create new categories with name validation

**Independent Test**: Click "新建类目" → Fill name → Submit → New category appears in list

### Implementation for User Story 2

- [x] T010 [US2] Create CategoryFormModal component in components/tool/CategoryManagement.tsx (inline)
- [x] T011 [US2] Add name field (required) with validation in components/tool/CategoryManagement.tsx
- [x] T012 [US2] Add description field (optional) in components/tool/CategoryManagement.tsx
- [x] T013 [US2] Implement form submission with createCategory API in components/tool/CategoryManagement.tsx
- [x] T014 [US2] Handle duplicate name error from API in components/tool/CategoryManagement.tsx
- [x] T015 [US2] Add "新建类目" button and integrate modal in components/tool/CategoryManagement.tsx

**Checkpoint**: User can create categories with validation - Story 2 complete

---

## Phase 5: User Story 3 - Edit Existing Category (Priority: P2)

**Goal**: Allow users to edit category name and description

**Independent Test**: Click edit on category → Modify fields → Save → Changes persist

### Implementation for User Story 3

- [x] T016 [US3] Add edit mode to CategoryFormModal (pre-fill values) in components/tool/CategoryManagement.tsx
- [x] T017 [US3] Implement form submission with updateCategory API in components/tool/CategoryManagement.tsx
- [x] T018 [US3] Add edit button to category list items in components/tool/CategoryManagement.tsx

**Checkpoint**: User can edit existing categories - Story 3 complete

---

## Phase 6: User Story 4 - Delete Category (Priority: P2)

**Goal**: Allow users to delete categories with confirmation and error handling

**Independent Test**: Click delete → Confirm → Category removed (or error if has tools)

### Implementation for User Story 4

- [x] T019 [US4] Add delete button to category list items in components/tool/CategoryManagement.tsx
- [x] T020 [US4] Integrate ConfirmDialog for delete confirmation in components/tool/CategoryManagement.tsx
- [x] T021 [US4] Implement deleteCategory API call with error handling in components/tool/CategoryManagement.tsx
- [x] T022 [US4] Handle "category has tools" deletion error with user-friendly message in components/tool/CategoryManagement.tsx

**Checkpoint**: User can delete categories with proper error handling - Story 4 complete

---

## Phase 7: User Story 5 - Assign Category to Tool (Priority: P3)

**Goal**: Enable category selection in tool form and display category on tool cards

**Independent Test**: Edit tool → Select category → Save → Category shown on tool card

### Implementation for User Story 5

- [x] T023 [US5] Add category dropdown to ToolFormModal in components/ToolManagement.tsx
- [x] T024 [US5] Fetch categories list for dropdown options in components/ToolManagement.tsx
- [x] T025 [US5] Display category name/badge on tool cards in components/ToolManagement.tsx
- [x] T026 [US5] Display category column in tool list view in components/ToolManagement.tsx

**Checkpoint**: Users can assign and view categories on tools - Story 5 complete

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Loading states, error handling, and UI polish

- [x] T027 [P] Add loading spinners for all async operations in components/tool/CategoryManagement.tsx
- [x] T028 [P] Add error alert display for API failures in components/tool/CategoryManagement.tsx
- [x] T029 Verify build passes with `npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - No dependencies on other stories
- **User Story 2 (P1)**: Foundation only - No dependencies on other stories
- **User Story 3 (P2)**: Depends on US2 (reuses CategoryFormModal)
- **User Story 4 (P2)**: Foundation only - No dependencies on other stories
- **User Story 5 (P3)**: Foundation only, but categories should exist (US2) for meaningful testing

### Within Each User Story

- Models/Types before services
- Services before UI components
- Core implementation before integration

### Parallel Opportunities

**Phase 1 - All can run in parallel:**
- T002 (categories.ts) and T003 (useCategories.ts)

**After Foundational:**
- US1 and US2 can be developed in parallel
- US3 depends on US2 (modal reuse)
- US4 can be developed in parallel with US1/US2
- US5 can be developed after categories exist

**Phase 8 - All [P] tasks can run in parallel**

---

## Parallel Example: Phase 1 Setup

```bash
# Launch in parallel:
Task: "Create categories API service in services/api/categories.ts"
Task: "Create useCategories hook in services/hooks/useCategories.ts"
```

## Parallel Example: User Stories

```bash
# After Foundation, launch US1 and US2 in parallel:
Task: "[US1] Implement category list view in components/tool/CategoryManagement.tsx"
Task: "[US2] Create CategoryFormModal component in components/tool/CategoryFormModal.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (types + API + hook)
2. Complete Phase 2: Foundational (base component)
3. Complete Phase 3: User Story 1 (view categories)
4. Complete Phase 4: User Story 2 (create categories)
5. **STOP and VALIDATE**: Test viewing and creating categories
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 → View & Create categories (MVP!)
3. Add US3 + US4 → Edit & Delete categories
4. Add US5 → Category-Tool integration
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All API calls use POST method via apiPostRaw pattern
