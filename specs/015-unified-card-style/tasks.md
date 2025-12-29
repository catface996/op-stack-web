# Tasks: Unified Card Style

**Input**: Design documents from `/specs/015-unified-card-style/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: No automated tests requested - manual visual verification per page.

**Organization**: Tasks are grouped by user story. US1 covers all page updates (the core feature). US2 is optional future work for creating a shared component.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `components/` at repository root
- **UI Components**: `components/ui/`

---

## Phase 1: Setup

**Purpose**: Verify current state and prepare for updates

- [x] T001 Run `npm run build` to verify project builds cleanly before changes
- [x] T002 Review reference implementation in `components/TopologiesManagement.tsx` lines 262-280

---

## Phase 2: Foundational

**Purpose**: No foundational changes needed - this is a UI-only refactoring with no new dependencies or infrastructure.

**Checkpoint**: Proceed directly to User Story 1

---

## Phase 3: User Story 1 - Consistent Card Layout Across All Management Pages (Priority: P1) 🎯 MVP

**Goal**: Update all management pages so that the icon and name appear on the same horizontal line with vertical centering.

**Independent Test**: Navigate to each management page in card mode and verify:
1. Icon appears on the left
2. Name appears directly to the right of the icon on the same line
3. Icon and name are vertically centered
4. Long names truncate with ellipsis
5. Status badges remain on the right side of the card header

### Implementation for User Story 1

All tasks can run in parallel since they modify different files:

- [x] T003 [P] [US1] Update card header layout in `components/ResourceManagement.tsx` - wrap icon and name in `flex items-center gap-3` container, add `shrink-0` to icon, add `min-w-0` and `truncate` to name (ALREADY DONE)
- [x] T004 [P] [US1] Update card header layout in `components/AgentManagement.tsx` - wrap icon and name in `flex items-center gap-3` container, add `shrink-0` to icon, add `min-w-0` and `truncate` to name
- [x] T005 [P] [US1] Update card header layout in `components/ReportManagement.tsx` - wrap icon and name in `flex items-center gap-3` container, add `shrink-0` to icon, add `min-w-0` and `truncate` to name
- [x] T006 [P] [US1] Update card header layout in `components/ReportTemplateManagement.tsx` - wrap icon and name in `flex items-center gap-3` container, add `shrink-0` to icon, add `min-w-0` and `truncate` to name
- [x] T007 [P] [US1] Update card header layout in `components/ToolManagement.tsx` - wrap icon and name in `flex items-center gap-3` container, add `shrink-0` to icon, add `min-w-0` and `truncate` to name
- [x] T008 [P] [US1] Update card header layout in `components/tool/CategoryManagement.tsx` - wrap icon and name in `flex items-center gap-3` container, add `shrink-0` to icon, add `min-w-0` and `truncate` to name (ALREADY DONE)
- [x] T009 [P] [US1] Verify and align card header layout in `components/TopologiesManagement.tsx` - ensure consistent pattern with other pages (already partially updated)
- [x] T010 [P] [US1] Update card header layout in `components/PromptManagement.tsx` - wrap icon and name in `flex items-center gap-3` container, add `shrink-0` to icon, add `min-w-0` and `truncate` to name
- [x] T011 [P] [US1] Update card header layout in `components/ModelManagement.tsx` - wrap icon and name in `flex items-center gap-3` container, add `shrink-0` to icon, add `min-w-0` and `truncate` to name

### Verification

- [x] T012 [US1] Run `npm run build` to verify all changes compile without errors
- [ ] T013 [US1] Visual verification: Navigate to each management page and confirm icon-name layout is horizontal with vertical centering

**Checkpoint**: User Story 1 complete - all 9 management pages display unified card header layout

---

## Phase 4: User Story 2 - Maintainable Global Card Styles (Priority: P2) - OPTIONAL

**Goal**: Extract the unified pattern into a reusable component for future maintainability.

**Independent Test**: Verify that a single change to the shared component propagates to all pages using it.

**Note**: This phase is OPTIONAL and can be deferred. The direct inline approach from US1 achieves the user-visible goal. This phase adds developer experience value.

### Implementation for User Story 2 (Optional)

- [ ] T014 [US2] Create shared `CardHeader` component in `components/ui/CardHeader.tsx` with props for icon, name, subtitle, and badge slot
- [ ] T015 [US2] Refactor `components/ResourceManagement.tsx` to use `CardHeader` component
- [ ] T016 [US2] Refactor remaining management pages to use `CardHeader` component (AgentManagement, ReportManagement, ReportTemplateManagement, ToolManagement, CategoryManagement, TopologiesManagement, PromptManagement, ModelManagement)

**Checkpoint**: User Story 2 complete - shared component in use across all pages

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] T017 Run final `npm run build` to ensure no regressions
- [ ] T018 Test responsive behavior: verify card layout on mobile, tablet, and desktop viewports
- [ ] T019 Test edge cases: create/find items with very long names to verify truncation behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: N/A - no foundational work needed
- **User Story 1 (Phase 3)**: Depends on Setup completion
- **User Story 2 (Phase 4)**: OPTIONAL - depends on User Story 1 completion
- **Polish (Phase 5)**: Depends on User Story 1 completion (or User Story 2 if implemented)

### User Story Dependencies

- **User Story 1 (P1)**: Can start immediately after Setup - this IS the MVP
- **User Story 2 (P2)**: Optional enhancement - only proceed if US1 is complete and shared component is desired

### Within User Story 1

All page update tasks (T003-T011) can run in **parallel** since they modify different files:

```bash
# Launch all page updates in parallel:
T003: ResourceManagement.tsx
T004: AgentManagement.tsx
T005: ReportManagement.tsx
T006: ReportTemplateManagement.tsx
T007: ToolManagement.tsx
T008: tool/CategoryManagement.tsx
T009: TopologiesManagement.tsx
T010: PromptManagement.tsx
T011: ModelManagement.tsx
```

### Parallel Opportunities

- T003-T011: All 9 page updates can run in parallel (different files)
- T012-T013: Must run after all page updates complete
- T017-T019: Must run after US1 (and optionally US2) complete

---

## Parallel Example: User Story 1

```bash
# Maximum parallelism - launch all 9 page updates simultaneously:
Task: "Update card header layout in components/ResourceManagement.tsx"
Task: "Update card header layout in components/AgentManagement.tsx"
Task: "Update card header layout in components/ReportManagement.tsx"
Task: "Update card header layout in components/ReportTemplateManagement.tsx"
Task: "Update card header layout in components/ToolManagement.tsx"
Task: "Update card header layout in components/tool/CategoryManagement.tsx"
Task: "Verify and align card header layout in components/TopologiesManagement.tsx"
Task: "Update card header layout in components/PromptManagement.tsx"
Task: "Update card header layout in components/ModelManagement.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - RECOMMENDED

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 3: User Story 1 (T003-T013)
3. **STOP and VALIDATE**: Test all 9 pages visually
4. Complete Phase 5: Polish (T017-T019)
5. Done - skip User Story 2 unless explicitly requested

### Full Implementation (US1 + US2)

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1
3. Complete Phase 4: User Story 2 (shared component)
4. Complete Phase 5: Polish

---

## Summary

| Phase | Tasks | Parallelizable |
|-------|-------|----------------|
| Setup | 2 | No |
| User Story 1 | 11 | T003-T011 (9 tasks) |
| User Story 2 (Optional) | 3 | No |
| Polish | 3 | T017-T019 |
| **Total** | **19** | **9 highly parallel** |

---

## Notes

- All T003-T011 tasks follow the same pattern - update card header from vertical to horizontal icon+name layout
- Reference the target pattern in `plan.md` section "Target Card Header Pattern"
- Preserve existing icon styles, status badges, and hover effects
- Only change the structural layout (flexbox) - do not modify colors or other styling
- Commit after each task or logical group
