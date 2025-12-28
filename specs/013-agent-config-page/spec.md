# Feature Specification: Agent Configuration Page

**Feature Branch**: `013-agent-config-page`
**Created**: 2025-12-28
**Status**: Draft
**Input**: User description: "agent配置页面，建议不要用弹窗，改用页面，除了基础信息外，要选择提示词模板，要选择工具，建议分三个阶段来配置，在配置提示词模板时，可以预览提示词模板中的内容"

## Clarifications

### Session 2025-12-28

- Q: Save Strategy - how should configuration changes be saved across the three stages? → A: Per-Stage Manual Save - Each stage has its own "Save" button
- Q: Template Preview Display - how should prompt template preview be displayed? → A: Side Panel - Preview shows in a collapsible panel beside the template list
- Q: Agent-Tool Assignment API - how should tool assignments be persisted? → A: Embedded Field - Agent update API now includes `toolIds` array for full replacement of tool bindings

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Agent Basic Information (Priority: P1)

As a system administrator, I want to configure an agent's basic information on a dedicated page (not a modal), so that I have more space and a better experience when managing agent settings.

**Why this priority**: Basic information is the foundation of agent configuration. Without basic settings, the agent cannot function. This is the entry point for all agent configuration workflows.

**Independent Test**: Can be fully tested by navigating to an agent's configuration page, editing name/description/role fields, saving, and verifying the changes persist.

**Acceptance Scenarios**:

1. **Given** I am on the agent list page, **When** I click the "Configure" action for an agent, **Then** I am navigated to a dedicated configuration page (not a modal popup)
2. **Given** I am on the agent configuration page, **When** I view the page layout, **Then** I see a three-stage wizard/stepper interface showing: "Basic Info", "Prompt Template", and "Tools"
3. **Given** I am in the Basic Info stage, **When** I modify the agent name and save, **Then** the changes are persisted and I can proceed to the next stage
4. **Given** I am editing basic information, **When** I enter invalid data (empty name), **Then** I see appropriate validation error messages

---

### User Story 2 - Select and Preview Prompt Template (Priority: P1)

As a system administrator, I want to select a prompt template for an agent and preview its content before applying it, so that I can understand what instructions the agent will receive.

**Why this priority**: Prompt templates define agent behavior. The ability to preview before selecting is critical for making informed decisions and avoiding configuration errors.

**Independent Test**: Can be fully tested by entering the Prompt Template stage, browsing available templates, previewing template content, selecting one, and verifying the selection is saved.

**Acceptance Scenarios**:

1. **Given** I am in the Prompt Template stage, **When** I view the available templates, **Then** I see a list/grid of prompt templates with names and brief descriptions
2. **Given** I am viewing the template list, **When** I click on a template to preview, **Then** I see the full content of the prompt template displayed in a collapsible side panel
3. **Given** I am previewing a template, **When** I click "Select this template", **Then** the template is associated with the agent
4. **Given** I have selected a template, **When** I return to the Prompt Template stage later, **Then** I see the currently selected template is highlighted/indicated
5. **Given** I am in the Prompt Template stage, **When** I search or filter templates, **Then** the list updates to show matching templates

---

### User Story 3 - Configure Agent Tools (Priority: P2)

As a system administrator, I want to select which tools an agent can use, so that I can control the agent's capabilities and limit it to relevant functions.

**Why this priority**: Tools extend agent capabilities. While important, agents can function with just basic info and a prompt template. Tool selection adds advanced functionality.

**Independent Test**: Can be fully tested by entering the Tools stage, viewing available tools, selecting/deselecting tools, and verifying the tool assignments are saved.

**Acceptance Scenarios**:

1. **Given** I am in the Tools stage, **When** I view the page, **Then** I see a list of available tools grouped by category
2. **Given** I am viewing tool categories, **When** I expand a category, **Then** I see the individual tools within that category with descriptions
3. **Given** I am selecting tools, **When** I check/uncheck tool checkboxes, **Then** the selection is visually reflected
4. **Given** I have selected tools, **When** I save the configuration, **Then** the tool assignments are persisted to the agent
5. **Given** I return to the Tools stage later, **When** I view the tool list, **Then** previously selected tools are shown as checked

---

### User Story 4 - Navigate Three-Stage Configuration (Priority: P2)

As a system administrator, I want to navigate between the three configuration stages freely, so that I can review and modify settings in any order.

**Why this priority**: Flexibility in navigation improves user experience. Users should not be forced into a strict linear flow after initial setup.

**Independent Test**: Can be fully tested by clicking between stages in the stepper, verifying data persists when switching, and confirming unsaved changes are handled appropriately.

**Acceptance Scenarios**:

1. **Given** I am on any configuration stage, **When** I click on another stage in the stepper, **Then** I navigate to that stage
2. **Given** I have unsaved changes in the current stage, **When** I try to navigate away, **Then** I am prompted to save or discard changes
3. **Given** I complete all three stages, **When** I view the stepper, **Then** completed stages show a completion indicator
4. **Given** I am on any stage, **When** I click the stage's "Save" button, **Then** changes for that stage are persisted independently

---

### Edge Cases

- What happens when the agent is currently running a task? Configuration should be read-only or show a warning.
- How does the system handle if no prompt templates exist? Show empty state with guidance to create templates first.
- What happens if selected tools are later deleted from the system? Show warning about missing tools on the configuration page.
- How does the system handle network errors during save? Show error message and allow retry without losing entered data.
- What happens when user navigates away without saving? Prompt to confirm or auto-save draft.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated full-page interface for agent configuration (replacing the current modal approach)
- **FR-002**: System MUST organize agent configuration into three distinct stages: Basic Information, Prompt Template Selection, and Tools Selection
- **FR-003**: System MUST display a visual stepper/wizard component showing all three stages and current progress
- **FR-004**: System MUST allow users to navigate between stages freely (non-linear navigation)
- **FR-005**: System MUST provide a "Save" button on each stage, allowing users to persist changes for that stage independently
- **FR-006**: System MUST display prompt template preview in a collapsible side panel beside the template list, showing full template content when a template is selected
- **FR-007**: System MUST allow searching/filtering of prompt templates in the selection interface
- **FR-008**: System MUST display available tools grouped by their categories
- **FR-009**: System MUST allow multi-select of tools using checkboxes or similar controls
- **FR-010**: System MUST show currently selected/assigned items (template, tools) when returning to the configuration page
- **FR-011**: System MUST validate required fields before allowing save (e.g., agent name cannot be empty)
- **FR-012**: System MUST handle unsaved changes appropriately when navigating away from the page
- **FR-013**: System MUST provide visual feedback for completed stages in the stepper
- **FR-014**: System MUST show appropriate empty states when no templates or tools are available
- **FR-015**: System MUST use the agent update API's `toolIds` field to persist tool assignments (full replacement semantics)

### Key Entities

- **Agent**: The AI agent being configured. Key attributes: id, name, role, specialty, promptTemplateId, toolIds (array of assigned tool IDs)
- **Prompt Template**: A reusable template containing system instructions for agents. Key attributes: id, name, description, content (the actual prompt text)
- **Tool**: A capability that can be assigned to agents. Key attributes: id, name, description, category
- **Tool Category**: A grouping of related tools. Key attributes: id, name, tools within category

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete full agent configuration (all three stages) in under 5 minutes
- **SC-002**: Users can preview prompt template content without leaving the configuration page
- **SC-003**: 90% of users successfully configure an agent on their first attempt without encountering blocking errors
- **SC-004**: Configuration page provides at least 3x more usable space compared to the previous modal approach
- **SC-005**: All configuration changes are saved correctly and reflected when returning to the page
- **SC-006**: Users can search and find the desired prompt template within 10 seconds

## Assumptions

- Prompt templates API already exists and returns template content for preview
- Tools API and tool categories API already exist for fetching available tools
- Agent update API supports updating basic info, prompt template (promptTemplateId), and tool bindings (toolIds array with full replacement semantics)
- The existing agent list page will be modified to link to the new configuration page instead of opening a modal
- Draft/auto-save functionality is not required for MVP; explicit save is sufficient
