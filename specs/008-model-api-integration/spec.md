# Feature Specification: Model Management API Integration

**Feature Branch**: `008-model-api-integration`
**Created**: 2025-12-26
**Status**: Draft
**Input**: User description: "模型管理部分需要集成后端接口，后端api地址：http://localhost:7070/swagger.json ，注意，字段命名以后端为准，交互以前端为准。"

## Clarifications

### Session 2025-12-26
- Q: Field validation rules for temperature and top_p? → A: `temperature`: 0.0-2.0, `top_p`: 0.0-1.0 (standard LLM ranges)
- Q: API timeout threshold for error display? → A: 10 seconds (balanced, standard timeout)
- Q: Search/filter capabilities for model list? → A: Active status filter only (is_active toggle)

---

## API Architecture

### Multi-Backend Development Setup

During development, the frontend connects to multiple backend services directly:

| Service | Port | API Prefix | Description |
|---------|------|------------|-------------|
| Resource/Topology API | 8080 | `/api/v1/resources/*`, `/api/v1/topologies/*` | Resource and topology management |
| Model API | 7070 | `/api/v1/models/*` | AI model configuration management |

**Future Gateway Architecture**: In production, all API calls will route through a unified API gateway that handles proxy forwarding to appropriate backend services. The frontend code should use consistent API paths (e.g., `/api/v1/models/*`) so that no code changes are needed when switching to gateway mode.

### Vite Proxy Configuration

Development proxy rules in `vite.config.ts`:
- `/api/v1/models/*` → `http://localhost:7070`
- `/api/*` (default) → `http://localhost:8080`

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Model List (Priority: P1)

As a platform administrator, I want to view all configured AI models in a paginated list so that I can see what models are available in the system.

**Why this priority**: This is the foundation for all model management - users must be able to see existing models before they can manage them.

**Independent Test**: Can be fully tested by loading the Model Management page and verifying models are displayed from the backend API with correct pagination.

**Acceptance Scenarios**:

1. **Given** the user navigates to Model Management, **When** the page loads, **Then** models are fetched from `/api/v1/models/list` and displayed in cards/list view with correct field mappings (id, name, model_id, description, is_active, max_tokens, temperature, top_p, region).
2. **Given** there are more than 8 models, **When** the user clicks pagination controls, **Then** the next page of models is fetched and displayed.
3. **Given** the API returns an error, **When** the page loads, **Then** an error message is displayed with a retry option.

---

### User Story 2 - Create New Model (Priority: P1)

As a platform administrator, I want to create new AI model configurations so that I can add new models to the system.

**Why this priority**: Creating models is essential for initial system setup and adding new AI capabilities.

**Independent Test**: Can be fully tested by opening the create modal, filling in required fields, and submitting to verify the model is created via API.

**Acceptance Scenarios**:

1. **Given** the user clicks "New Model", **When** the modal opens, **Then** a form displays with fields: name (required), model_id (required), description (optional), is_active (toggle), max_tokens (optional), temperature (optional), top_p (optional), region (optional).
2. **Given** the user fills in required fields (name, model_id), **When** they click Save, **Then** a POST request is sent to `/api/v1/models/create` and on success the list refreshes.
3. **Given** the API returns a validation error, **When** the user submits, **Then** the error message is displayed in the modal.

---

### User Story 3 - Edit Existing Model (Priority: P2)

As a platform administrator, I want to edit existing model configurations so that I can update model parameters as needed.

**Why this priority**: Updating models is important but secondary to viewing and creating them.

**Independent Test**: Can be fully tested by selecting a model, editing fields, and verifying the update is persisted via API.

**Acceptance Scenarios**:

1. **Given** the user clicks Edit on a model card, **When** the edit modal opens, **Then** the form is pre-populated with current model data from `/api/v1/models/get`.
2. **Given** the user modifies fields, **When** they click Save, **Then** a POST request is sent to `/api/v1/models/update` with the model id and changed fields.
3. **Given** the update succeeds, **When** the modal closes, **Then** the model list refreshes to show updated data.

---

### User Story 4 - Delete Model (Priority: P2)

As a platform administrator, I want to delete model configurations so that I can remove deprecated or unused models.

**Why this priority**: Deletion is less frequently used but necessary for maintenance.

**Independent Test**: Can be fully tested by selecting a model, confirming deletion, and verifying it's removed from the list.

**Acceptance Scenarios**:

1. **Given** the user clicks Delete on a model, **When** the confirmation modal appears, **Then** the user sees model name and a warning message.
2. **Given** the user confirms deletion, **When** the API call succeeds, **Then** the model is removed from the list via POST to `/api/v1/models/delete`.
3. **Given** the deletion fails, **When** an error occurs, **Then** an error message is displayed and the model remains in the list.

---

### User Story 5 - Toggle Model Active Status (Priority: P3)

As a platform administrator, I want to quickly toggle a model's active status so that I can enable or disable models without opening the edit form.

**Why this priority**: This is a convenience feature for quick status changes.

**Independent Test**: Can be fully tested by clicking the status toggle on a model and verifying the status changes via API.

**Acceptance Scenarios**:

1. **Given** a model displays an active/inactive status indicator, **When** the user clicks the status toggle, **Then** a POST request to `/api/v1/models/update` is sent with toggled `is_active` value.
2. **Given** the toggle succeeds, **When** the API returns, **Then** the UI updates to reflect the new status without full page reload.

---

### Edge Cases

- What happens when the models list is empty? Display an empty state with guidance to create a new model.
- How does system handle network timeout? Show error state with retry button after 10-second timeout threshold.
- What happens when model_id is not unique? Display API validation error in form.
- How does pagination work when last item on a page is deleted? Navigate to previous page if current page becomes empty.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch model list from POST `/api/v1/models/list` with pagination parameters (page, size) and optional is_active filter.
- **FR-002**: System MUST create models via POST `/api/v1/models/create` with required fields (name, model_id) and optional fields (description, is_active, max_tokens, temperature, top_p, region).
- **FR-003**: System MUST fetch single model details via POST `/api/v1/models/get` using model id.
- **FR-004**: System MUST update models via POST `/api/v1/models/update` with model id and editable fields.
- **FR-005**: System MUST delete models via POST `/api/v1/models/delete` using model id.
- **FR-006**: System MUST display loading states during API operations.
- **FR-007**: System MUST display error messages when API calls fail.
- **FR-008**: System MUST support both card and list view modes for model display.
- **FR-009**: System MUST maintain current frontend interaction patterns (modals, pagination, view switching).
- **FR-010**: System MUST validate numeric fields: `temperature` (0.0-2.0), `top_p` (0.0-1.0) before form submission.
- **FR-011**: System MUST timeout API requests after 10 seconds and display error state with retry option.
- **FR-012**: System MUST provide active status filter (is_active toggle) for model list filtering.

### Key Entities

- **Model**: Represents an AI model configuration with attributes:
  - `id` (number): Unique identifier
  - `name` (string): Display name for the model
  - `model_id` (string): Technical model identifier (e.g., "gpt-4", "claude-3")
  - `description` (string, optional): Model description
  - `is_active` (boolean): Whether model is currently enabled
  - `max_tokens` (number, optional): Maximum token limit for responses
  - `temperature` (number, optional): Sampling temperature, valid range 0.0-2.0
  - `top_p` (number, optional): Nucleus sampling parameter, valid range 0.0-1.0
  - `region` (string, optional): Deployment region

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All model CRUD operations execute successfully against backend API with correct request/response handling.
- **SC-002**: Model list pagination works correctly with proper page navigation.
- **SC-003**: Form validation prevents submission of invalid data (empty required fields, out-of-range values).
- **SC-004**: Error states are displayed clearly with actionable recovery options (retry button).
- **SC-005**: Loading states are shown during all async operations.
- **SC-006**: Existing frontend interaction patterns (card/list view, modals, active status filter) are preserved.
