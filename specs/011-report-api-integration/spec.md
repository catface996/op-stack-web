# Feature Specification: Report and Report Template API Integration

**Feature Branch**: `011-report-api-integration`
**Created**: 2024-12-28
**Status**: Draft
**Input**: User description: "Integrate Report and Report Template management APIs from backend (http://localhost:8080/docs/service/v3/api-docs)"

## Overview

This feature integrates the frontend Report Management and Report Template Management pages with the backend REST APIs. Currently, both pages use mock data. The backend APIs are already available and follow the project's standard POST-only pattern with pagination support.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Report List (Priority: P1)

As an operations engineer, I want to view a paginated list of reports so that I can browse through system intelligence reports and find relevant information.

**Why this priority**: This is the core functionality - users need to see reports before any other operation. The report list page is the entry point to the entire report management feature.

**Independent Test**: Can be fully tested by loading the Reports page and verifying reports are fetched from the backend API with proper pagination, filtering, and search functionality.

**Acceptance Scenarios**:

1. **Given** I am on the Reports page, **When** the page loads, **Then** I see a paginated list of reports fetched from the backend API
2. **Given** I am viewing reports, **When** I select a type filter (Diagnosis/Audit/Performance/Security), **Then** only reports of that type are displayed
3. **Given** I am viewing reports, **When** I enter a search keyword, **Then** reports matching the keyword in title, summary, or tags are displayed
4. **Given** there are more than 8 reports, **When** I navigate to the next page, **Then** I see the next set of reports

---

### User Story 2 - View Report Details (Priority: P1)

As an operations engineer, I want to view the full details of a report so that I can read the complete analysis and findings.

**Why this priority**: Viewing report details is essential for extracting value from reports. Without this, users cannot read the actual report content.

**Independent Test**: Can be tested by clicking on any report in the list and verifying the detail view shows all report fields fetched from the backend.

**Acceptance Scenarios**:

1. **Given** I am viewing the report list, **When** I click on a report, **Then** I see the report detail view with full content
2. **Given** I am viewing a report detail, **When** the API returns the report, **Then** I see title, author, type, status, summary, content (rendered as Markdown), tags, and creation date
3. **Given** I am viewing a report detail, **When** I click the back button, **Then** I return to the report list

---

### User Story 3 - View Report Template List (Priority: P2)

As an operations engineer, I want to view available report templates so that I can see what templates exist for generating reports.

**Why this priority**: Report templates are a secondary feature that supports report creation. Users can still use the system effectively with just report viewing.

**Independent Test**: Can be tested by navigating to the Templates page and verifying templates are fetched from the backend API.

**Acceptance Scenarios**:

1. **Given** I am on the Reports page, **When** I click "Templates" button, **Then** I navigate to the template management page
2. **Given** I am on the Templates page, **When** the page loads, **Then** I see a paginated list of templates from the backend API
3. **Given** I am viewing templates, **When** I select a category filter (Incident/Performance/Security/Audit), **Then** only templates of that category are displayed
4. **Given** I am viewing templates, **When** I search by keyword, **Then** matching templates are displayed

---

### User Story 4 - Create New Report Template (Priority: P3)

As an operations engineer, I want to create new report templates so that I can define standard formats for different types of reports.

**Why this priority**: Creating templates is an advanced feature. Most users will use existing templates, making this lower priority.

**Independent Test**: Can be tested by clicking "New Template", filling the form, and verifying the template is created via backend API.

**Acceptance Scenarios**:

1. **Given** I am on the Templates page, **When** I click "New Template", **Then** I see a form to create a new template
2. **Given** I am creating a template, **When** I fill in name, category, content (with placeholders), and submit, **Then** the template is created via the backend API
3. **Given** I am creating a template, **When** I submit with a duplicate name, **Then** I see an error message "Template name already exists"

---

### User Story 5 - Edit Report Template (Priority: P3)

As an operations engineer, I want to edit existing report templates so that I can update template content and metadata.

**Why this priority**: Template editing is less frequent than viewing. Templates are typically created once and used many times.

**Independent Test**: Can be tested by selecting a template, modifying fields, and verifying changes are saved via backend API with optimistic locking.

**Acceptance Scenarios**:

1. **Given** I am viewing a template, **When** I click "Edit", **Then** I see an edit form with current template data
2. **Given** I am editing a template, **When** I modify fields and save, **Then** the changes are saved via the backend API
3. **Given** another user has modified the template, **When** I try to save, **Then** I see a version conflict error and can refresh to get latest version

---

### User Story 6 - Delete Report Template (Priority: P3)

As an operations engineer, I want to delete report templates that are no longer needed so that I can keep the template library clean.

**Why this priority**: Deletion is a rare operation and should be approached with caution.

**Independent Test**: Can be tested by selecting a template, confirming deletion, and verifying it's removed via backend API.

**Acceptance Scenarios**:

1. **Given** I am viewing templates, **When** I click delete on a template, **Then** I see a confirmation dialog
2. **Given** I confirm deletion, **When** the API call succeeds, **Then** the template is removed from the list
3. **Given** I cancel deletion, **When** the dialog closes, **Then** the template remains in the list

---

### User Story 7 - Delete Report (Priority: P3)

As an operations engineer, I want to delete reports that are no longer needed so that I can manage the report archive.

**Why this priority**: Reports are typically archived rather than deleted. Deletion should be rare.

**Independent Test**: Can be tested by selecting a report, confirming deletion, and verifying it's removed via backend API.

**Acceptance Scenarios**:

1. **Given** I am viewing reports, **When** I click delete on a report, **Then** I see a confirmation dialog
2. **Given** I confirm deletion, **When** the API call succeeds, **Then** the report is removed from the list

---

### Edge Cases

- What happens when the API returns an empty list? Display an empty state message.
- What happens when the API call fails? Display an error message with retry option.
- What happens when viewing a report that was deleted by another user? Show "Report not found" and redirect to list.
- What happens when editing a template with stale data? Show version conflict error with option to refresh.
- What happens when search returns no results? Display "No reports found" message.

## Requirements *(mandatory)*

### Functional Requirements

**Report Management:**

- **FR-001**: System MUST fetch reports from `POST /api/service/v1/reports/list` with pagination support
- **FR-002**: System MUST support filtering reports by type (Diagnosis, Audit, Performance, Security)
- **FR-003**: System MUST support filtering reports by status (Draft, Final, Archived)
- **FR-004**: System MUST support keyword search across title, summary, and tags
- **FR-005**: System MUST fetch report details from `POST /api/service/v1/reports/get`
- **FR-006**: System MUST render report content as Markdown
- **FR-007**: System MUST support deleting reports via `POST /api/service/v1/reports/delete`
- **FR-008**: Reports are immutable after creation - no update functionality required

**Report Template Management:**

- **FR-009**: System MUST fetch templates from `POST /api/service/v1/report-templates/list`
- **FR-010**: System MUST support filtering templates by category (Incident, Performance, Security, Audit)
- **FR-011**: System MUST support keyword search for templates
- **FR-012**: System MUST fetch template details from `POST /api/service/v1/report-templates/get`
- **FR-013**: System MUST support creating templates via `POST /api/service/v1/report-templates/create`
- **FR-014**: System MUST support updating templates via `POST /api/service/v1/report-templates/update` with optimistic locking
- **FR-015**: System MUST support deleting templates via `POST /api/service/v1/report-templates/delete`

**API Integration:**

- **FR-016**: All API calls MUST use POST method (POST-only API pattern)
- **FR-017**: System MUST handle API response format: `{ code, success, message, data }`
- **FR-018**: System MUST handle pagination response: `{ content, page, size, totalElements, totalPages, first, last }`

### Key Entities

- **Report**: Immutable document containing title, type (Diagnosis/Audit/Performance/Security), status (Draft/Final/Archived), author, summary, content (Markdown), tags, optional topologyId, createdAt. ID is integer (int64).

- **ReportTemplate**: Mutable template containing name, description, category (Incident/Performance/Security/Audit), content (Markdown with placeholders), tags, version (for optimistic locking), createdAt, updatedAt. ID is integer (int64).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view the report list within 2 seconds of page load
- **SC-002**: Users can search and filter reports with results appearing within 1 second
- **SC-003**: Users can view full report details including rendered Markdown content
- **SC-004**: Template CRUD operations complete successfully with appropriate feedback
- **SC-005**: All error states display user-friendly messages with recovery options
- **SC-006**: Pagination works correctly for both reports and templates
- **SC-007**: Version conflicts during template updates are handled gracefully with user notification

## API Contract Reference

### Report APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/service/v1/reports/list` | POST | List reports with pagination and filters |
| `/api/service/v1/reports/get` | POST | Get report detail by ID |
| `/api/service/v1/reports/create` | POST | Create new report |
| `/api/service/v1/reports/delete` | POST | Delete report by ID |

### Report Template APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/service/v1/report-templates/list` | POST | List templates with pagination |
| `/api/service/v1/report-templates/get` | POST | Get template detail by ID |
| `/api/service/v1/report-templates/create` | POST | Create new template |
| `/api/service/v1/report-templates/update` | POST | Update template (with optimistic locking) |
| `/api/service/v1/report-templates/delete` | POST | Delete template by ID |

## Assumptions

- Backend APIs are already deployed and accessible at `http://localhost:8080` (proxied)
- Report IDs and Template IDs are integers (int64), not strings
- The existing frontend components (ReportManagement.tsx, ReportTemplateManagement.tsx) will be modified to use real APIs
- Authentication is handled by the gateway - no frontend auth required for these APIs
- The Auto-generate report feature is out of scope for this integration (future enhancement)
