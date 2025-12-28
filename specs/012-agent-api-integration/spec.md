# Feature Specification: Agent API Integration

**Feature Branch**: `012-agent-api-integration`
**Created**: 2025-12-28
**Status**: Draft
**Input**: User description: "Integrate backend Agent APIs with frontend Agent management module"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Agent List (Priority: P1)

Users can view a paginated list of all AI agents from the backend, with filtering by role and search by name/specialty.

**Why this priority**: This is the foundational feature - users must be able to see existing agents before performing any other operations. Without this, the Agent management page has no data.

**Independent Test**: Navigate to Agents page, verify agents load from backend API with pagination, filters, and search working correctly.

**Acceptance Scenarios**:

1. **Given** the user is on the Agents page, **When** the page loads, **Then** agents from the backend are displayed with correct pagination (showing total count, current page, page size)
2. **Given** agents are displayed, **When** the user selects "Supervisor" role filter, **Then** only TEAM_SUPERVISOR and GLOBAL_SUPERVISOR agents are shown
3. **Given** agents are displayed, **When** the user types "Performance" in search, **Then** agents matching name or specialty are filtered
4. **Given** more than 8 agents exist, **When** the user clicks "Next", **Then** the next page of agents is displayed

---

### User Story 2 - View Agent Details (Priority: P1)

Users can click on an agent card to view detailed information including AI configuration (model, temperature, system instruction).

**Why this priority**: Viewing details is essential for understanding agent configuration before making changes.

**Independent Test**: Click any agent card, verify all fields from API (name, role, specialty, config, findings, team assignments) are displayed correctly.

**Acceptance Scenarios**:

1. **Given** the user clicks an agent card, **When** the detail modal opens, **Then** agent name, role, specialty, model, temperature, and system instruction are displayed
2. **Given** an agent has warnings/critical findings, **When** viewing details, **Then** the finding counts are displayed accurately
3. **Given** an agent belongs to multiple teams, **When** viewing details, **Then** all team assignments are listed

---

### User Story 3 - Create New Agent (Priority: P2)

Users can create a new agent by specifying name, specialty, and optionally selecting a configuration template.

**Why this priority**: Creating agents enables users to expand their AI workforce, but viewing existing agents is more fundamental.

**Independent Test**: Click "New Agent" button, fill form, submit, verify new agent appears in list after refresh.

**Acceptance Scenarios**:

1. **Given** the user clicks "New Agent" button, **When** the create form opens, **Then** name field is required and specialty is optional
2. **Given** the user fills name and clicks "Deploy Agent", **When** the form submits, **Then** a new WORKER agent is created via API and appears in the list
3. **Given** the user enters a duplicate agent name, **When** submitting, **Then** an error message indicates the name already exists
4. **Given** the user leaves name empty, **When** attempting to submit, **Then** the form shows validation error and prevents submission

---

### User Story 4 - Configure Agent Settings (Priority: P2)

Users can update an agent's AI configuration including model selection, temperature, and system instruction.

**Why this priority**: Configuring agents is essential for customizing their behavior, but comes after creating/viewing.

**Independent Test**: Open agent configuration modal, change settings, save, verify changes persist when reopening.

**Acceptance Scenarios**:

1. **Given** the user opens agent config modal, **When** changing the model dropdown, **Then** available models (gemini-2.0-flash, gemini-2.5-flash, etc.) are shown
2. **Given** the user adjusts temperature slider, **When** saving, **Then** the new temperature value is persisted to backend
3. **Given** the user updates system instruction text, **When** saving, **Then** the updated instruction is saved
4. **Given** the user selects a template (e.g., "Strict Security Auditor"), **When** applying, **Then** the systemInstruction and defaultContext are auto-filled from the template
5. **Given** an agent is currently WORKING status, **When** attempting to update config, **Then** an error message indicates the agent is busy

---

### User Story 5 - Delete Agent (Priority: P3)

Users can delete worker agents they no longer need, with a confirmation dialog.

**Why this priority**: Deleting is a destructive action and less frequent than create/configure operations.

**Independent Test**: Click delete on a worker agent, confirm, verify agent disappears from list.

**Acceptance Scenarios**:

1. **Given** the user clicks delete on a WORKER agent, **When** confirmation dialog appears and user confirms, **Then** the agent is deleted and removed from the list
2. **Given** the user attempts to delete a TEAM_SUPERVISOR with members, **When** submitting, **Then** an error message indicates the supervisor has members and cannot be deleted
3. **Given** the user clicks delete on an agent, **When** canceling the confirmation, **Then** the agent remains in the list
4. **Given** an agent is currently WORKING, **When** attempting to delete, **Then** an error message indicates the agent is busy

---

### User Story 6 - Update Agent Basic Info (Priority: P3)

Users can update an agent's name and specialty without changing AI configuration.

**Why this priority**: Basic info updates are less critical than configuration changes.

**Independent Test**: Open agent, update name/specialty, save, verify changes persist.

**Acceptance Scenarios**:

1. **Given** the user opens agent edit, **When** changing name and saving, **Then** the new name appears in the list
2. **Given** the user changes specialty, **When** saving, **Then** the specialty is updated
3. **Given** the user enters a name that conflicts with another agent, **When** saving, **Then** an error message indicates name conflict

---

### User Story 7 - Apply Configuration Templates (Priority: P3)

Users can apply predefined configuration templates to quickly set up agent behavior patterns.

**Why this priority**: Templates improve efficiency but are an enhancement to basic configuration.

**Independent Test**: Open config modal, select template from dropdown, verify fields auto-populate.

**Acceptance Scenarios**:

1. **Given** the user opens agent config, **When** selecting "Standard Coordinator" template, **Then** systemInstruction is populated with coordinator behavior
2. **Given** template is applied, **When** viewing recommended model and temperature, **Then** the template's recommended values are shown
3. **Given** available templates, **When** listing, **Then** at least 5 templates are available (Coordinator, Security Auditor, Performance Optimizer, Root Cause Analyst, Concise Reporter)

---

### Edge Cases

- What happens when the backend API is unavailable? System shows error message with retry option.
- How does system handle concurrent updates? Backend returns 423 (Locked) if agent is busy.
- What happens when page loads with no agents? Empty state message is displayed.
- How does system handle very long agent names/specialty? Truncated with ellipsis in list, full text in detail view.
- What happens if user navigates away during save? Changes are lost, no partial saves.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch agent list from backend API with pagination parameters (page, size)
- **FR-002**: System MUST support filtering agents by role (ALL, GLOBAL_SUPERVISOR, TEAM_SUPERVISOR, WORKER, SCOUTER)
- **FR-003**: System MUST support keyword search matching agent name and specialty
- **FR-004**: System MUST display agent details including: id, name, role, specialty, warnings, critical, config (model, temperature, systemInstruction, defaultContext), teamIds, createdAt, updatedAt
- **FR-005**: System MUST create agents with name (required), role (default: WORKER), specialty (optional), config (optional)
- **FR-006**: System MUST update agent basic info (name, specialty)
- **FR-007**: System MUST update agent AI configuration (model, temperature, systemInstruction, defaultContext)
- **FR-008**: System MUST delete agents with confirmation dialog
- **FR-009**: System MUST fetch configuration templates from backend API
- **FR-010**: System MUST handle API error responses (400, 404, 409, 423) with appropriate user-friendly messages
- **FR-011**: System MUST display loading indicators during API operations
- **FR-012**: System MUST refresh agent list after create/update/delete operations
- **FR-013**: System MUST validate temperature parameter is between 0.0 and 1.0
- **FR-014**: System MUST prevent editing/deleting agents with WORKING or THINKING status

### Key Entities

- **Agent**: Represents an AI agent with id (number), name, role, specialty, status, findings (warnings/critical counts), config (AI settings), teamIds, timestamps
- **AgentConfig**: AI configuration with model identifier, temperature (0.0-1.0), systemInstruction, defaultContext
- **AgentTemplate**: Predefined configuration template with name, description, recommendedRole, systemInstruction, recommendedModel, recommendedTemperature

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view the complete agent list within 2 seconds of page load
- **SC-002**: Users can create a new agent in under 30 seconds (open modal, fill form, submit)
- **SC-003**: Configuration changes are persisted and visible immediately after save without page refresh
- **SC-004**: All API error scenarios display user-friendly messages (no raw error codes shown)
- **SC-005**: Search and filter operations return results within 1 second
- **SC-006**: Delete operations require explicit confirmation to prevent accidental data loss
- **SC-007**: 100% of agent data from backend API is displayed correctly in UI (no missing fields)

## Assumptions

- Backend API is available at localhost:8080 with the documented endpoints
- Agent IDs are numeric (int64) as per backend API schema
- Role values are: GLOBAL_SUPERVISOR, TEAM_SUPERVISOR, WORKER, SCOUTER
- Status values are: IDLE, THINKING, WORKING, COMPLETED, WAITING, ERROR
- The existing mock data handlers in App.tsx will be replaced with API calls
- Current mock data will be removed after API integration
- Authentication is handled by the gateway (no frontend auth logic needed)

## Out of Scope

- Team management (assign/unassign agents to teams) - separate feature
- Agent execution history/trace logs - existing functionality not affected
- Agent statistics dashboard - can be added later
- Real-time status updates (WebSocket) - future enhancement
