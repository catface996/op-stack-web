# Quickstart: Topology Management API Integration

**Feature**: 002-topology-api
**Date**: 2025-12-25

## Prerequisites

- Node.js 18+ installed
- Backend API running at `http://localhost:8080`
- Project dependencies installed (`npm install`)

## Development Setup

### 1. Start the Backend

Ensure the backend API is running:
```bash
# Backend should be accessible at http://localhost:8080
# Verify with: curl http://localhost:8080/v3/api-docs
```

### 2. Start the Frontend

```bash
cd /Users/catface/Documents/code/GitHub/op-stack/op-stack-web
npm run dev
```

The app will be available at `http://localhost:3000` (or next available port).

### 3. Verify API Proxy

The Vite dev server proxies `/api/*` requests to the backend. Verify in browser console:
```javascript
// Should return resource types from backend
fetch('/api/v1/resource-types/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
}).then(r => r.json()).then(console.log)
```

## Key Files

### Existing (to modify)

| File | Purpose |
|------|---------|
| `components/TopologyGraph.tsx` | Graph visualization - adapt to API data |
| `components/ApiResourceDetailView.tsx` | Resource detail - add topology tab |
| `services/api/types.ts` | Type definitions - extend with topology types |

### New (to create)

| File | Purpose |
|------|---------|
| `services/api/topology.ts` | Topology API service |
| `services/hooks/useTopology.ts` | React hooks for topology data |
| `services/hooks/useMembers.ts` | React hooks for member management |
| `services/hooks/useRelationships.ts` | React hooks for relationships |

## API Integration Pattern

Follow existing patterns from `services/api/resources.ts`:

```typescript
// services/api/topology.ts
import { apiPost } from './client';
import type { TopologyQueryRequest, TopologyQueryResponse } from './types';

const ENDPOINTS = {
  TOPOLOGY_QUERY: '/api/v1/resources/topology/query',
  MEMBERS_ADD: '/api/v1/resources/members/add',
  // ... other endpoints
} as const;

export const topologyApi = {
  queryTopology: (params: TopologyQueryRequest): Promise<TopologyQueryResponse> =>
    apiPost<TopologyQueryRequest, TopologyQueryResponse>(
      ENDPOINTS.TOPOLOGY_QUERY,
      params
    ),
  // ... other methods
};
```

## React Hook Pattern

Follow existing patterns from `services/hooks/useResources.ts`:

```typescript
// services/hooks/useTopology.ts
import { useState, useEffect, useCallback } from 'react';
import { topologyApi } from '../api/topology';

export function useTopology(subgraphId: number | null) {
  const [data, setData] = useState<TopologyQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTopology = useCallback(async () => {
    if (!subgraphId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await topologyApi.queryTopology({ subgraphId });
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [subgraphId]);

  useEffect(() => {
    fetchTopology();
  }, [fetchTopology]);

  return { data, loading, error, refetch: fetchTopology };
}
```

## Data Transformation

Transform API response to D3 format:

```typescript
// In topology.ts or separate transformer file
function transformToD3(response: TopologyQueryResponse): Topology {
  return {
    nodes: response.nodes.map(node => ({
      id: String(node.id),
      label: node.name,
      type: node.typeCode,
      layer: node.layer || 'application',
      isSubgraph: node.isSubgraph,
    })),
    links: response.edges.map(edge => ({
      source: String(edge.sourceId),
      target: String(edge.targetId),
      type: mapRelationshipType(edge.relationshipType),
    })),
  };
}

function mapRelationshipType(apiType: RelationshipType): TopologyLinkType {
  const mapping: Record<RelationshipType, TopologyLinkType> = {
    API_CALL: 'call',
    DATA_FLOW: 'call',
    DEPENDENCY: 'dependency',
    DEPLOYMENT: 'deployment',
  };
  return mapping[apiType];
}
```

## Testing Manually

### 1. View Topology

1. Navigate to a resource that is a subgraph
2. Click the "Topology" tab
3. Verify nodes and edges render correctly

### 2. Add Members

1. Open subgraph topology view
2. Click "Add Members" button
3. Select resources from dialog
4. Confirm and verify they appear in graph

### 3. Create Relationship

1. In topology view, click a node's connection port
2. Click another node's port
3. Configure relationship type in dialog
4. Verify edge appears in graph

## Common Issues

### API Proxy Not Working

If API calls fail with CORS or connection errors:
1. Verify backend is running at `http://localhost:8080`
2. Check `vite.config.ts` proxy configuration
3. Restart Vite dev server

### TypeScript Errors

If TypeScript complains about missing types:
1. Ensure types are exported from `services/api/types.ts`
2. Run `npm run build` to check for type errors
3. Restart TypeScript language server in IDE

### D3 Visualization Issues

If graph doesn't render correctly:
1. Check browser console for errors
2. Verify data transformation produces valid nodes/links
3. Ensure node IDs are strings (D3 requirement)

## Next Steps

After setup, proceed with implementation tasks in `tasks.md` (generated by `/speckit.tasks`).
