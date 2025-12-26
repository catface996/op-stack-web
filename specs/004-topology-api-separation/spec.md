# Feature Specification: Topology API Separation

**Feature Branch**: `004-topology-api-separation`
**Created**: 2025-12-26
**Status**: Draft
**Input**: Backend API changes at http://localhost:8080/v3/api-docs - separate topology management endpoints

## Overview

The backend has introduced a dedicated **Topology Management API** (`/api/v1/topologies/*`) that separates topology (subgraph) entities from regular resources. This provides:

1. **Dedicated TopologyDTO** - A simplified DTO with `memberCount` field (no need to parse `isSubgraph` from attributes)
2. **Automatic filtering** - Resources API now automatically excludes SUBGRAPH type entries
3. **Cleaner separation** - Topologies are first-class entities with their own CRUD endpoints

The frontend needs to be updated to use these new dedicated endpoints instead of filtering resources by `isSubgraph` attribute.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Topology List (Priority: P1)

Users can view a list of topologies using the dedicated topology API endpoint, which returns TopologyDTO with memberCount directly.

**Why this priority**: Core functionality - without this, the topology list page won't display data from the new API.

**Independent Test**: Navigate to Topologies page, verify list loads with topology names and member counts displayed correctly.

**Acceptance Scenarios**:

1. **Given** the Topologies page is loaded, **When** the API call completes, **Then** topologies are displayed with name, description, status, and member count
2. **Given** a topology exists with 5 members, **When** viewing the list, **Then** the member count shows "5 members" without needing to parse attributes

---

### User Story 2 - Create Topology via New API (Priority: P1)

Users can create new topologies using the dedicated `/api/v1/topologies/create` endpoint.

**Why this priority**: Essential CRUD operation for topology management.

**Independent Test**: Click "Create Topology", fill in name and description, submit, verify new topology appears in list.

**Acceptance Scenarios**:

1. **Given** the create dialog is open, **When** user enters name and description and submits, **Then** the topology is created via POST to `/api/v1/topologies/create`
2. **Given** a duplicate name is entered, **When** submitted, **Then** a 409 conflict error is displayed

---

### User Story 3 - Update Topology via New API (Priority: P1)

Users can edit topology details using the dedicated `/api/v1/topologies/update` endpoint with optimistic locking.

**Why this priority**: Essential CRUD operation for topology management.

**Independent Test**: Click edit on a topology, change name, save, verify changes persist.

**Acceptance Scenarios**:

1. **Given** the edit dialog is open, **When** user modifies name and saves, **Then** the update is sent via POST to `/api/v1/topologies/update` with version field
2. **Given** another user modified the topology, **When** saving, **Then** a 409 version conflict error is displayed with refresh option

---

### User Story 4 - Delete Topology via New API (Priority: P2)

Users can delete topologies using the dedicated `/api/v1/topologies/delete` endpoint.

**Why this priority**: Important but less frequently used than view/create/update.

**Independent Test**: Click delete on a topology, confirm in dialog, verify topology is removed.

**Acceptance Scenarios**:

1. **Given** the delete confirmation is shown, **When** user confirms, **Then** the delete is sent via POST to `/api/v1/topologies/delete`
2. **Given** deletion succeeds, **When** returning to list, **Then** the deleted topology no longer appears

---

### User Story 5 - View Topology Details via New API (Priority: P1)

Users can view topology details using the dedicated `/api/v1/topologies/get` endpoint.

**Why this priority**: Required for the detail view which shows topology info and member management.

**Independent Test**: Click on a topology to open detail view, verify all fields display correctly.

**Acceptance Scenarios**:

1. **Given** a topology ID is selected, **When** the detail view loads, **Then** topology data is fetched via POST to `/api/v1/topologies/get`
2. **Given** the topology has attributes JSON, **When** displayed, **Then** tags and other metadata are correctly parsed and shown

---

### Edge Cases

- What happens when a topology is deleted by another user while viewing? Display error and redirect to list.
- How does the system handle network failures? Show error state with retry button.
- What if memberCount is null? Default to 0 or "Unknown".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use `/api/v1/topologies/query` for listing topologies instead of filtering `/api/v1/resources/query`
- **FR-002**: System MUST use `/api/v1/topologies/create` for creating new topologies
- **FR-003**: System MUST use `/api/v1/topologies/update` for updating topologies with version field for optimistic locking
- **FR-004**: System MUST use `/api/v1/topologies/delete` for deleting topologies
- **FR-005**: System MUST use `/api/v1/topologies/get` for fetching single topology details
- **FR-006**: System MUST use `TopologyDTO.memberCount` instead of parsing `isSubgraph` from attributes
- **FR-007**: System MUST remove client-side filtering logic that filters by `isSubgraph` attribute
- **FR-008**: System MUST update type definitions to include new TopologyDTO schema
- **FR-009**: Deprecated member management endpoints under `/api/v1/resources/members/*` SHOULD be migrated to `/api/v1/topologies/members/*` (if available)

### API Endpoint Mapping

| Operation | Old Endpoint | New Endpoint |
|-----------|--------------|--------------|
| List | `/api/v1/resources/query` + filter | `/api/v1/topologies/query` |
| Create | `/api/v1/resources/create` | `/api/v1/topologies/create` |
| Get | `/api/v1/resources/get` | `/api/v1/topologies/get` |
| Update | `/api/v1/resources/update` | `/api/v1/topologies/update` |
| Delete | `/api/v1/resources/delete` | `/api/v1/topologies/delete` |

### Key Entities

- **TopologyDTO**: Represents a topology/subgraph with fields:
  - `id`: number - Topology ID
  - `name`: string - Topology name
  - `description`: string - Topology description
  - `status`: string - Status (RUNNING/STOPPED/MAINTENANCE/OFFLINE)
  - `statusDisplay`: string - Localized status display name
  - `attributes`: string - Extended attributes (JSON)
  - `memberCount`: number - Count of members in this topology
  - `version`: number - Version for optimistic locking
  - `createdBy`: number - Creator user ID
  - `createdAt`: string - Creation timestamp
  - `updatedAt`: string - Update timestamp

- **CreateTopologyRequest**: Request for creating topology
  - `operatorId`: number (required)
  - `name`: string (required, max 100 chars)
  - `description`: string (optional, max 500 chars)

- **UpdateTopologyRequest**: Request for updating topology
  - `operatorId`: number (required)
  - `id`: number (required)
  - `name`: string (optional)
  - `description`: string (optional)
  - `version`: number (required - optimistic locking)

- **QueryTopologiesRequest**: Request for listing topologies
  - `operatorId`: number (required)
  - `name`: string (optional - fuzzy search)
  - `status`: string (optional - filter)
  - `page`: number (default 1)
  - `size`: number (default 10, max 100)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All topology CRUD operations use the new `/api/v1/topologies/*` endpoints
- **SC-002**: No client-side filtering of resources by `isSubgraph` attribute remains
- **SC-003**: TopologyDTO.memberCount is displayed in the UI instead of calculated from attributes
- **SC-004**: Version conflicts (409 errors) are properly handled with user feedback
- **SC-005**: All existing topology management functionality continues to work after migration

## Technical Notes

### Files to Modify

1. **services/api/types.ts** - Add TopologyDTO and request/response types
2. **services/api/topology.ts** - Add new topology CRUD API methods
3. **services/hooks/useTopologies.ts** - Update to use new query endpoint
4. **services/hooks/useTopologyMutations.ts** - Update to use new CRUD endpoints
5. **components/TopologiesManagement.tsx** - Update to use new TopologyDTO type
6. **components/topology/TopologyDetailView.tsx** - Update to use topologyApi.get()

### Migration Strategy

1. Add new types alongside existing types (non-breaking)
2. Add new API methods to topology.ts
3. Update hooks to use new endpoints
4. Remove old filtering logic
5. Update component type references
