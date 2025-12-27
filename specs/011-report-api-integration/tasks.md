# Tasks: Report and Report Template API Integration

**Input**: Design documents from `/specs/011-report-api-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No automated tests required (manual testing per project pattern)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization - verify branch and project structure

- [x] T001 Verify feature branch `011-report-api-integration` exists and is checked out
- [x] T002 Verify backend API is accessible at `http://localhost:8080`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: API types and client functions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### API Types

- [x] T003 [P] Add ReportDTO, ReportType, ReportStatus types to `services/api/types.ts`
- [x] T004 [P] Add ReportTemplateDTO, ReportTemplateCategory types to `services/api/types.ts`
- [x] T005 [P] Add Report request types (ListReportsRequest, GetReportRequest, CreateReportRequest, DeleteReportRequest) to `services/api/types.ts`
- [x] T006 [P] Add Report response types (ReportListResponse, ReportDetailResponse) to `services/api/types.ts`
- [x] T007 [P] Add ReportTemplate request types (ListReportTemplatesRequest, GetReportTemplateRequest, CreateReportTemplateRequest, UpdateReportTemplateRequest, DeleteReportTemplateRequest) to `services/api/types.ts`
- [x] T008 [P] Add ReportTemplate response types (ReportTemplateListResponse, ReportTemplateDetailResponse) to `services/api/types.ts`

### API Client Functions

- [x] T009 Create `services/api/reports.ts` with listReports, getReport, createReport, deleteReport functions using apiPostRaw
- [x] T010 Create `services/api/report-templates.ts` with listReportTemplates, getReportTemplate, createReportTemplate, updateReportTemplate, deleteReportTemplate functions using apiPostRaw

### Type Migration

- [x] T011 Update `types.ts` Report interface: change id from string to number, createdAt from number to string
- [x] T012 Update `types.ts` ReportTemplate interface: change id from string to number, add version field, change updatedAt from number to string, add createdAt field

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Report List (Priority: P1) 🎯 MVP

**Goal**: Users can view paginated report list from backend API with filtering and search

**Independent Test**: Navigate to Reports page, verify reports load from API, test pagination and filters

### Implementation for User Story 1

- [x] T013 [US1] Create `services/hooks/useReports.ts` hook following useTools.ts pattern with:
  - State: reports[], loading, error, page, totalPages, total
  - Filters: typeFilter, statusFilter, keyword
  - Actions: setPage, setTypeFilter, setStatusFilter, setSearch, refresh
- [x] T014 [US1] Modify `components/ReportManagement.tsx`:
  - Remove INITIAL_REPORTS mock data
  - Import and use useReports() hook
  - Wire up type filter dropdown to setTypeFilter
  - Wire up status filter dropdown to setStatusFilter
  - Wire up search input to setSearch
  - Wire up pagination controls to setPage
- [x] T015 [US1] Add loading state UI to ReportManagement.tsx (spinner or skeleton)
- [x] T016 [US1] Add error state UI to ReportManagement.tsx with retry button
- [x] T017 [US1] Add empty state UI when no reports are returned

**Checkpoint**: User Story 1 complete - users can browse reports from backend

---

## Phase 4: User Story 2 - View Report Details (Priority: P1)

**Goal**: Users can click a report to view full details with rendered Markdown content

**Independent Test**: Click any report in list, verify detail view shows all fields from API

### Implementation for User Story 2

- [x] T018 [US2] Create `services/hooks/useReport.ts` hook for fetching single report by ID
- [x] T019 [US2] Modify `components/ReportDetailView.tsx`:
  - Use useReport() hook when viewing report detail
  - Display all fields: title, author, type, status, summary, content, tags, createdAt
  - Render content as Markdown (verify existing Markdown rendering works with API data)
- [x] T020 [US2] Handle "Report not found" (404) error in detail view

**Checkpoint**: User Stories 1 and 2 complete - core report viewing functionality works

---

## Phase 5: User Story 3 - View Report Template List (Priority: P2)

**Goal**: Users can view paginated template list from backend API with category filter and search

**Independent Test**: Navigate to Templates page, verify templates load from API, test filters

### Implementation for User Story 3

- [x] T021 [US3] Create `src/services/hooks/useReportTemplates.ts` hook following useCategories.ts pattern with:
  - State: templates[], loading, error, page, totalPages, total
  - Filters: categoryFilter, keyword
  - Actions: setPage, setCategoryFilter, setSearch, refresh
- [x] T022 [US3] Modify `src/components/ReportTemplateManagement.tsx`:
  - Remove mock data (INITIAL_TEMPLATES or similar)
  - Import and use useReportTemplates() hook
  - Wire up category filter dropdown to setCategoryFilter
  - Wire up search input to setSearch
  - Wire up pagination controls to setPage
- [x] T023 [US3] Add loading state UI to ReportTemplateManagement.tsx
- [x] T024 [US3] Add error state UI with retry button
- [x] T025 [US3] Add empty state UI when no templates are returned

**Checkpoint**: User Story 3 complete - users can browse templates from backend

---

## Phase 6: User Story 4 - Create New Report Template (Priority: P3)

**Goal**: Users can create new templates via backend API

**Independent Test**: Click "New Template", fill form, submit, verify template appears in list

### Implementation for User Story 4

- [x] T026 [US4] Create `src/services/hooks/useReportTemplateMutations.ts` hook following usePromptTemplateMutations.ts pattern with:
  - createTemplate function
  - updateTemplate function
  - deleteTemplate function
  - Loading states per operation
- [x] T027 [US4] Modify `src/components/ReportTemplateManagement.tsx` create functionality:
  - Use createTemplate from useReportTemplateMutations()
  - Handle 400 (validation error) response
  - Handle 409 (duplicate name) response with user-friendly message
  - Refresh template list on success

**Checkpoint**: User Story 4 complete - users can create templates

---

## Phase 7: User Story 5 - Edit Report Template (Priority: P3)

**Goal**: Users can edit existing templates with optimistic locking

**Independent Test**: Edit template, modify fields, save, verify changes persisted

### Implementation for User Story 5

- [x] T028 [US5] Create `src/services/hooks/useReportTemplate.ts` hook for fetching single template by ID (for edit form)
- [x] T029 [US5] Modify `src/components/ReportTemplateManagement.tsx` edit functionality:
  - Use useReportTemplate() to load template data for editing
  - Use updateTemplate from useReportTemplateMutations()
  - Pass expectedVersion (current version) in update request
  - Handle 409 (version conflict) with user notification and refresh option
  - Handle 404 (template not found) error
  - Refresh template list on success

**Checkpoint**: User Story 5 complete - users can edit templates with conflict detection

---

## Phase 8: User Story 6 - Delete Report Template (Priority: P3)

**Goal**: Users can delete templates with confirmation dialog

**Independent Test**: Click delete on template, confirm, verify template removed from list

### Implementation for User Story 6

- [x] T030 [US6] Modify `src/components/ReportTemplateManagement.tsx` delete functionality:
  - Use deleteTemplate from useReportTemplateMutations()
  - Show confirmation dialog before delete (use existing ConfirmDialog component)
  - Handle 404 (template not found) error gracefully
  - Refresh template list on success

**Checkpoint**: User Story 6 complete - users can delete templates

---

## Phase 9: User Story 7 - Delete Report (Priority: P3)

**Goal**: Users can delete reports with confirmation dialog

**Independent Test**: Click delete on report, confirm, verify report removed from list

### Implementation for User Story 7

- [x] T031 [US7] Create deleteReport mutation in useReports.ts or separate useReportMutations.ts hook
- [x] T032 [US7] Modify `src/components/ReportManagement.tsx` delete functionality:
  - Add delete button to report list items (if not already present)
  - Show confirmation dialog before delete
  - Handle 404 (report not found) error gracefully
  - Refresh report list on success

**Checkpoint**: User Story 7 complete - users can delete reports

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and verification

- [x] T033 [P] Verify all date fields display correctly (ISO 8601 string to localized format)
- [x] T034 [P] Verify all ID fields work correctly as numbers (not strings)
- [x] T035 [P] Test pagination edge cases: first page, last page, single page
- [x] T036 Run manual testing per quickstart.md testing checklist
- [x] T037 Code cleanup: remove any unused mock data constants

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - US1 (P1) and US2 (P1) can proceed in parallel after Foundational
  - US3 (P2) can start after Foundational (independent of US1/US2)
  - US4-US6 (P3) depend on US3 (template list must work first)
  - US7 (P3) depends on US1 (report list must work first)
- **Polish (Phase 10)**: Depends on all user stories being complete

### Parallel Opportunities

- T003-T008: All API types can be written in parallel
- T009-T010: API client files can be written in parallel
- T011-T012: Type migrations can be done in parallel
- US1 and US3: Report list and Template list can be implemented in parallel
- T033-T035: Polish verification tasks can run in parallel

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (View Report List)
4. Complete Phase 4: User Story 2 (View Report Details)
5. **STOP and VALIDATE**: Test report viewing independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 + US2 → Test → Deploy (Reports MVP!)
3. Add US3 → Test → Deploy (Templates viewing)
4. Add US4-US6 → Test → Deploy (Templates CRUD)
5. Add US7 → Test → Deploy (Reports delete)
6. Polish → Final release

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Follow existing hook patterns: useTools.ts, useCategories.ts, usePromptTemplateMutations.ts
- Use apiPostRaw for full response wrapper access
- Check response.code === 0 || response.success === true for success
