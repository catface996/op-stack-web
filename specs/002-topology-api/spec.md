# Feature Specification: Topology Management API Integration

**Feature Branch**: `002-topology-api`
**Created**: 2025-12-25
**Status**: Clarified
**Input**: User description: "项目中的Topology管理部分，集成后端提供的api：http://localhost:8080/v3/api-docs"

## Overview

Integrate the frontend topology management module with the backend API services. The topology management allows users to visualize and manage IT resource relationships, subgraph hierarchies, and resource dependencies through an interactive graph interface.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Topology Graph (Priority: P1)

As a system administrator, I want to view a visual representation of resources and their relationships so that I can understand the system architecture at a glance.

**Why this priority**: This is the core functionality - without visualization, the topology feature provides no value.

**Independent Test**: Can be tested by opening a subgraph resource and verifying that nodes and edges render correctly with proper styling.

**Acceptance Scenarios**:

1. **Given** a user opens a subgraph resource detail page, **When** the topology tab is selected, **Then** the system displays an interactive graph with all member resources as nodes and their relationships as edges
2. **Given** a topology graph is displayed, **When** the user hovers over a node, **Then** the node is highlighted and basic resource information is shown
3. **Given** a topology graph contains nested subgraphs, **When** the user views the graph, **Then** nested subgraph boundaries are visually distinguished from regular nodes
4. **Given** a topology graph contains nested subgraphs, **When** the user single-clicks a subgraph node, **Then** the subgraph expands inline to show its member resources within the current view
5. **Given** a topology graph contains nested subgraphs, **When** the user double-clicks a subgraph node, **Then** the view navigates to that subgraph's dedicated topology view

**Clarifications**:
- **Nested subgraph interaction**: Both inline expansion (single-click) AND navigation to dedicated view (double-click) are supported

---

### User Story 2 - Manage Subgraph Members (Priority: P1)

As a system administrator, I want to add and remove resources from a subgraph so that I can organize resources into logical groups.

**Why this priority**: Member management is essential for building and maintaining topology structures.

**Independent Test**: Can be tested by adding a resource to a subgraph and verifying it appears in the member list and graph.

**Acceptance Scenarios**:

1. **Given** a user is viewing a subgraph, **When** they click "Add Members", **Then** a resource selection dialog appears showing available resources
2. **Given** a user selects resources to add, **When** they confirm the selection, **Then** the selected resources become members of the subgraph and appear in the topology
3. **Given** a user is viewing subgraph members, **When** they click "Remove" on a member, **Then** the resource is removed from the subgraph (but the resource itself is not deleted)
4. **Given** a user tries to add a subgraph that would create a circular reference, **When** they confirm, **Then** the system prevents the action and shows an error message

---

### User Story 3 - Manage Resource Relationships (Priority: P2)

As a system administrator, I want to create, view, and delete relationships between resources so that I can document dependencies and connections.

**Why this priority**: Relationships provide context and dependency information for the topology graph.

**Independent Test**: Can be tested by creating a relationship between two resources and verifying it appears as an edge in the graph.

**Clarifications**:
- **Relationship creation methods**: Both graph-based interaction (clicking node ports) AND a dedicated dialog form are supported
- **Supported relationship types**: DEPENDENCY, DATA_FLOW, API_CALL, DEPLOYMENT (4 standard types)

**Acceptance Scenarios**:

1. **Given** a user is viewing the topology graph, **When** they click on a node's connection port and then click another node's port, **Then** a dialog appears to configure the relationship properties (type, direction, strength)
2. **Given** a user is viewing the topology graph, **When** they select two nodes and click "Create Relationship", **Then** a dialog appears to configure the relationship properties
3. **Given** a user configures a relationship with type, direction, and strength, **When** they save, **Then** the relationship is created and displayed as an edge in the graph
4. **Given** a user right-clicks on a relationship edge, **When** they select "Delete", **Then** the relationship is removed after confirmation

---

### User Story 4 - Navigate Subgraph Hierarchy (Priority: P2)

As a system administrator, I want to navigate through nested subgraphs so that I can drill down into complex system architectures.

**Why this priority**: Navigation enables exploration of multi-level topologies.

**Independent Test**: Can be tested by double-clicking a nested subgraph node and verifying navigation to that subgraph's detail view.

**Acceptance Scenarios**:

1. **Given** a topology graph contains nested subgraphs, **When** the user double-clicks a subgraph node, **Then** the view navigates to that subgraph's topology
2. **Given** a user has navigated into a nested subgraph, **When** they view the breadcrumb/ancestor chain, **Then** they can see the full hierarchy path
3. **Given** a user is in a nested subgraph, **When** they click a parent in the breadcrumb, **Then** they navigate back to that ancestor's view

---

### User Story 5 - View Member List (Priority: P3)

As a system administrator, I want to view a paginated list of subgraph members so that I can manage large subgraphs efficiently.

**Why this priority**: List view provides an alternative way to manage members, especially for subgraphs with many resources.

**Independent Test**: Can be tested by viewing the members tab and verifying pagination works correctly.

**Clarifications**:
- **View modes**: Both card view and list view are supported
- **Default page size**: 8 items per page in card mode, 10 items per page in list mode

**Acceptance Scenarios**:

1. **Given** a subgraph has many members, **When** the user opens the members view in card mode, **Then** the list is paginated with 8 items per page
2. **Given** a subgraph has many members, **When** the user opens the members view in list mode, **Then** the list is paginated with 10 items per page
3. **Given** a user is viewing the members list, **When** they click on a member, **Then** they can view the member's details or navigate to it
4. **Given** a user is viewing members, **When** they toggle between card and list view, **Then** the view switches accordingly with appropriate page size

---

### Edge Cases

- What happens when a subgraph has no members? Display an empty state with guidance to add members
- What happens when a relationship's source or target resource is deleted? The relationship should be automatically removed
- What happens when the backend API is unavailable? Display an error state with retry option
- What happens when adding a member creates a circular subgraph reference? Prevent the action with a clear error message
- What happens when the topology graph has too many nodes? Implement pagination or filtering for large topologies

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch and display topology graph data from `/api/v1/resources/topology/query` endpoint
- **FR-002**: System MUST support adding members to subgraphs via `/api/v1/resources/members/add` endpoint
- **FR-003**: System MUST support removing members from subgraphs via `/api/v1/resources/members/remove` endpoint
- **FR-004**: System MUST display paginated member lists via `/api/v1/resources/members/query` endpoint
- **FR-005**: System MUST fetch members with their relationships via `/api/v1/resources/members-with-relations/query` endpoint
- **FR-006**: System MUST display ancestor breadcrumb navigation via `/api/v1/resources/ancestors/query` endpoint
- **FR-007**: System MUST support creating relationships via `/api/v1/relationships/create` endpoint
- **FR-008**: System MUST support updating relationships via `/api/v1/relationships/update` endpoint
- **FR-009**: System MUST support deleting relationships via `/api/v1/relationships/delete` endpoint
- **FR-010**: System MUST support querying resource relationships via `/api/v1/relationships/resource/query` endpoint
- **FR-011**: System MUST handle cycle detection results from `/api/v1/relationships/resource/cycle-detection` endpoint
- **FR-012**: System MUST render nodes with appropriate icons based on resource type
- **FR-013**: System MUST render edges with visual indicators for relationship type, direction, and strength
- **FR-014**: System MUST visually distinguish subgraph boundaries from regular nodes
- **FR-015**: System MUST handle optimistic locking via version field in update operations
- **FR-016**: System MUST display loading states during API operations
- **FR-017**: System MUST display appropriate error messages when API operations fail

### Key Entities

- **TopologyNode**: Represents a resource in the graph with id, name, typeCode, status, and whether it's a subgraph
- **TopologyEdge**: Represents a relationship between resources with sourceId, targetId, relationshipType, direction, and strength
- **SubgraphBoundary**: Defines the visual boundary of a nested subgraph with memberIds
- **SubgraphMember**: A resource that belongs to a subgraph with membership metadata
- **Relationship**: A connection between two resources with type (DEPENDENCY, DATA_FLOW, API_CALL, DEPLOYMENT), direction, strength, and status

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view a complete topology graph within 3 seconds for subgraphs with up to 100 members
- **SC-002**: Users can successfully add resources to a subgraph on the first attempt 95% of the time
- **SC-003**: Users can successfully remove resources from a subgraph on the first attempt 95% of the time
- **SC-004**: Users can create relationships between resources within 30 seconds
- **SC-005**: Users can navigate the subgraph hierarchy with clear breadcrumb trail
- **SC-006**: System prevents circular subgraph references with clear error messaging
- **SC-007**: All topology operations provide visual feedback (loading, success, error states)

## Assumptions

- The existing topology visualization component (TopologyGraph.tsx) will be adapted to use real API data
- The backend API at localhost:8080 follows the OpenAPI 3.0 specification provided
- Resource types are predefined and retrieved via `/api/v1/resource-types/query`
- Authentication tokens are handled by the existing API client infrastructure
- The operatorId is automatically injected in development mode (as implemented in FR-001 resource API integration)

## Out of Scope

- Graph layout algorithms (will use existing implementation)
- Real-time updates/WebSocket integration
- Bulk import/export of topology data
- Graph search functionality
- Topology comparison between different versions
