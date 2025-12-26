# API Contracts: Topologies Management Page

**Feature**: 003-topologies-management
**Date**: 2025-12-25

## Overview

This feature uses existing API contracts from:
- **001-resource-api-integration**: Resource CRUD operations
- **002-topology-api**: Member management operations

No new API endpoints are required.

## Referenced Contracts

### Resource API (from 001-resource-api)

| Operation | Endpoint | Used For |
|-----------|----------|----------|
| List | `POST /api/v1/resources/query` | Fetch Topologies with `isSubgraph=true` filter |
| Create | `POST /api/v1/resources/create` | Create new Topology |
| Get | `POST /api/v1/resources/get` | Fetch single Topology |
| Update | `POST /api/v1/resources/update` | Edit Topology details |
| Delete | `POST /api/v1/resources/delete` | Remove Topology |

Implementation: `services/api/resources.ts`

### Topology API (from 002-topology-api)

| Operation | Endpoint | Used For |
|-----------|----------|----------|
| Query Members | `POST /api/v1/resources/members/query` | Paginated member list |
| Add Members | `POST /api/v1/resources/members/add` | Add resources to Topology |
| Remove Members | `POST /api/v1/resources/members/remove` | Remove resources from Topology |
| Cycle Detection | `POST /api/v1/relationships/resource/cycle-detection` | Prevent circular references |

Implementation: `services/api/topology.ts`

Full contract: [`../../../002-topology-api/contracts/topology-api.yaml`](../../002-topology-api/contracts/topology-api.yaml)

## Request/Response Examples

### List Topologies

**Request:**
```json
POST /api/v1/resources/query
{
  "page": 1,
  "size": 8,
  "keyword": "production",
  "operatorId": 1
}
```

**Response:**
```json
{
  "code": 0,
  "message": "success",
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "name": "Production Cluster",
        "description": "Main production services",
        "resourceTypeId": 5,
        "resourceTypeName": "Subgraph",
        "resourceTypeCode": "SUBGRAPH",
        "status": "RUNNING",
        "statusDisplay": "Running",
        "attributes": "{\"isSubgraph\":true,\"tags\":[\"production\"],\"templateIds\":[]}",
        "version": 1,
        "createdAt": "2025-12-25T10:00:00Z",
        "updatedAt": "2025-12-25T10:00:00Z",
        "createdBy": 1
      }
    ],
    "page": 1,
    "size": 8,
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "last": true
  }
}
```

### Create Topology

**Request:**
```json
POST /api/v1/resources/create
{
  "name": "New Topology",
  "description": "Description here",
  "resourceTypeId": 5,
  "status": "RUNNING",
  "attributes": "{\"isSubgraph\":true,\"tags\":[\"new\"],\"templateIds\":[]}",
  "operatorId": 1
}
```

### Add Members

**Request:**
```json
POST /api/v1/resources/members/add
{
  "subgraphId": 1,
  "memberIds": [10, 11, 12],
  "operatorId": 1
}
```

### Remove Members

**Request:**
```json
POST /api/v1/resources/members/remove
{
  "subgraphId": 1,
  "memberIds": [10],
  "operatorId": 1
}
```

## Filtering Topologies

To filter only Topologies (subgraphs) from the resources list, the frontend should either:

1. **Server-side filter** (preferred if supported):
   - Add filter parameter to query: `{ "attributeFilter": { "isSubgraph": true } }`

2. **Client-side filter** (fallback):
   - Fetch all resources, filter by parsing `attributes` JSON
   - Check `JSON.parse(resource.attributes)?.isSubgraph === true`

Verify backend support during implementation.
