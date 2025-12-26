# Data Model: Backend API Reintegration

**Feature**: 005-api-reintegration
**Date**: 2025-12-26

## Entity Definitions

### TopologyDTO (Updated)

Represents a topology graph that contains resource nodes.

```typescript
interface TopologyDTO {
  id: number;                       // Topology unique identifier
  name: string;                     // Name (max 100 chars)
  description: string | null;       // Description (max 500 chars)
  status: ResourceStatus;           // RUNNING | STOPPED | MAINTENANCE | OFFLINE
  statusDisplay: string;            // Localized status display
  coordinatorAgentId: number | null; // NEW: Coordinator Agent ID
  attributes: string | null;        // Extended attributes (JSON)
  memberCount: number;              // Count of member nodes
  version: number;                  // Optimistic lock version
  createdBy: number;                // Creator user ID
  createdAt: string;                // ISO 8601 timestamp
  updatedAt: string;                // ISO 8601 timestamp
}
```

**Relationships**:
- Has many `NodeDTO` through topology membership
- References optional `CoordinatorAgent` (not implemented in this feature)

**State Transitions**:
- RUNNING ↔ STOPPED ↔ MAINTENANCE ↔ OFFLINE

### NodeDTO (NEW)

Represents a resource node in the system.

```typescript
interface NodeDTO {
  id: number;                       // Node unique identifier
  name: string;                     // Name (max 100 chars)
  description: string | null;       // Description (max 500 chars)
  nodeTypeId: number;               // Reference to NodeTypeDTO
  nodeTypeName: string;             // Denormalized type name
  nodeTypeCode: string;             // Denormalized type code
  status: ResourceStatus;           // RUNNING | STOPPED | MAINTENANCE | OFFLINE
  statusDisplay: string;            // Localized status display
  agentTeamId: number | null;       // NEW: Agent Team ID
  attributes: string | null;        // Extended attributes (JSON)
  version: number;                  // Optimistic lock version
  createdBy: number;                // Creator user ID
  createdAt: string;                // ISO 8601 timestamp
  updatedAt: string;                // ISO 8601 timestamp
}
```

**Relationships**:
- Belongs to `NodeTypeDTO`
- Can be member of many `TopologyDTO`
- References optional `AgentTeam` (not implemented in this feature)

**Validation Rules**:
- `name`: Required, 1-100 characters
- `nodeTypeId`: Required, must exist in node types
- `description`: Optional, max 500 characters
- `attributes`: Optional, valid JSON string

### NodeTypeDTO (NEW)

Defines available node types.

```typescript
interface NodeTypeDTO {
  id: number;                       // Type unique identifier
  code: string;                     // Type code (e.g., "SERVER")
  name: string;                     // Display name (e.g., "服务器")
  description: string | null;       // Type description
  icon: string | null;              // Icon identifier
  createdAt: string;                // ISO 8601 timestamp
  updatedAt: string;                // ISO 8601 timestamp
}
```

**Notes**:
- Similar to existing `ResourceTypeDTO`
- System-managed, not user-editable

### TopologyMemberDTO (Updated)

Represents node membership in a topology.

```typescript
interface TopologyMemberDTO {
  id: number;                       // Membership ID
  topologyId: number;               // Parent topology (was subgraphId)
  memberId: number;                 // Member node ID
  memberName: string;               // Denormalized node name
  memberTypeCode: string;           // Denormalized node type
  memberStatus: ResourceStatus;     // Denormalized node status
  addedAt: string;                  // When added
  addedBy: number;                  // Who added
}
```

**Changes from TopologyMember**:
- `subgraphId` renamed to `topologyId` for clarity

## Request Types

### Topology Requests

```typescript
// Query topologies
interface QueryTopologiesRequest {
  operatorId: number;               // Required
  name?: string;                    // Fuzzy search
  status?: ResourceStatus;          // Filter by status
  page?: number;                    // Default 1
  size?: number;                    // Default 10, max 100
}

// Create topology
interface CreateTopologyRequest {
  operatorId: number;               // Required
  name: string;                     // Required, max 100 chars
  description?: string;             // Optional, max 500 chars
}

// Get topology
interface GetTopologyRequest {
  id: number;                       // Required
}

// Update topology
interface UpdateTopologyRequest {
  operatorId: number;               // Required
  id: number;                       // Required
  name?: string;                    // Optional update
  description?: string;             // Optional update
  coordinatorAgentId?: number;      // Optional, NEW field
  version: number;                  // Required for optimistic lock
}

// Delete topology
interface DeleteTopologyRequest {
  operatorId: number;               // Required
  id: number;                       // Required
}
```

### Member Requests

```typescript
// Query members
interface QueryMembersRequest {
  topologyId: number;               // Required (was resourceId)
  page?: number;                    // Default 1
  size?: number;                    // Default 10
}

// Add members
interface AddMembersRequest {
  topologyId: number;               // Required (was resourceId)
  memberIds: number[];              // Required, array of node IDs
}

// Remove members
interface RemoveMembersRequest {
  topologyId: number;               // Required (was resourceId)
  memberIds: number[];              // Required, array of node IDs
}
```

### Node Requests

```typescript
// Query nodes
interface QueryNodesRequest {
  nodeTypeId?: number;              // Filter by type
  status?: ResourceStatus;          // Filter by status
  keyword?: string;                 // Search name/description
  topologyId?: number;              // Filter by topology membership
  page?: number;                    // Default 1
  size?: number;                    // Default 10, max 100
}

// Create node
interface CreateNodeRequest {
  operatorId: number;               // Required
  name: string;                     // Required, max 100 chars
  description?: string;             // Optional, max 500 chars
  nodeTypeId: number;               // Required
  agentTeamId?: number;             // Optional
  attributes?: string;              // Optional, JSON string
}

// Get node
interface GetNodeRequest {
  id: number;                       // Required
}

// Update node
interface UpdateNodeRequest {
  operatorId: number;               // Required
  id: number;                       // Required
  name?: string;                    // Optional update
  description?: string;             // Optional update
  agentTeamId?: number;             // Optional update
  attributes?: string;              // Optional update
  version: number;                  // Required for optimistic lock
}

// Delete node
interface DeleteNodeRequest {
  operatorId: number;               // Required
  id: number;                       // Required
}
```

## Response Types

### Paginated Response

```typescript
interface PageResult<T> {
  content: T[];                     // Data items
  page: number;                     // Current page (1-based)
  size: number;                     // Page size
  totalElements: number;            // Total count
  totalPages: number;               // Total pages
  first: boolean;                   // Is first page
  last: boolean;                    // Is last page
}
```

### API Response Wrapper

```typescript
interface ApiResponse<T> {
  code: number;                     // HTTP-like status code
  message: string;                  // Status message
  data: T;                          // Response payload
  success: boolean;                 // Success flag
}
```

## Type Compatibility

### Backward Compatibility Strategy

To maintain backward compatibility with existing components:

```typescript
// Alias for gradual migration
type ResourceDTO = NodeDTO;
type ResourceTypeDTO = NodeTypeDTO;

// Or create adapter function
function nodeToResource(node: NodeDTO): ResourceDTO {
  return {
    ...node,
    resourceTypeId: node.nodeTypeId,
    resourceTypeName: node.nodeTypeName,
    resourceTypeCode: node.nodeTypeCode,
  };
}
```

### Icon Mapping

Existing icon mapping logic can be reused with `nodeTypeCode`:

```typescript
// Existing function works with nodeTypeCode
function getResourceTypeIcon(typeCode: string | undefined | null, resourceName?: string): ResourceIcon;
```

## Shared Enums

```typescript
type ResourceStatus = 'RUNNING' | 'STOPPED' | 'MAINTENANCE' | 'OFFLINE';
```

Status is shared across TopologyDTO, NodeDTO, and all related entities.
