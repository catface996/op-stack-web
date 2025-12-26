# Data Model: Topology Management API Integration

**Feature**: 002-topology-api
**Date**: 2025-12-25

## Entity Overview

```
┌─────────────────┐      ┌─────────────────┐
│  TopologyNode   │◄────►│  TopologyEdge   │
└─────────────────┘      └─────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│ SubgraphMember  │      │  Relationship   │
└─────────────────┘      └─────────────────┘
        │
        ▼
┌─────────────────┐
│SubgraphBoundary │
└─────────────────┘
```

## Entities

### TopologyNode

Represents a resource in the topology graph.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Unique resource identifier |
| name | string | Yes | Resource name for display |
| typeCode | string | Yes | Resource type code (e.g., "mysql", "nginx") |
| typeName | string | Yes | Human-readable type name |
| status | ResourceStatus | Yes | RUNNING, STOPPED, MAINTENANCE, OFFLINE |
| isSubgraph | boolean | Yes | Whether this resource is a subgraph container |
| layer | TopologyLayer | No | scenario, flow, application, middleware, infrastructure |
| attributes | Record<string, any> | No | Custom resource attributes |

**Validation Rules**:
- `id` must be positive integer
- `name` must be non-empty string
- `typeCode` must match existing resource type
- `status` must be valid ResourceStatus enum value

### TopologyEdge

Represents a relationship between resources in the graph.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Unique relationship identifier |
| sourceId | number | Yes | Source resource ID |
| targetId | number | Yes | Target resource ID |
| relationshipType | RelationshipType | Yes | Type of relationship |
| direction | RelationshipDirection | Yes | UNIDIRECTIONAL or BIDIRECTIONAL |
| strength | number | Yes | Relationship strength (1-10) |
| status | RelationshipStatus | Yes | ACTIVE or INACTIVE |

**Validation Rules**:
- `sourceId` and `targetId` must reference existing resources
- `sourceId` cannot equal `targetId` (no self-loops)
- `strength` must be integer between 1 and 10
- `relationshipType` must be: DEPENDENCY, DATA_FLOW, API_CALL, or DEPLOYMENT

### SubgraphMember

Represents a resource's membership in a subgraph.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Membership record ID |
| subgraphId | number | Yes | Parent subgraph resource ID |
| memberId | number | Yes | Member resource ID |
| memberName | string | Yes | Member resource name |
| memberTypeCode | string | Yes | Member resource type code |
| memberStatus | ResourceStatus | Yes | Member resource status |
| addedAt | string (ISO 8601) | Yes | When member was added |
| addedBy | number | Yes | User who added the member |

**Validation Rules**:
- `subgraphId` must reference a resource where `isSubgraph = true`
- `memberId` cannot equal `subgraphId`
- Adding a member must not create circular reference (validated by cycle-detection API)

### SubgraphBoundary

Visual boundary for nested subgraphs in the topology view.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| subgraphId | number | Yes | Subgraph resource ID |
| memberIds | number[] | Yes | Array of member resource IDs |
| expanded | boolean | Yes | Whether boundary is expanded in view |
| boundingBox | BoundingBox | No | Calculated visual boundary coordinates |

**State Transitions**:
- `expanded`: false → true (single-click to expand)
- `expanded`: true → false (single-click to collapse)

### Relationship

Full relationship entity with all metadata.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Unique relationship identifier |
| sourceResourceId | number | Yes | Source resource ID |
| targetResourceId | number | Yes | Target resource ID |
| type | RelationshipType | Yes | DEPENDENCY, DATA_FLOW, API_CALL, DEPLOYMENT |
| direction | RelationshipDirection | Yes | UNIDIRECTIONAL or BIDIRECTIONAL |
| strength | number | Yes | Strength value (1-10) |
| status | RelationshipStatus | Yes | ACTIVE or INACTIVE |
| description | string | No | Optional relationship description |
| version | number | Yes | Optimistic locking version |
| createdAt | string (ISO 8601) | Yes | Creation timestamp |
| updatedAt | string (ISO 8601) | Yes | Last update timestamp |
| createdBy | number | Yes | Creator user ID |

## Enumerations

### RelationshipType

```typescript
type RelationshipType = 'DEPENDENCY' | 'DATA_FLOW' | 'API_CALL' | 'DEPLOYMENT';
```

| Value | Description | Visual Style |
|-------|-------------|--------------|
| DEPENDENCY | Component depends on another | Dashed gray line |
| DATA_FLOW | Data flows between components | Solid cyan with animation |
| API_CALL | API/RPC call relationship | Solid cyan with animation |
| DEPLOYMENT | Deployment/hosting relationship | Solid dark gray |

### RelationshipDirection

```typescript
type RelationshipDirection = 'UNIDIRECTIONAL' | 'BIDIRECTIONAL';
```

### RelationshipStatus

```typescript
type RelationshipStatus = 'ACTIVE' | 'INACTIVE';
```

### TopologyLayer

```typescript
type TopologyLayer = 'scenario' | 'flow' | 'application' | 'middleware' | 'infrastructure';
```

## Supporting Types

### BoundingBox

```typescript
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### AncestorNode

```typescript
interface AncestorNode {
  id: number;
  name: string;
  depth: number; // 0 = current, 1 = parent, 2 = grandparent, etc.
}
```

## API Request/Response Types

### TopologyQueryRequest

```typescript
interface TopologyQueryRequest {
  subgraphId: number;
  depth?: number; // How many levels of nested subgraphs to include
  includeRelationships?: boolean;
}
```

### TopologyQueryResponse

```typescript
interface TopologyQueryResponse {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  boundaries: SubgraphBoundary[];
}
```

### MembersAddRequest

```typescript
interface MembersAddRequest {
  subgraphId: number;
  memberIds: number[];
}
```

### MembersRemoveRequest

```typescript
interface MembersRemoveRequest {
  subgraphId: number;
  memberIds: number[];
}
```

### MembersQueryRequest

```typescript
interface MembersQueryRequest {
  subgraphId: number;
  page?: number;
  size?: number; // 8 for card view, 10 for list view
}
```

### RelationshipCreateRequest

```typescript
interface RelationshipCreateRequest {
  sourceResourceId: number;
  targetResourceId: number;
  type: RelationshipType;
  direction: RelationshipDirection;
  strength: number;
  description?: string;
}
```

### RelationshipUpdateRequest

```typescript
interface RelationshipUpdateRequest {
  id: number;
  type?: RelationshipType;
  direction?: RelationshipDirection;
  strength?: number;
  description?: string;
  status?: RelationshipStatus;
  version: number; // Required for optimistic locking
}
```

### CycleDetectionRequest

```typescript
interface CycleDetectionRequest {
  subgraphId: number;
  candidateMemberIds: number[];
}
```

### CycleDetectionResponse

```typescript
interface CycleDetectionResponse {
  hasCycle: boolean;
  cyclePath?: number[]; // Resource IDs forming the cycle
  cycleDescription?: string; // Human-readable description
}
```

## Relationships Diagram

```
Resource (isSubgraph=true)
    │
    ├── has many ──► SubgraphMember
    │                    │
    │                    └── references ──► Resource (member)
    │
    └── has many ──► Relationship
                         │
                         ├── sourceResourceId ──► Resource
                         └── targetResourceId ──► Resource
```
