# Quickstart: Backend API Reintegration

**Feature**: 005-api-reintegration
**Date**: 2025-12-26

## Overview

This feature updates the frontend to work with the restructured backend API. Key changes:

1. **Topology Management** - Member operations migrate to `/api/v1/topologies/members/*`
2. **Resource Node Management** - New `/api/v1/nodes/*` endpoints replace resource endpoints
3. **Type Definitions** - New `NodeDTO` and `NodeTypeDTO` types

## Prerequisites

- Node.js 18+
- Backend server running at `localhost:8080`
- Existing codebase from branch `main`

## Quick Setup

```bash
# Checkout feature branch
git checkout 005-api-reintegration

# Install dependencies (if any new ones)
npm install

# Start development server
npm run dev
```

## Key Files to Modify

### 1. Type Definitions (`services/api/types.ts`)

Add new types:

```typescript
// Node entity (replaces Resource for nodes API)
export interface NodeDTO {
  id: number;
  name: string;
  description: string | null;
  nodeTypeId: number;
  nodeTypeName: string;
  nodeTypeCode: string;
  status: ResourceStatus;
  statusDisplay: string;
  agentTeamId: number | null;
  attributes: string | null;
  version: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// Node type definition
export interface NodeTypeDTO {
  id: number;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

// Update TopologyDTO with new field
export interface TopologyDTO {
  // ... existing fields
  coordinatorAgentId: number | null;  // NEW
}
```

### 2. Node API Service (`services/api/nodes.ts`)

Create new file:

```typescript
import { apiPost } from './client';
import type { NodeDTO, NodeTypeDTO, PageResult } from './types';

const ENDPOINTS = {
  QUERY: '/api/v1/nodes/query',
  CREATE: '/api/v1/nodes/create',
  GET: '/api/v1/nodes/get',
  UPDATE: '/api/v1/nodes/update',
  DELETE: '/api/v1/nodes/delete',
  TYPES_QUERY: '/api/v1/nodes/types/query',
} as const;

export const nodeApi = {
  query: (params) => apiPost(ENDPOINTS.QUERY, params),
  create: (params) => apiPost(ENDPOINTS.CREATE, params),
  get: (id) => apiPost(ENDPOINTS.GET, { id }),
  update: (params) => apiPost(ENDPOINTS.UPDATE, params),
  delete: (id, operatorId = 1) => apiPost(ENDPOINTS.DELETE, { id, operatorId }),
  getTypes: () => apiPost(ENDPOINTS.TYPES_QUERY, {}),
};
```

### 3. Topology API Updates (`services/api/topology.ts`)

Update member endpoints:

```typescript
const MEMBER_ENDPOINTS = {
  QUERY: '/api/v1/topologies/members/query',   // Was /resources/members/query
  ADD: '/api/v1/topologies/members/add',       // Was /resources/members/add
  REMOVE: '/api/v1/topologies/members/remove', // Was /resources/members/remove
} as const;

// Update request types to use topologyId instead of resourceId
```

### 4. Hooks Updates

Update hooks to use new APIs:

```typescript
// useMembers.ts - change resourceId to topologyId
const result = await topologyApi.queryMembers({
  topologyId: subgraphId,  // Changed from resourceId
  page,
  size,
});

// useMemberMutations.ts - similar changes
await topologyApi.addMembers({
  topologyId: subgraphId,  // Changed from resourceId
  memberIds,
});
```

## Testing

### Manual Testing

1. **Topology List**: Navigate to Topologies page, verify list loads
2. **Create Topology**: Create new topology, verify it appears
3. **Topology Members**: View topology detail, add/remove members
4. **Node List**: Navigate to Resources page, verify list loads
5. **Create Node**: Create new node, verify it appears
6. **Update Node**: Edit node details, verify changes persist
7. **Delete Node**: Delete node, verify removal

### Verify API Calls

Open browser DevTools Network tab and verify:

- Topology operations use `/api/v1/topologies/*`
- Member operations use `/api/v1/topologies/members/*`
- Node operations use `/api/v1/nodes/*`
- No calls to deprecated endpoints

## Common Issues

### Issue: 401 Unauthorized

**Solution**: Ensure `operatorId` is included in requests:

```typescript
const result = await nodeApi.create({
  operatorId: 1,  // Required
  name: 'My Node',
  nodeTypeId: 1,
});
```

### Issue: 409 Version Conflict

**Solution**: Fetch latest version before update:

```typescript
const node = await nodeApi.get(id);
const updated = await nodeApi.update({
  id,
  version: node.version,  // Use current version
  name: newName,
});
```

### Issue: Member operations fail

**Solution**: Ensure using `topologyId` not `resourceId`:

```typescript
// Wrong
await topologyApi.addMembers({ resourceId: id, memberIds });

// Correct
await topologyApi.addMembers({ topologyId: id, memberIds });
```

## Migration Checklist

- [ ] Add NodeDTO and NodeTypeDTO types
- [ ] Update TopologyDTO with coordinatorAgentId
- [ ] Create nodes.ts API service
- [ ] Update topology.ts member endpoints
- [ ] Update member request types (resourceId → topologyId)
- [ ] Update useMembers hook
- [ ] Update useMemberMutations hook
- [ ] Update useResources to useNodes (or adapt)
- [ ] Update useResourceTypes to useNodeTypes
- [ ] Update component imports
- [ ] Test all CRUD operations
- [ ] Remove deprecated code
