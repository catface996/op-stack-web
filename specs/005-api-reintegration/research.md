# Research: Backend API Reintegration

**Feature**: 005-api-reintegration
**Date**: 2025-12-26

## API Analysis

### 1. Topology Management API Changes

**Decision**: Use new `/api/v1/topologies/*` endpoints for all topology operations including member management.

**Rationale**:
- Backend has consolidated topology operations under dedicated endpoints
- Member management endpoints under `/api/v1/resources/members/*` are now deprecated
- New endpoints provide cleaner separation of concerns

**Current vs New Endpoint Mapping**:

| Operation | Current | New | Notes |
|-----------|---------|-----|-------|
| Query Topologies | `/api/v1/topologies/query` | `/api/v1/topologies/query` | Same endpoint |
| Create Topology | `/api/v1/topologies/create` | `/api/v1/topologies/create` | Same endpoint |
| Get Topology | `/api/v1/topologies/get` | `/api/v1/topologies/get` | Same endpoint |
| Update Topology | `/api/v1/topologies/update` | `/api/v1/topologies/update` | Add `coordinatorAgentId` |
| Delete Topology | `/api/v1/topologies/delete` | `/api/v1/topologies/delete` | Same endpoint |
| Query Members | `/api/v1/resources/members/query` | `/api/v1/topologies/members/query` | **MIGRATE** |
| Add Members | `/api/v1/resources/members/add` | `/api/v1/topologies/members/add` | **MIGRATE** |
| Remove Members | `/api/v1/resources/members/remove` | `/api/v1/topologies/members/remove` | **MIGRATE** |

**Key Changes**:
- Member operations now use `topologyId` parameter instead of `resourceId`
- New optional `coordinatorAgentId` field in TopologyDTO and update requests
- Request format remains similar with `operatorId` required

### 2. Resource Node Management API (NEW)

**Decision**: Create new `nodes.ts` API service for resource node operations, migrate from `resources.ts`.

**Rationale**:
- Backend introduces dedicated `/api/v1/nodes/*` endpoints
- Node entity is now separate from Resource entity
- Provides cleaner type definitions and API contracts

**New Endpoints**:

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| Query Nodes | `POST /api/v1/nodes/query` | Replaces `/api/v1/resources/query` |
| Create Node | `POST /api/v1/nodes/create` | Replaces `/api/v1/resources/create` |
| Get Node | `POST /api/v1/nodes/get` | Replaces `/api/v1/resources/get` |
| Update Node | `POST /api/v1/nodes/update` | Replaces `/api/v1/resources/update` |
| Delete Node | `POST /api/v1/nodes/delete` | Replaces `/api/v1/resources/delete` |
| Query Node Types | `POST /api/v1/nodes/types/query` | Replaces `/api/v1/resource-types/query` |

**Key Differences from Resource API**:
- Uses `nodeTypeId` instead of `resourceTypeId`
- New `agentTeamId` field for node assignment
- New `topologyId` filter parameter in query
- Delete endpoint does NOT require `confirmName` - simpler deletion

### 3. Request Type Changes

**Decision**: Add `operatorId` to all mutation requests as required by backend.

**Rationale**: Backend requires operator tracking for audit trail.

**Implementation**: Use hardcoded `operatorId: 1` until authentication is implemented.

**Affected Request Types**:

```typescript
// Topology requests - add operatorId
QueryTopologiesRequest { operatorId: number, ... }
CreateTopologyRequest { operatorId: number, name: string, description?: string }
UpdateTopologyRequest { operatorId: number, id: number, version: number, ... }
DeleteTopologyRequest { operatorId: number, id: number }

// Member requests - change resourceId to topologyId
QueryMembersRequest { topologyId: number, page?: number, size?: number }
AddMembersRequest { topologyId: number, memberIds: number[] }
RemoveMembersRequest { topologyId: number, memberIds: number[] }

// Node requests (NEW)
QueryNodesRequest { nodeTypeId?, status?, keyword?, topologyId?, page?, size? }
CreateNodeRequest { operatorId: number, name: string, nodeTypeId: number, ... }
GetNodeRequest { id: number }
UpdateNodeRequest { operatorId: number, id: number, version: number, ... }
DeleteNodeRequest { operatorId: number, id: number }
```

### 4. Entity Type Changes

**Decision**: Create separate `NodeDTO` type, keep `ResourceDTO` for backward compatibility.

**Rationale**:
- Backend now returns `NodeDTO` from nodes endpoints
- UI components may still reference Resource types
- Gradual migration approach minimizes risk

**NodeDTO vs ResourceDTO**:

| Field | NodeDTO | ResourceDTO | Notes |
|-------|---------|-------------|-------|
| id | number | number | Same |
| name | string | string | Same |
| description | string? | string? | Same |
| typeId | nodeTypeId | resourceTypeId | **Different field name** |
| typeName | nodeTypeName | resourceTypeName | **Different field name** |
| typeCode | nodeTypeCode | resourceTypeCode | **Different field name** |
| status | ResourceStatus | ResourceStatus | Same |
| statusDisplay | string | string | Same |
| agentTeamId | number? | - | **NEW field** |
| attributes | string? | string? | Same |
| version | number | number | Same |
| createdBy | number | number | Same |
| createdAt | string | string | Same |
| updatedAt | string | string | Same |

### 5. Migration Strategy

**Decision**: Parallel migration approach - add new services while maintaining old ones temporarily.

**Rationale**:
- Minimizes risk of breaking existing functionality
- Allows gradual testing of new endpoints
- Can rollback if issues discovered

**Migration Steps**:
1. Add new type definitions (NodeDTO, NodeTypeDTO, new request types)
2. Add new nodes.ts API service
3. Update topology.ts to use new member endpoints
4. Create useNodes.ts hook (parallel to useResources.ts)
5. Update components to use new hooks
6. Remove deprecated code after verification

### 6. Unchanged APIs

The following APIs remain unchanged:
- `/api/v1/relationships/*` - Relationship management
- `/api/v1/resources/audit-logs/query` - Audit logs
- `/api/v1/resources/update-status` - Status updates
- `/api/v1/resources/topology/query` - Topology graph (deprecated but still works)

## Alternatives Considered

### Alternative 1: In-place Update
Update existing services directly without parallel migration.

**Rejected Because**: Higher risk of breaking changes, harder to rollback.

### Alternative 2: Complete Rewrite
Rewrite entire service layer from scratch.

**Rejected Because**: Over-engineering, existing patterns work well, only API endpoints change.

### Alternative 3: Adapter Pattern
Create adapters to transform old types to new types.

**Rejected Because**: Adds unnecessary complexity, types are similar enough for direct migration.

## Research Conclusions

1. **API migration is straightforward** - Endpoint changes are well-documented in OpenAPI spec
2. **Type changes are minimal** - Main change is field naming (resourceTypeId → nodeTypeId)
3. **No architectural changes needed** - Service layer pattern remains unchanged
4. **Risk is low** - UI layer remains unchanged, only service implementations update
5. **Parallel migration** - Best approach for this feature size and complexity
