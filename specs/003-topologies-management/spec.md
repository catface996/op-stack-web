# Feature Specification: Topologies Management Page

**Feature Branch**: `003-topologies-management`
**Created**: 2025-12-25
**Status**: Draft
**Input**: User description: "通过顶部菜单，进入到Topologies 管理页面，支持对Topology的CRUD，以及加入节点，移除节点的相关操作，要集成后端的api"

## Overview

Replace the mock-data-driven Topologies management page with a fully API-integrated implementation. Users can access this page via the top navigation menu to create, view, edit, and delete Topology groups (subgraphs), as well as add and remove member resources (nodes) from each Topology.

## Clarifications

### Session 2025-12-25

- Q: How should the Topology detail view be displayed when user clicks "Enter/Explore"? → A: Navigate to dedicated detail page (existing `topology-detail` view state in App.tsx)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Topology List (Priority: P1)

As a system administrator, I want to view a list of all Topology groups so that I can see what logical groupings exist in the system.

**Why this priority**: This is the foundation - users must be able to see existing Topologies before they can manage them.

**Independent Test**: Navigate to Topologies from top menu, verify list loads with pagination, search, and view mode toggle (card/list).

**Acceptance Scenarios**:

1. **Given** a user clicks "Topologies" in the top navigation, **When** the page loads, **Then** a paginated list of Topology groups is displayed with their names, descriptions, member counts, and tags
2. **Given** the Topologies list is displayed, **When** the user types in the search box, **Then** the list is filtered by name, description, or tags in real-time
3. **Given** the Topologies list is displayed, **When** the user clicks the view toggle, **Then** the display switches between card view (8 items/page) and list view (10 items/page)
4. **Given** more Topologies exist than fit on one page, **When** the user clicks pagination controls, **Then** the next/previous page of results is displayed
5. **Given** the backend API is unavailable, **When** the page loads, **Then** an error message is displayed with a retry option

---

### User Story 2 - Create New Topology (Priority: P1)

As a system administrator, I want to create a new Topology group so that I can organize resources into logical clusters.

**Why this priority**: Creating Topologies is essential for building the organizational structure.

**Independent Test**: Click "Create Topology" button, fill form, submit, verify new Topology appears in list.

**Acceptance Scenarios**:

1. **Given** a user clicks "Create Topology", **When** the modal opens, **Then** a form is displayed with fields for name (required), description, and tags
2. **Given** a user fills in the topology form with valid data, **When** they click "Save", **Then** the Topology is created via API and appears in the list
3. **Given** a user submits the form without a name, **When** validation runs, **Then** an error message indicates the name is required
4. **Given** the API returns an error during creation, **When** the user sees the error, **Then** a clear error message is displayed and the form remains open for correction

---

### User Story 3 - Edit Topology (Priority: P1)

As a system administrator, I want to edit an existing Topology's details so that I can update its name, description, or tags.

**Why this priority**: Editing is essential for maintaining accurate Topology information.

**Independent Test**: Click edit on a Topology, modify fields, save, verify changes persist after page refresh.

**Acceptance Scenarios**:

1. **Given** a user clicks "Edit" on a Topology, **When** the modal opens, **Then** the form is pre-populated with the Topology's current values
2. **Given** a user modifies Topology fields, **When** they click "Save", **Then** the changes are saved via API and reflected in the list
3. **Given** another user modified the same Topology, **When** the current user saves, **Then** a version conflict error is displayed with option to refresh and retry

---

### User Story 4 - Delete Topology (Priority: P2)

As a system administrator, I want to delete a Topology group so that I can remove obsolete organizational structures.

**Why this priority**: Deletion is important but less frequent than viewing/creating/editing.

**Independent Test**: Click delete on a Topology, confirm in dialog, verify Topology is removed from list.

**Acceptance Scenarios**:

1. **Given** a user clicks "Delete" on a Topology, **When** the confirmation dialog appears, **Then** the Topology name is displayed and user must confirm
2. **Given** a user confirms deletion, **When** the API call succeeds, **Then** the Topology is removed from the list with a success message
3. **Given** the Topology has member resources, **When** it is deleted, **Then** member resources are NOT deleted, only the grouping relationship is removed

---

### User Story 5 - View Topology Details and Members (Priority: P1)

As a system administrator, I want to view a Topology's details including its member resources so that I can understand what resources belong to it.

**Why this priority**: Viewing members is essential for understanding and managing Topology contents.

**Independent Test**: Click on a Topology to enter detail view, verify member list displays with correct information.

**Acceptance Scenarios**:

1. **Given** a user clicks "Enter/Explore" on a Topology, **When** the detail view opens, **Then** the Topology's full details and paginated member list are displayed
2. **Given** a Topology has many members, **When** viewing the member list, **Then** pagination controls allow navigating through all members
3. **Given** a user views the member list, **When** they click on a member, **Then** they can navigate to that resource's detail page

---

### User Story 6 - Add Members to Topology (Priority: P1)

As a system administrator, I want to add resources as members of a Topology so that I can build the logical grouping.

**Why this priority**: Adding members is the primary way to populate a Topology with content.

**Independent Test**: Open a Topology, click "Add Members", select resources, confirm, verify members appear in list.

**Acceptance Scenarios**:

1. **Given** a user clicks "Add Members" in Topology detail view, **When** the selection dialog opens, **Then** a searchable list of available resources is displayed
2. **Given** a user selects one or more resources, **When** they confirm the selection, **Then** the resources are added as members via API and appear in the member list
3. **Given** a user tries to add a subgraph that would create a circular reference, **When** cycle detection is performed, **Then** an error message explains the cycle and prevents the action
4. **Given** the API returns an error, **When** adding members fails, **Then** a clear error message is displayed

---

### User Story 7 - Remove Members from Topology (Priority: P1)

As a system administrator, I want to remove resources from a Topology so that I can reorganize the grouping.

**Why this priority**: Removing members is essential for maintaining accurate Topology contents.

**Independent Test**: Open a Topology, click remove on a member, confirm, verify member is removed from list.

**Acceptance Scenarios**:

1. **Given** a user clicks "Remove" on a member in the member list, **When** the confirmation dialog appears, **Then** the member name is displayed for confirmation
2. **Given** a user confirms removal, **When** the API call succeeds, **Then** the member is removed from the list (but the resource itself is NOT deleted)
3. **Given** multiple members need to be removed, **When** the user selects multiple members and clicks "Remove Selected", **Then** all selected members are removed in a batch operation

---

### Edge Cases

- What happens when the Topologies list is empty? Display an empty state with guidance to create the first Topology
- What happens when searching returns no results? Display a "No results" message with option to clear the search
- What happens when a Topology has no members? Display an empty state with guidance to add members
- What happens when the backend API is unavailable? Display error states with retry options on all API-dependent views
- What happens when adding a member that already exists in the Topology? The API should handle duplicates gracefully
- What happens when removing the last member? The Topology remains with an empty member list

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch Topology list from backend API (Topologies are Resources with isSubgraph=true, use `/api/v1/resources/query` with filter)
- **FR-002**: System MUST support creating new Topologies via `/api/v1/resources/create` with isSubgraph=true attribute
- **FR-003**: System MUST support updating Topology details via `/api/v1/resources/update`
- **FR-004**: System MUST support deleting Topologies via `/api/v1/resources/delete`
- **FR-005**: System MUST display Topology list with pagination (8 items/page card view, 10 items/page list view)
- **FR-006**: System MUST support searching/filtering Topologies by name, description, and tags
- **FR-007**: System MUST fetch Topology members via `/api/v1/resources/members/query`
- **FR-008**: System MUST support adding members via `/api/v1/resources/members/add`
- **FR-009**: System MUST support removing members via `/api/v1/resources/members/remove`
- **FR-010**: System MUST perform cycle detection via `/api/v1/relationships/resource/cycle-detection` before adding subgraph members
- **FR-011**: System MUST display loading states during all API operations
- **FR-012**: System MUST display appropriate error messages when API operations fail
- **FR-013**: System MUST handle optimistic locking via version field for update operations
- **FR-014**: System MUST support both card view and list view modes for Topology list
- **FR-015**: System MUST provide real-time search filtering (client-side for loaded data, or debounced server-side)
- **FR-016**: System MUST refresh the Topology list after successful create/update/delete operations

### Key Entities

- **Topology (Subgraph)**: A special Resource with isSubgraph=true that can contain member resources. Has id, name, description, attributes (including tags), status, and version.
- **Member**: A resource that belongs to a Topology. Represented by SubgraphMember with memberId, memberName, memberTypeCode, memberStatus, addedAt.
- **Resource**: Any resource in the system that can be a member of a Topology.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view the Topology list within 2 seconds of page load for up to 100 Topologies
- **SC-002**: Users can successfully create a new Topology on the first attempt 95% of the time
- **SC-003**: Users can successfully add members to a Topology on the first attempt 95% of the time
- **SC-004**: Users can successfully remove members from a Topology on the first attempt 95% of the time
- **SC-005**: Search results update within 300ms of user input
- **SC-006**: All user actions provide immediate visual feedback (loading indicators, success/error messages)
- **SC-007**: System prevents circular references 100% of the time with clear error messaging

## Assumptions

- Topologies are implemented as Resources with `isSubgraph=true` attribute in the backend
- The existing Resource API endpoints (`/api/v1/resources/*`) support filtering by attributes like isSubgraph
- The topology member management APIs from spec 002 (`/api/v1/resources/members/*`) are available
- The existing TopologiesManagement.tsx component structure will be refactored to use API data instead of props-based mock data
- Authentication and operatorId injection are handled by the existing API client infrastructure

## Out of Scope

- Topology graph visualization (handled by spec 002)
- Relationship management between resources within a Topology (handled by spec 002)
- Breadcrumb navigation for nested subgraphs (handled by spec 002)
- Bulk import/export of Topologies
- Topology templates or cloning functionality
