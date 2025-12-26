# Feature Specification: Backend API Reintegration

**Feature Branch**: `005-api-reintegration`
**Created**: 2025-12-26
**Status**: Draft
**Input**: User description: "后端关于资源管理和拓扑管理的接口有变化，已经变更为拓扑图管理和资源节点管理，分析相关API，重新集成后端API，只是重新集成API，不要做任何交互上的改动"

## Overview

The backend API has been restructured to separate concerns more clearly:

1. **Topology Management** (`/api/v1/topologies/*`) - Manages topology graphs as first-class entities
2. **Resource Node Management** (`/api/v1/nodes/*`) - New dedicated endpoints for resource nodes
3. **Resource Management** (`/api/v1/resources/*`) - Still exists but some member management APIs are deprecated in favor of topology endpoints

Key changes:
- New `NodeDTO` entity type separate from `ResourceDTO`
- New node type query endpoint (`/api/v1/nodes/types/query`)
- Topology member management now uses `/api/v1/topologies/members/*` endpoints (replaces deprecated `/api/v1/resources/members/*`)
- New `coordinatorAgentId` field in topology requests
- New `agentTeamId` field in node requests
- New `topologyId` filter parameter in nodes query

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Topology CRUD Operations (Priority: P1)

As a user, I can manage topologies through the new dedicated topology API endpoints, ensuring all CRUD operations work with the updated backend.

**Why this priority**: Core functionality - topology management is a primary feature of the application.

**Independent Test**: Create a new topology, view it in the list, update its name, delete it - all operations should succeed without UI changes.

**Acceptance Scenarios**:

1. **Given** the Topologies page is loaded, **When** the API call completes, **Then** topologies are fetched via `POST /api/v1/topologies/query` with correct request format
2. **Given** a user creates a new topology, **When** the form is submitted, **Then** the topology is created via `POST /api/v1/topologies/create` with `operatorId`, `name`, and optional `description`
3. **Given** a user updates a topology, **When** the form is submitted, **Then** the update is sent via `POST /api/v1/topologies/update` with `operatorId`, `id`, `version`, and optional fields
4. **Given** a user deletes a topology, **When** confirmed, **Then** the delete is sent via `POST /api/v1/topologies/delete` with `operatorId` and `id`

---

### User Story 2 - Topology Member Management (Priority: P1)

As a user, I can add and remove members from topologies using the new dedicated member management endpoints.

**Why this priority**: Member management is essential for topology organization and is frequently used.

**Independent Test**: Add a node to a topology, verify it appears in members list, remove it, verify it's removed.

**Acceptance Scenarios**:

1. **Given** a topology detail view is open, **When** members are loaded, **Then** they are fetched via `POST /api/v1/topologies/members/query` with `topologyId` (not `resourceId`)
2. **Given** a user adds members, **When** confirmed, **Then** members are added via `POST /api/v1/topologies/members/add` with `topologyId` and `memberIds`
3. **Given** a user removes members, **When** confirmed, **Then** members are removed via `POST /api/v1/topologies/members/remove` with `topologyId` and `memberIds`

---

### User Story 3 - Resource Node CRUD Operations (Priority: P1)

As a user, I can manage resource nodes through the new dedicated node API endpoints.

**Why this priority**: Resource node management is a core feature that has new dedicated endpoints.

**Independent Test**: Create a new node, view it in the list, update its name, delete it - all operations should succeed.

**Acceptance Scenarios**:

1. **Given** the Resources page is loaded, **When** the API call completes, **Then** nodes are fetched via `POST /api/v1/nodes/query` with pagination and filter parameters
2. **Given** a user creates a new node, **When** the form is submitted, **Then** the node is created via `POST /api/v1/nodes/create` with `operatorId`, `name`, `nodeTypeId`, and optional fields
3. **Given** a user updates a node, **When** the form is submitted, **Then** the update is sent via `POST /api/v1/nodes/update` with `operatorId`, `id`, `version`, and optional fields
4. **Given** a user deletes a node, **When** confirmed, **Then** the delete is sent via `POST /api/v1/nodes/delete` with `operatorId` and `id`

---

### User Story 4 - Node Type Query (Priority: P2)

As a user, I can see available node types when creating or filtering nodes using the new node types endpoint.

**Why this priority**: Required for node creation and filtering, but secondary to core CRUD operations.

**Independent Test**: Open create node form, verify node types dropdown is populated from API.

**Acceptance Scenarios**:

1. **Given** the node creation form is opened, **When** loading types, **Then** types are fetched via `POST /api/v1/nodes/types/query`
2. **Given** the node type list is loaded, **When** displayed, **Then** each type shows `id`, `code`, `name`, `description`, and `icon`

---

### User Story 5 - Query Nodes by Topology (Priority: P2)

As a user, I can filter nodes by topology using the new `topologyId` parameter.

**Why this priority**: Useful feature for filtering, but not blocking for basic functionality.

**Independent Test**: Select a topology filter, verify only nodes belonging to that topology are shown.

**Acceptance Scenarios**:

1. **Given** a topology filter is selected, **When** nodes are queried, **Then** the request includes `topologyId` parameter
2. **Given** nodes are filtered by topology, **When** results are returned, **Then** only nodes belonging to that topology are displayed

---

### Edge Cases

- What happens when using deprecated `/api/v1/resources/members/*` endpoints? They should be replaced with `/api/v1/topologies/members/*` endpoints.
- How to handle `operatorId` requirement? Use a default value (e.g., 1) for now until authentication is implemented.
- What if `version` is missing during update? Fetch current version before update or display conflict error.
- How to handle node deletion that is part of a topology? The API will also remove topology membership.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use `/api/v1/topologies/query` for listing topologies with `operatorId` parameter
- **FR-002**: System MUST use `/api/v1/topologies/create` for creating topologies with `operatorId`, `name`, and optional `description`
- **FR-003**: System MUST use `/api/v1/topologies/get` for fetching topology details with `id` parameter
- **FR-004**: System MUST use `/api/v1/topologies/update` for updating topologies with `operatorId`, `id`, `version`, and optional fields
- **FR-005**: System MUST use `/api/v1/topologies/delete` for deleting topologies with `operatorId` and `id`
- **FR-006**: System MUST use `/api/v1/topologies/members/query` for querying topology members (replaces deprecated `/api/v1/resources/members/query`)
- **FR-007**: System MUST use `/api/v1/topologies/members/add` for adding members to topologies (replaces deprecated `/api/v1/resources/members/add`)
- **FR-008**: System MUST use `/api/v1/topologies/members/remove` for removing members from topologies (replaces deprecated `/api/v1/resources/members/remove`)
- **FR-009**: System MUST use `/api/v1/nodes/query` for listing resource nodes with `nodeTypeId`, `status`, `keyword`, `topologyId`, `page`, `size` parameters
- **FR-010**: System MUST use `/api/v1/nodes/create` for creating nodes with `operatorId`, `name`, `nodeTypeId`, and optional `description`, `agentTeamId`, `attributes`
- **FR-011**: System MUST use `/api/v1/nodes/get` for fetching node details with `id` parameter
- **FR-012**: System MUST use `/api/v1/nodes/update` for updating nodes with `operatorId`, `id`, `version`, and optional fields
- **FR-013**: System MUST use `/api/v1/nodes/delete` for deleting nodes with `operatorId` and `id`
- **FR-014**: System MUST use `/api/v1/nodes/types/query` for fetching available node types
- **FR-015**: System MUST update all type definitions to match new API schemas
- **FR-016**: System MUST preserve all existing UI interactions and visual behavior

### API Endpoint Mapping

| Operation | Old Endpoint | New Endpoint | Notes |
|-----------|--------------|--------------|-------|
| List Topologies | `/api/v1/topologies/query` | `/api/v1/topologies/query` | Add `operatorId` |
| Create Topology | `/api/v1/topologies/create` | `/api/v1/topologies/create` | Add `operatorId` |
| Get Topology | `/api/v1/topologies/get` | `/api/v1/topologies/get` | Remove `operatorId` from request |
| Update Topology | `/api/v1/topologies/update` | `/api/v1/topologies/update` | Add `coordinatorAgentId` support |
| Delete Topology | `/api/v1/topologies/delete` | `/api/v1/topologies/delete` | Keep same |
| Query Members | `/api/v1/resources/members/query` | `/api/v1/topologies/members/query` | Use `topologyId` instead of `resourceId` |
| Add Members | `/api/v1/resources/members/add` | `/api/v1/topologies/members/add` | Use `topologyId` instead of `resourceId` |
| Remove Members | `/api/v1/resources/members/remove` | `/api/v1/topologies/members/remove` | Use `topologyId` instead of `resourceId` |
| List Resources | `/api/v1/resources/query` | `/api/v1/nodes/query` | New node API |
| Create Resource | `/api/v1/resources/create` | `/api/v1/nodes/create` | New node API |
| Get Resource | `/api/v1/resources/get` | `/api/v1/nodes/get` | New node API |
| Update Resource | `/api/v1/resources/update` | `/api/v1/nodes/update` | New node API |
| Delete Resource | `/api/v1/resources/delete` | `/api/v1/nodes/delete` | New node API, no confirmName needed |
| Resource Types | `/api/v1/resource-types/query` | `/api/v1/nodes/types/query` | New node types endpoint |

### Key Entities

- **TopologyDTO**: Updated topology entity
  - `id`: number - Topology ID
  - `name`: string - Topology name (max 100 chars)
  - `description`: string | null - Description (max 500 chars)
  - `status`: ResourceStatus - Status (RUNNING/STOPPED/MAINTENANCE/OFFLINE)
  - `statusDisplay`: string - Localized status display name
  - `coordinatorAgentId`: number | null - Coordinator Agent ID (NEW)
  - `attributes`: string | null - Extended attributes (JSON)
  - `memberCount`: number - Count of members
  - `version`: number - Version for optimistic locking
  - `createdBy`: number - Creator user ID
  - `createdAt`: string - Creation timestamp
  - `updatedAt`: string - Update timestamp

- **NodeDTO**: New resource node entity
  - `id`: number - Node ID
  - `name`: string - Node name (max 100 chars)
  - `description`: string | null - Description (max 500 chars)
  - `nodeTypeId`: number - Node type ID
  - `nodeTypeName`: string - Node type name
  - `nodeTypeCode`: string - Node type code
  - `status`: ResourceStatus - Status
  - `statusDisplay`: string - Localized status display name
  - `agentTeamId`: number | null - Agent Team ID (NEW)
  - `attributes`: string | null - Extended attributes (JSON)
  - `version`: number - Version for optimistic locking
  - `createdBy`: number - Creator user ID
  - `createdAt`: string - Creation timestamp
  - `updatedAt`: string - Update timestamp

- **NodeTypeDTO**: Node type definition
  - `id`: number - Type ID
  - `code`: string - Type code (e.g., "SERVER")
  - `name`: string - Type name (e.g., "服务器")
  - `description`: string | null - Type description
  - `icon`: string | null - Icon identifier
  - `createdAt`: string - Creation timestamp
  - `updatedAt`: string - Update timestamp

### Request Types Changes

- **QueryTopologiesRequest**: `operatorId` (required), `name`, `status`, `page`, `size`
- **CreateTopologyRequest**: `operatorId` (required), `name` (required), `description`
- **GetTopologyRequest**: `id` (required) - Note: no `operatorId` needed
- **UpdateTopologyRequest**: `operatorId` (required), `id` (required), `name`, `description`, `coordinatorAgentId`, `version` (required)
- **DeleteTopologyRequest**: `operatorId` (required), `id` (required)

- **QueryMembersRequest**: `topologyId` (required), `page`, `size`
- **AddMembersRequest**: `topologyId` (required), `memberIds` (required)
- **RemoveMembersRequest**: `topologyId` (required), `memberIds` (required)

- **QueryNodesRequest**: `nodeTypeId`, `status`, `keyword`, `topologyId`, `page`, `size`
- **CreateNodeRequest**: `operatorId` (required), `name` (required), `nodeTypeId` (required), `description`, `agentTeamId`, `attributes`
- **GetNodeRequest**: `id` (required)
- **UpdateNodeRequest**: `operatorId` (required), `id` (required), `name`, `description`, `agentTeamId`, `attributes`, `version` (required)
- **DeleteNodeRequest**: `operatorId` (required), `id` (required)

## Scope

### In Scope

- Update TypeScript type definitions for new API schemas
- Update topology API service to use correct endpoints and request formats
- Create new node API service for resource node operations
- Update hooks to use new API services
- Migrate from deprecated `/api/v1/resources/members/*` to `/api/v1/topologies/members/*`
- Remove client-side workarounds for old API structure

### Out of Scope

- Any UI changes or new features
- Authentication implementation (use hardcoded `operatorId: 1` for now)
- New Coordinator Agent integration
- New Agent Team integration
- Relationship management API changes (keep as-is)
- Resource audit logs (keep using existing `/api/v1/resources/audit-logs/query`)
- Resource status update (keep using existing `/api/v1/resources/update-status`)

## Assumptions

- `operatorId` will be set to `1` as a placeholder until authentication is implemented
- Node types returned from `/api/v1/nodes/types/query` are similar in structure to resource types
- Existing icon mapping logic can be reused for node types
- The deprecated resource member APIs will still work but should be migrated
- Resource audit logs and status update endpoints remain unchanged

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All topology CRUD operations use the new API endpoints correctly
- **SC-002**: All topology member operations use `/api/v1/topologies/members/*` endpoints
- **SC-003**: All node CRUD operations use the new `/api/v1/nodes/*` endpoints
- **SC-004**: Node types are fetched from `/api/v1/nodes/types/query`
- **SC-005**: All existing UI functionality continues to work without visible changes
- **SC-006**: No deprecated API endpoints are called from the application
- **SC-007**: TypeScript types match the actual API response schemas
