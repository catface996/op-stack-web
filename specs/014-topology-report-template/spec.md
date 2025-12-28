# Feature Specification: Topology Report Template Binding

**Feature Branch**: `014-topology-report-template`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "Implement topology report template binding feature with bind, unbind, and query APIs for topologies"

## Clarification Summary

- Q: UI location for template binding - Decided: Within existing TopologyDetailView as a new tab/section
- Q: Batch operation scope - Decided: Single topology, multiple templates per operation

### Session 2025-12-29

- Q: How should the bound and unbound template lists be displayed? → A: Two-column layout - Available (unbound) on left, Bound on right (consistent with ToolsStage pattern)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Bind Report Templates (Priority: P1)

As a topology administrator, I want to view available report templates and bind them to my topology so that reports can be generated using these templates.

**Why this priority**: Core functionality - users must be able to discover and bind templates to enable report generation for topologies.

**Independent Test**: Navigate to a topology detail view, access the report templates section, view unbound templates, select one or more templates, and bind them. Verify the templates appear in the bound list.

**Acceptance Scenarios**:

1. **Given** I am viewing a topology's detail page, **When** I navigate to the report templates section, **Then** I see a list of available (unbound) report templates with their names and descriptions
2. **Given** I am viewing unbound templates, **When** I select one or more templates and click "Bind", **Then** the selected templates are bound to the topology and move to the bound templates list
3. **Given** I am viewing the report templates section, **When** templates are loading, **Then** I see a loading indicator
4. **Given** the API returns an error during binding, **When** the error occurs, **Then** I see an error message and can retry the operation

---

### User Story 2 - View and Unbind Report Templates (Priority: P1)

As a topology administrator, I want to view bound report templates and unbind them from my topology when they are no longer needed.

**Why this priority**: Core functionality - users must be able to manage (remove) template bindings to maintain topology configuration.

**Independent Test**: Navigate to a topology's report templates section, view bound templates, select one or more templates, and unbind them. Verify the templates move to the unbound list.

**Acceptance Scenarios**:

1. **Given** I am viewing a topology's report templates section, **When** templates are bound to this topology, **Then** I see a list of bound templates with their names and binding status
2. **Given** I am viewing bound templates, **When** I select one or more templates and click "Unbind", **Then** the selected templates are unbound and move to the available templates list
3. **Given** the API returns an error during unbinding, **When** the error occurs, **Then** I see an error message and the template remains in the bound list

---

### User Story 3 - Search and Filter Templates (Priority: P2)

As a topology administrator, I want to search and filter report templates to quickly find the ones I need.

**Why this priority**: Enhances usability - with many templates, search helps users find specific templates efficiently.

**Independent Test**: Access the report templates section, enter a search term, verify the template list filters to show matching results.

**Acceptance Scenarios**:

1. **Given** I am viewing the report templates section, **When** I enter a search keyword, **Then** the template list filters to show only templates matching the keyword
2. **Given** I have applied a search filter, **When** I clear the search, **Then** the full template list is restored

---

### User Story 4 - Paginated Template Lists (Priority: P2)

As a topology administrator, I want template lists to support pagination so I can browse through many templates without performance issues.

**Why this priority**: Supports scalability - pagination ensures good performance with large numbers of templates.

**Independent Test**: Access a report templates section with many templates, verify pagination controls appear and navigation between pages works correctly.

**Acceptance Scenarios**:

1. **Given** there are more templates than fit on one page, **When** I view the template list, **Then** I see pagination controls (page numbers or prev/next)
2. **Given** I am on page 1, **When** I click next page, **Then** the next set of templates is displayed

---

### Edge Cases

- What happens when there are no report templates available in the system? → Display empty state message
- What happens when all templates are already bound? → Unbound list shows empty state
- What happens when network fails during bind/unbind? → Show error toast and allow retry
- What happens when user tries to bind a template that was just bound by another user? → API handles conflict, UI refreshes list

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a report templates management section within the topology detail view using a two-column layout (Available templates on left, Bound templates on right)
- **FR-002**: System MUST fetch and display bound report templates for the current topology using paginated API
- **FR-003**: System MUST fetch and display unbound (available) report templates for the current topology using paginated API
- **FR-004**: System MUST allow users to select multiple templates for batch binding
- **FR-005**: System MUST allow users to select multiple templates for batch unbinding
- **FR-006**: System MUST call the bind API (`POST /api/service/v1/topologies/report-templates/bind`) with topology ID and template IDs
- **FR-007**: System MUST call the unbind API (`POST /api/service/v1/topologies/report-templates/unbind`) with topology ID and template IDs
- **FR-008**: System MUST refresh both template lists after successful bind/unbind operations
- **FR-009**: System MUST display loading states during API calls
- **FR-010**: System MUST display error messages when API calls fail
- **FR-011**: System MUST support search/filter within template lists
- **FR-012**: System MUST support pagination for both bound and unbound template lists

### Key Entities

- **Topology**: The parent entity that can have report templates bound to it. Key attributes: id, name
- **Report Template**: A template that defines report structure/format. Key attributes: id, name, description. Can be bound to multiple topologies
- **Template Binding**: The relationship between a topology and a report template. Created on bind, removed on unbind

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can bind report templates to a topology within 3 clicks from the topology detail page
- **SC-002**: Users can unbind report templates within 3 clicks
- **SC-003**: Template lists load and display within 2 seconds under normal network conditions
- **SC-004**: Batch operations (bind/unbind multiple templates) complete as a single action
- **SC-005**: Users receive clear feedback (success/error) within 1 second after any operation
- **SC-006**: Users can find specific templates using search within large template sets (100+ templates)

## Assumptions

- The backend APIs are implemented and follow the standard API response format used in this project
- Report templates already exist in the system (created via a separate feature)
- Users have appropriate permissions to manage topology report template bindings
- The topology detail view already exists and can accommodate a new section/tab
