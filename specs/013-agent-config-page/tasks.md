# Tasks: Agent Configuration Page

**Input**: Design documents from `/specs/013-agent-config-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend SPA**: Components in `components/`, services in `services/`
- Routes in `services/routes.ts`, types in `services/api/types.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type updates and route configuration for the new configuration page

- [ ] T001 Add `toolIds` field to `UpdateAgentRequest` interface in services/api/types.ts
- [ ] T002 Add `toolIds` field to `AgentDTO` interface in services/api/types.ts
- [ ] T003 Update `AgentWithApiFields` interface to include `toolIds: number[]` in services/hooks/useAgents.ts
- [ ] T004 Update `toFrontendAgent` function to map `toolIds` from API response in services/hooks/useAgents.ts
- [ ] T005 Add `AGENT_CONFIG: '/agents/:id/config'` route constant in services/routes.ts
- [ ] T006 Add `agentConfig` path helper function in services/routes.ts
- [ ] T007 Create agent-config directory structure at components/agent-config/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core components that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Create ConfigStepper component with three stages (Basic Info, Prompt Template, Tools) in components/agent-config/ConfigStepper.tsx
- [ ] T009 Implement stepper state management (current stage, completed stages) in ConfigStepper.tsx
- [ ] T010 Add clickable stage navigation with visual feedback in ConfigStepper.tsx
- [ ] T011 Create AgentConfigPage shell component with stepper and stage container in components/AgentConfigPage.tsx
- [ ] T012 Add route parameter parsing (`useParams` for agent ID) in AgentConfigPage.tsx
- [ ] T013 Implement agent data loading using `useAgents` hook in AgentConfigPage.tsx
- [ ] T014 Add loading and error states to AgentConfigPage.tsx
- [ ] T015 Register AgentConfigPage route in App.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Configure Agent Basic Information (Priority: P1) 🎯 MVP

**Goal**: Users can configure agent basic info (name, specialty, model settings) on a dedicated page with a Save button

**Independent Test**: Navigate to `/agents/1/config`, edit agent name, click Save, verify changes persist on page reload

### Implementation for User Story 1

- [ ] T016 [US1] Create BasicInfoStage component structure in components/agent-config/BasicInfoStage.tsx
- [ ] T017 [US1] Implement form fields for name, specialty in BasicInfoStage.tsx
- [ ] T018 [US1] Implement form fields for model, temperature, topP in BasicInfoStage.tsx
- [ ] T019 [US1] Implement form fields for maxTokens, maxRuntime in BasicInfoStage.tsx
- [ ] T020 [US1] Add form validation (name required, temperature 0-2, topP 0-1) in BasicInfoStage.tsx
- [ ] T021 [US1] Implement dirty state tracking (compare form data with initial values) in BasicInfoStage.tsx
- [ ] T022 [US1] Add Save button with loading state and API call using handleUpdate in BasicInfoStage.tsx
- [ ] T023 [US1] Display validation errors inline with form fields in BasicInfoStage.tsx
- [ ] T024 [US1] Show success/error toast after save operation in BasicInfoStage.tsx
- [ ] T025 [US1] Update AgentManagement.tsx to link to config page instead of opening modal
- [ ] T026 [US1] Mark Basic Info stage as completed in stepper after successful save

**Checkpoint**: User Story 1 complete - Basic Info configuration is fully functional

---

## Phase 4: User Story 2 - Select and Preview Prompt Template (Priority: P1)

**Goal**: Users can browse prompt templates, preview full content in a side panel, and select one for the agent

**Independent Test**: Navigate to Prompt Template stage, click a template to preview, click Select, Save, verify template is associated

### Implementation for User Story 2

- [ ] T027 [US2] Create PromptTemplateStage component structure in components/agent-config/PromptTemplateStage.tsx
- [ ] T028 [US2] Implement template list using usePromptTemplates hook in PromptTemplateStage.tsx
- [ ] T029 [US2] Add search/filter input for templates in PromptTemplateStage.tsx
- [ ] T030 [US2] Display template cards with name, description, highlight if selected in PromptTemplateStage.tsx
- [ ] T031 [P] [US2] Create TemplatePreviewPanel component for side panel display in components/agent-config/TemplatePreviewPanel.tsx
- [ ] T032 [US2] Implement template preview loading using usePromptTemplate hook in TemplatePreviewPanel.tsx
- [ ] T033 [US2] Display full template content with markdown rendering in TemplatePreviewPanel.tsx
- [ ] T034 [US2] Add collapsible/expandable behavior to preview panel in PromptTemplateStage.tsx
- [ ] T035 [US2] Implement "Select this template" button in preview panel
- [ ] T036 [US2] Track selected template ID and dirty state in PromptTemplateStage.tsx
- [ ] T037 [US2] Add Save button to persist promptTemplateId via handleUpdate in PromptTemplateStage.tsx
- [ ] T038 [US2] Show empty state when no templates available in PromptTemplateStage.tsx
- [ ] T039 [US2] Mark Prompt Template stage as completed in stepper after successful save

**Checkpoint**: User Story 2 complete - Prompt Template selection with preview is fully functional

---

## Phase 5: User Story 3 - Configure Agent Tools (Priority: P2)

**Goal**: Users can browse tools grouped by category and select/deselect tools for the agent

**Independent Test**: Navigate to Tools stage, expand a category, check some tools, Save, verify toolIds persist

### Implementation for User Story 3

- [ ] T040 [US3] Create ToolsStage component structure in components/agent-config/ToolsStage.tsx
- [ ] T041 [US3] Fetch categories using useCategories hook in ToolsStage.tsx
- [ ] T042 [US3] Implement collapsible category accordion UI in ToolsStage.tsx
- [ ] T043 [US3] Fetch tools per category using useTools with categoryId filter in ToolsStage.tsx
- [ ] T044 [US3] Display tool items with checkbox, name, description in ToolsStage.tsx
- [ ] T045 [US3] Initialize selectedToolIds Set from agent.toolIds in ToolsStage.tsx
- [ ] T046 [US3] Implement tool toggle (add/remove from Set) with visual feedback in ToolsStage.tsx
- [ ] T047 [US3] Track dirty state by comparing selectedToolIds with original in ToolsStage.tsx
- [ ] T048 [US3] Add Save button to persist toolIds array via handleUpdate in ToolsStage.tsx
- [ ] T049 [US3] Show empty state when no categories/tools available in ToolsStage.tsx
- [ ] T050 [US3] Mark Tools stage as completed in stepper after successful save

**Checkpoint**: User Story 3 complete - Tool selection with categories is fully functional

---

## Phase 6: User Story 4 - Navigate Three-Stage Configuration (Priority: P2)

**Goal**: Users can freely navigate between stages, with unsaved changes prompts and completion indicators

**Independent Test**: Make changes without saving, click to another stage, verify confirmation dialog appears

### Implementation for User Story 4

- [ ] T051 [US4] Implement stage switching handler in AgentConfigPage.tsx
- [ ] T052 [US4] Pass isDirty state from each stage to parent AgentConfigPage
- [ ] T053 [P] [US4] Create UnsavedChangesDialog component in components/agent-config/UnsavedChangesDialog.tsx
- [ ] T054 [US4] Show dialog when switching stages with unsaved changes
- [ ] T055 [US4] Implement Save & Continue, Discard, and Cancel actions in dialog
- [ ] T056 [US4] Add beforeunload event listener for browser navigation/refresh in AgentConfigPage.tsx
- [ ] T057 [US4] Implement useBlocker from React Router for in-app navigation blocking
- [ ] T058 [US4] Update stepper to show checkmark/completion indicator for saved stages
- [ ] T059 [US4] Add visual distinction between pending, active, and completed stages in ConfigStepper.tsx

**Checkpoint**: User Story 4 complete - Full navigation flow with dirty state handling

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, cleanup, and final integration

- [ ] T060 Handle HTTP 423 (Agent working) error - show read-only mode or warning
- [ ] T061 Handle network errors during save - show retry option without data loss
- [ ] T062 Remove or deprecate AgentConfigModal.tsx (no longer needed)
- [ ] T063 Update exports in services/hooks/index.ts if any new types added
- [ ] T064 Add console logging for debugging (similar to existing hooks pattern)
- [ ] T065 Run npm run build to verify no TypeScript errors
- [ ] T066 Manual E2E validation following quickstart.md scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 (both P1) can run in parallel after Foundational
  - US3 and US4 (both P2) can run in parallel after Foundational
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Phase 2 - Requires stages from US1-3 to exist but not complete

### Within Each User Story

- Component structure before form fields
- Form fields before validation
- Validation before save functionality
- Save functionality before completion indicator

### Parallel Opportunities

- **Setup Phase**: T001, T002 can run in parallel (different interfaces)
- **Setup Phase**: T003, T004 can run in parallel with T005, T006 (different files)
- **Foundational Phase**: ConfigStepper (T008-T010) can run in parallel with AgentConfigPage shell (T011-T014)
- **User Story 2**: T031 (TemplatePreviewPanel) can run in parallel with other US2 tasks
- **User Story 4**: T053 (UnsavedChangesDialog) can run in parallel with other US4 tasks

---

## Parallel Example: Foundational Phase

```bash
# Launch ConfigStepper and AgentConfigPage in parallel:
Task: "Create ConfigStepper component in components/agent-config/ConfigStepper.tsx"
Task: "Create AgentConfigPage shell component in components/AgentConfigPage.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch template list and preview panel in parallel:
Task: "Implement template list using usePromptTemplates hook"
Task: "Create TemplatePreviewPanel component for side panel display"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T015)
3. Complete Phase 3: User Story 1 (T016-T026)
4. **STOP and VALIDATE**: Test basic info configuration independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Complete Polish phase → Final release

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 (User Story 1)**

This delivers:
- Dedicated configuration page (replacing modal)
- Three-stage stepper navigation (visual only for US2/US3)
- Full basic info editing with save functionality
- All core infrastructure in place for remaining stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Existing hooks (useAgents, usePromptTemplates, useTools, useCategories) are reused - no new API integration needed
