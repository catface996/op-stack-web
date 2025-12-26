# Data Model: Topologies Management Page

**Feature**: 003-topologies-management
**Date**: 2025-12-25

## Entity Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TOPOLOGY (Subgraph)                       │
│  A special Resource with isSubgraph=true that groups members    │
├─────────────────────────────────────────────────────────────────┤
│ id: number (PK)                                                  │
│ name: string                                                     │
│ description: string | null                                       │
│ resourceTypeId: number (FK → ResourceType)                      │
│ status: ResourceStatus                                           │
│ attributes: JSON { isSubgraph: true, tags: [], templateIds: [] }│
│ version: number (optimistic locking)                             │
│ createdAt: timestamp                                             │
│ updatedAt: timestamp                                             │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N (via members API)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUBGRAPH MEMBER                            │
│  Junction entity linking Topology to member Resources           │
├─────────────────────────────────────────────────────────────────┤
│ id: number (PK)                                                  │
│ subgraphId: number (FK → Topology)                              │
│ memberId: number (FK → Resource)                                │
│ memberName: string (denormalized)                               │
│ memberTypeCode: string (denormalized)                           │
│ memberStatus: ResourceStatus (denormalized)                     │
│ addedAt: timestamp                                               │
│ addedBy: number (FK → Operator)                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         │ N:1
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                          RESOURCE                                │
│  Any resource in the system that can be a Topology member       │
├─────────────────────────────────────────────────────────────────┤
│ id: number (PK)                                                  │
│ name: string                                                     │
│ description: string | null                                       │
│ resourceTypeId: number                                           │
│ status: ResourceStatus                                           │
│ attributes: JSON | null                                          │
│ version: number                                                  │
│ createdAt: timestamp                                             │
│ updatedAt: timestamp                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Type Definitions

### TopologyDTO (New - API-aligned)

```typescript
/**
 * Topology entity from API
 * Extends ResourceDTO with topology-specific attribute parsing
 */
export interface TopologyDTO extends ResourceDTO {
  // Parsed from attributes JSON
  isSubgraph: true;
  tags: string[];
  templateIds: string[];
  // Computed
  memberCount?: number;
}
```

### TopologyListItem (UI Display)

```typescript
/**
 * Topology item for list display
 * Combines API data with computed fields
 */
export interface TopologyListItem {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  tags: string[];
  templateIds: string[];
  status: ResourceStatus;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;  // UI state: currently selected
}
```

### TopologyFormData (Create/Edit)

```typescript
/**
 * Form data for creating/editing a Topology
 */
export interface TopologyFormData {
  name: string;           // Required
  description: string;    // Optional
  tags: string[];         // Optional array
  templateIds: string[];  // Optional array of template IDs
}
```

### SubgraphMember (From API - existing in types.ts)

```typescript
/**
 * Member resource within a Topology
 * Already defined in services/api/types.ts
 */
export interface SubgraphMember {
  id: number;
  subgraphId: number;
  memberId: number;
  memberName: string;
  memberTypeCode: string;
  memberStatus: ResourceStatus;
  addedAt: string;
  addedBy: number;
}
```

---

## Type Mapping: Frontend ↔ Backend

### TopologyGroup (Legacy) → ResourceDTO (API)

| TopologyGroup (Legacy) | ResourceDTO (API) | Transformation |
|------------------------|-------------------|----------------|
| `id: string` | `id: number` | `String(id)` / `Number(id)` |
| `name: string` | `name: string` | Direct |
| `description: string` | `description: string \| null` | `description \|\| ''` |
| `nodeCount: number` | N/A | Fetch via members API |
| `createdAt: string` | `createdAt: string` | Direct |
| `tags?: string[]` | `attributes.tags` | Parse JSON |
| `nodeIds: string[]` | N/A | Fetch via members API |
| `templateIds?: string[]` | `attributes.templateIds` | Parse JSON |

### CreateTopologyRequest

```typescript
/**
 * Request body for creating a Topology
 * Maps to CreateResourceRequest
 */
interface CreateTopologyRequest {
  name: string;
  description?: string;
  resourceTypeId: number;  // Must be a valid type supporting subgraphs
  status?: ResourceStatus; // Default: 'RUNNING'
  attributes: string;      // JSON: { isSubgraph: true, tags: [], templateIds: [] }
}
```

### UpdateTopologyRequest

```typescript
/**
 * Request body for updating a Topology
 * Maps to UpdateResourceRequest
 */
interface UpdateTopologyRequest {
  id: number;
  name?: string;
  description?: string;
  status?: ResourceStatus;
  attributes?: string;     // JSON with updated values
  version: number;         // Required for optimistic locking
}
```

---

## Attributes JSON Schema

The `attributes` field stores topology-specific data as JSON:

```json
{
  "isSubgraph": true,
  "tags": ["production", "critical"],
  "templateIds": ["tpl-001", "tpl-002"]
}
```

### Parsing Utility

```typescript
interface TopologyAttributes {
  isSubgraph: boolean;
  tags: string[];
  templateIds: string[];
}

function parseTopologyAttributes(attributesJson: string | null): TopologyAttributes {
  if (!attributesJson) {
    return { isSubgraph: false, tags: [], templateIds: [] };
  }
  try {
    const parsed = JSON.parse(attributesJson);
    return {
      isSubgraph: parsed.isSubgraph === true,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      templateIds: Array.isArray(parsed.templateIds) ? parsed.templateIds : [],
    };
  } catch {
    return { isSubgraph: false, tags: [], templateIds: [] };
  }
}

function serializeTopologyAttributes(attrs: TopologyAttributes): string {
  return JSON.stringify(attrs);
}
```

---

## State Transitions

### Topology Lifecycle

```
   ┌─────────┐
   │ RUNNING │ ←─── Default on creation
   └────┬────┘
        │
   ┌────▼────┐
   │ STOPPED │ ←─── Manual status change
   └────┬────┘
        │
┌───────▼───────┐
│  MAINTENANCE  │ ←─── Manual status change
└───────┬───────┘
        │
   ┌────▼────┐
   │ OFFLINE │ ←─── Manual status change
   └─────────┘
```

All transitions are bi-directional (any status can change to any other).

### Member Operations

```
┌──────────────┐     Add Members     ┌──────────────┐
│   Topology   │ ←──────────────────→│   Resource   │
│  (subgraph)  │     Remove Members  │   (member)   │
└──────────────┘                     └──────────────┘

Constraints:
- A Resource can be member of multiple Topologies
- A Topology can have 0 to N members
- Adding a subgraph as member requires cycle detection
- Removing a member does NOT delete the Resource
- Deleting a Topology does NOT delete member Resources
```

---

## Validation Rules

### Topology Creation
- `name`: Required, non-empty string
- `resourceTypeId`: Required, must be valid resource type
- `attributes.isSubgraph`: Must be `true`

### Topology Update
- `id`: Required
- `version`: Required (optimistic locking)
- At least one field to update

### Member Addition
- `subgraphId`: Must exist and be a valid subgraph
- `memberIds`: Non-empty array of valid resource IDs
- Cycle detection: Adding a subgraph that contains current topology → Error

### Member Removal
- `subgraphId`: Must exist
- `memberIds`: Non-empty array of member IDs to remove

---

## Related Entities (Reference)

### ResourceType (Existing)

```typescript
interface ResourceTypeDTO {
  id: number;
  code: string;        // e.g., "SUBGRAPH", "SERVICE"
  name: string;
  description: string;
  icon: string;
  systemPreset: boolean;
}
```

### CycleDetectionResponse (From topology API)

```typescript
interface CycleDetectionResponse {
  hasCycle: boolean;
  cyclePath: number[];      // Resource IDs forming the cycle
  cycleDescription: string; // Human-readable explanation
}
```
