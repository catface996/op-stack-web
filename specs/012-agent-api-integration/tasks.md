# Tasks: Agent API Integration

**Input**: Design documents from `/specs/012-agent-api-integration/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No e2e tests requested in spec. Tests are OPTIONAL.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project root**: `/` (flat structure, no src/ directory)
- **Components**: `components/`
- **Services**: `services/api/`, `services/hooks/`
- **Types**: `services/api/types.ts`, `types.ts`

---

## Phase 1: Setup (API Types & Infrastructure)

**Purpose**: Define API types and create agent service

- [x] T001 [P] Add Agent API types (AgentDTO, AgentRoleDTO, AgentStatusDTO, AgentConfigDTO, AgentTemplateDTO) in services/api/types.ts
- [x] T002 [P] Add Agent request types (ListAgentsRequest, GetAgentRequest, CreateAgentRequest, UpdateAgentRequest, UpdateAgentConfigRequest, DeleteAgentRequest) in services/api/types.ts
- [x] T003 [P] Add Agent response types (AgentListResponse, AgentDetailResponse, AgentTemplateListResponse) in services/api/types.ts
- [x] T004 Add 423 (Locked) error code handling in services/api/types.ts ERROR_MESSAGES constant

---

## Phase 2: Foundational (Agent API Service & Hook)

**Purpose**: Core API service and React hook that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create agent API service with listAgents function in services/api/agents.ts
- [x] T006 Add getAgent, createAgent, updateAgent functions in services/api/agents.ts
- [x] T007 Add updateAgentConfig, deleteAgent functions in services/api/agents.ts
- [x] T008 Add listAgentTemplates function in services/api/agents.ts
- [x] T009 Export agent API functions in services/api/index.ts
- [x] T010 Create useAgents hook with list fetching, pagination, loading state in services/hooks/useAgents.ts
- [x] T011 Add type conversion helpers (toFrontendAgent, toApiRole) in services/hooks/useAgents.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Agent List (Priority: P1) 🎯 MVP

**Goal**: Users can view a paginated list of all AI agents from the backend, with filtering by role and search by name/specialty

**Independent Test**: Navigate to Agents page, verify agents load from backend API with pagination, filters, and search working correctly

### Implementation for User Story 1

- [x] T012 [US1] Update AgentManagement component to remove teams prop dependency in components/AgentManagement.tsx
- [x] T013 [US1] Integrate useAgents hook to fetch agent list in components/AgentManagement.tsx
- [x] T014 [US1] Update filteredAgents logic to use API data in components/AgentManagement.tsx
- [x] T015 [US1] Implement role filter to call API with role parameter in components/AgentManagement.tsx
- [x] T016 [US1] Implement keyword search to call API with keyword parameter in components/AgentManagement.tsx
- [x] T017 [US1] Update pagination to use API totalElements/totalPages in components/AgentManagement.tsx
- [x] T018 [US1] Add loading spinner during agent list fetch in components/AgentManagement.tsx
- [x] T019 [US1] Add error banner for API errors in components/AgentManagement.tsx
- [x] T020 [US1] Add empty state message when no agents exist in components/AgentManagement.tsx

**Checkpoint**: User Story 1 complete - agent list displays from backend API

---

## Phase 4: User Story 2 - View Agent Details (Priority: P1)

**Goal**: Users can click on an agent card to view detailed information including AI configuration

**Independent Test**: Click any agent card, verify all fields from API are displayed correctly

### Implementation for User Story 2

- [x] T021 [US2] Update viewingAgent state to use API data type in components/AgentManagement.tsx
- [x] T022 [US2] Update agent detail modal to display all AgentDTO fields (config, teamIds, timestamps) in components/AgentManagement.tsx
- [x] T023 [US2] Display warnings/critical findings counts in agent detail modal in components/AgentManagement.tsx
- [x] T024 [US2] Display team assignments list in agent detail modal in components/AgentManagement.tsx
- [x] T025 [US2] Handle long text truncation in card view, full text in detail modal in components/AgentManagement.tsx

**Checkpoint**: User Story 2 complete - agent details display correctly

---

## Phase 5: User Story 3 - Create New Agent (Priority: P2)

**Goal**: Users can create a new agent by specifying name, specialty, and optionally selecting a configuration template

**Independent Test**: Click "New Agent" button, fill form, submit, verify new agent appears in list

### Implementation for User Story 3

- [x] T026 [US3] Update AddAgentModal to call createAgent API on submit in components/AgentManagement.tsx
- [x] T027 [US3] Add client-side validation for required name field in AddAgentModal in components/AgentManagement.tsx
- [x] T028 [US3] Add API error handling (409 conflict, 400 validation) in AddAgentModal in components/AgentManagement.tsx
- [x] T029 [US3] Add loading state during create operation in AddAgentModal in components/AgentManagement.tsx
- [x] T030 [US3] Refresh agent list after successful creation in components/AgentManagement.tsx
- [x] T031 [US3] Remove handleAddAgent prop from App.tsx and AgentManagement route

**Checkpoint**: User Story 3 complete - can create new agents via API

---

## Phase 6: User Story 4 - Configure Agent Settings (Priority: P2)

**Goal**: Users can update an agent's AI configuration including model selection, temperature, and system instruction

**Independent Test**: Open agent configuration modal, change settings, save, verify changes persist

### Implementation for User Story 4

- [x] T032 [US4] Create useAgentTemplates hook to fetch templates in services/hooks/useAgentTemplates.ts (NOTE: Using local templates in AgentConfigModal.tsx)
- [x] T033 [US4] Update AgentConfigModal to use updateAgentConfig API on save in components/AgentConfigModal.tsx
- [x] T034 [US4] Integrate templates dropdown in AgentConfigModal from useAgentTemplates hook in components/AgentConfigModal.tsx
- [x] T035 [US4] Add template selection handler that auto-fills systemInstruction and defaultContext in components/AgentConfigModal.tsx
- [x] T036 [US4] Add temperature validation (0.0-1.0 range) in components/AgentConfigModal.tsx
- [x] T037 [US4] Handle 423 error (agent busy) with user-friendly message in components/AgentConfigModal.tsx
- [x] T038 [US4] Add loading state during save operation in components/AgentConfigModal.tsx
- [x] T039 [US4] Refresh agent list after successful config update in components/AgentManagement.tsx

**Checkpoint**: User Story 4 complete - can configure agent settings via API

---

## Phase 7: User Story 5 - Delete Agent (Priority: P3)

**Goal**: Users can delete worker agents they no longer need, with a confirmation dialog

**Independent Test**: Click delete on a worker agent, confirm, verify agent disappears from list

### Implementation for User Story 5

- [x] T040 [US5] Update delete confirmation modal to call deleteAgent API on confirm in components/AgentManagement.tsx
- [x] T041 [US5] Handle 400 error (supervisor with members) with user-friendly message in components/AgentManagement.tsx
- [x] T042 [US5] Handle 423 error (agent busy) with user-friendly message in components/AgentManagement.tsx
- [x] T043 [US5] Add loading state during delete operation in components/AgentManagement.tsx
- [x] T044 [US5] Refresh agent list after successful deletion in components/AgentManagement.tsx
- [x] T045 [US5] Remove handleDeleteAgent prop from App.tsx and AgentManagement route

**Checkpoint**: User Story 5 complete - can delete agents via API

---

## Phase 8: User Story 6 - Update Agent Basic Info (Priority: P3)

**Goal**: Users can update an agent's name and specialty without changing AI configuration

**Independent Test**: Open agent, update name/specialty, save, verify changes persist

### Implementation for User Story 6

- [x] T046 [US6] Add edit mode to agent detail/profile modal for name/specialty in components/AgentManagement.tsx
- [x] T047 [US6] Call updateAgent API on basic info save in components/AgentManagement.tsx
- [x] T048 [US6] Handle 409 error (name conflict) with user-friendly message in components/AgentManagement.tsx
- [x] T049 [US6] Add loading state during update operation in components/AgentManagement.tsx
- [x] T050 [US6] Refresh agent list after successful update in components/AgentManagement.tsx

**Checkpoint**: User Story 6 complete - can update agent basic info via API

---

## Phase 9: User Story 7 - Apply Configuration Templates (Priority: P3)

**Goal**: Users can apply predefined configuration templates to quickly set up agent behavior patterns

**Independent Test**: Open config modal, select template from dropdown, verify fields auto-populate

### Implementation for User Story 7

- [x] T051 [US7] Display template list with name and description in template dropdown in components/AgentConfigModal.tsx
- [x] T052 [US7] Show recommended model and temperature when template selected in components/AgentConfigModal.tsx
- [x] T053 [US7] Allow user to override template values before saving in components/AgentConfigModal.tsx

**Checkpoint**: User Story 7 complete - templates integration working

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and final improvements

- [x] T054 [P] Remove unused agent-related mock handlers from App.tsx
- [x] T055 [P] Remove agent-related props from AgentManagement route in App.tsx
- [x] T056 [P] Remove unused team-based agent state from App.tsx (NOTE: teams state still used by ResourceDetailWrapper)
- [x] T057 Update AgentManagementProps interface to remove deprecated props in components/AgentManagement.tsx
- [x] T058 Verify all loading states display correctly across operations
- [x] T059 Verify all error messages are user-friendly (no raw error codes)
- [x] T060 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Uses same data as US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independent
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Independent
- **User Story 7 (P3)**: Depends on US4 (templates integration in config modal)

### Within Each User Story

- API service functions before hook integration
- Hook before component integration
- Core functionality before error handling
- Error handling before loading states

### Parallel Opportunities

- Phase 1: T001, T002, T003 can run in parallel (different sections of types.ts)
- Phase 2: API functions can be added sequentially (same file)
- Phase 3-9: Different user stories can run in parallel if team capacity allows
- Phase 10: T054, T055, T056 can run in parallel (different files)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all type definition tasks together:
Task: "Add Agent API types in services/api/types.ts"
Task: "Add Agent request types in services/api/types.ts"
Task: "Add Agent response types in services/api/types.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (View Agent List)
4. Complete Phase 4: User Story 2 (View Agent Details)
5. **STOP and VALIDATE**: Test viewing agents independently
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 → Can view agents → Deploy/Demo (MVP!)
3. Add US3 + US4 → Can create and configure → Deploy/Demo
4. Add US5 + US6 + US7 → Full CRUD + templates → Deploy/Demo

### Priority Order (Single Developer)

P1 → P2 → P3 in sequence:
1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: US1 (View List)
4. Phase 4: US2 (View Details)
5. Phase 5: US3 (Create)
6. Phase 6: US4 (Configure)
7. Phase 7: US5 (Delete)
8. Phase 8: US6 (Update Info)
9. Phase 9: US7 (Templates)
10. Phase 10: Polish

---

## Summary

| Phase | Story | Tasks | Priority | Status |
|-------|-------|-------|----------|--------|
| 1 | Setup | T001-T004 | - | ✅ Complete |
| 2 | Foundational | T005-T011 | - | ✅ Complete |
| 3 | US1 - View Agent List | T012-T020 | P1 | ✅ Complete |
| 4 | US2 - View Agent Details | T021-T025 | P1 | ✅ Complete |
| 5 | US3 - Create New Agent | T026-T031 | P2 | ✅ Complete |
| 6 | US4 - Configure Agent Settings | T032-T039 | P2 | ✅ Complete |
| 7 | US5 - Delete Agent | T040-T045 | P3 | ✅ Complete |
| 8 | US6 - Update Agent Basic Info | T046-T050 | P3 | ✅ Complete |
| 9 | US7 - Apply Configuration Templates | T051-T053 | P3 | ✅ Complete |
| 10 | Polish | T054-T060 | - | ✅ Complete |

**Total Tasks**: 60
**MVP Scope**: Phases 1-4 (T001-T025) = 25 tasks
**Completed**: 60/60 tasks (100%)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
