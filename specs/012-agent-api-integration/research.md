# Research: Agent API Integration

**Feature**: 012-agent-api-integration
**Date**: 2025-12-28

## Research Tasks

### 1. Agent ID Type Mismatch

**Question**: Frontend uses string IDs for Agent, but backend uses int64. How to handle?

**Decision**: Use numeric IDs in API layer, convert at service boundary.

**Rationale**:
- Backend API (OpenAPI docs) specifies `id: int64` for AgentDTO
- Existing API types in the project use `number` for entity IDs (see ResourceDTO, TopologyDTO, ReportDTO)
- Frontend Agent type uses `string` for historical mock data reasons
- Service layer will map between API types (numeric) and frontend types (string)

**Alternatives Considered**:
1. Change frontend Agent.id to number - Rejected: requires changes across many components
2. Keep as string and convert - **Selected**: minimal disruption, isolated to API service
3. Create separate API and UI types - Rejected: unnecessary complexity for simple conversion

---

### 2. API Service Pattern

**Question**: What pattern to follow for the new agents.ts API service?

**Decision**: Follow existing pattern from reports.ts and resources.ts.

**Rationale**:
- Established pattern in the codebase: `services/api/{entity}.ts`
- Uses `apiPostRaw` for full response wrapper access
- Types defined in `services/api/types.ts`
- Exports individual async functions (listAgents, getAgent, createAgent, etc.)

**Pattern Example** (from reports.ts):
```typescript
import { apiPostRaw } from './client';
import type { ListRequest, ListResponse } from './types';

export async function listAgents(request: ListRequest): Promise<ListResponse> {
  return apiPostRaw<ListRequest, ListResponse>('/api/service/v1/agents/list', request);
}
```

---

### 3. Agent Role Mapping

**Question**: How to map frontend AgentRole enum to backend role values?

**Decision**: Backend uses uppercase role codes that match frontend enum keys.

**Rationale**:
- Backend API schema: `role: enum [GLOBAL_SUPERVISOR, TEAM_SUPERVISOR, WORKER, SCOUTER]`
- Frontend AgentRole enum values have display names ("Team Supervisor")
- Need bidirectional mapping in API types

**Mapping**:
| Frontend (types.ts) | Backend API |
|---------------------|-------------|
| AgentRole.GLOBAL_SUPERVISOR ("Global Supervisor") | "GLOBAL_SUPERVISOR" |
| AgentRole.TEAM_SUPERVISOR ("Team Supervisor") | "TEAM_SUPERVISOR" |
| AgentRole.WORKER ("Worker") | "WORKER" |
| AgentRole.SCOUTER ("Scouter") | "SCOUTER" |

---

### 4. Backend API Endpoints

**Question**: Which backend endpoints are available for agent operations?

**Decision**: Use endpoints from backend OpenAPI documentation.

**Endpoints** (from localhost:8080/docs/service/v3/api-docs):
| Operation | Endpoint | Request Body |
|-----------|----------|--------------|
| List | POST /api/service/v1/agents/list | ListAgentsRequest |
| Get | POST /api/service/v1/agents/get | { id: number } |
| Create | POST /api/service/v1/agents/create | CreateAgentRequest |
| Update | POST /api/service/v1/agents/update | UpdateAgentRequest |
| Config Update | POST /api/service/v1/agents/config/update | UpdateAgentConfigRequest |
| Delete | POST /api/service/v1/agents/delete | { id: number } |
| Templates | POST /api/service/v1/agents/templates/list | {} |
| Assign | POST /api/service/v1/agents/assign | AssignAgentRequest |
| Unassign | POST /api/service/v1/agents/unassign | UnassignAgentRequest |
| Stats | POST /api/service/v1/agents/stats | AgentStatsRequest |

---

### 5. Hook Integration Pattern

**Question**: How should the component integrate with the API - direct calls or through hooks?

**Decision**: Use custom React hooks in `services/hooks/` directory.

**Rationale**:
- Existing pattern: `services/hooks/useResources.ts`, `useReports.ts`
- Hooks handle loading states, error handling, and data transformation
- Encapsulates API calls from component logic
- Provides React Query-like pattern (without the library)

**Implementation**:
```typescript
// services/hooks/useAgents.ts
export function useAgents(params?: ListAgentsParams) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ... fetch logic with pagination
  return { agents, loading, error, pagination, refresh };
}
```

---

### 6. Error Handling Strategy

**Question**: How to handle API errors and display to user?

**Decision**: Use existing error message mapping and display in-component toast/banner.

**Rationale**:
- Existing ERROR_MESSAGES constant in types.ts covers standard HTTP codes
- API returns `{ success: false, message: string }` for errors
- Components should display user-friendly messages
- Backend may return 423 (Locked) when agent is busy - need custom handling

**Error Codes**:
| Code | Scenario | User Message |
|------|----------|--------------|
| 400 | Validation failed | "Invalid request parameters" |
| 404 | Agent not found | "The requested agent was not found" |
| 409 | Name conflict | "An agent with this name already exists" |
| 423 | Agent busy | "Cannot modify agent while it is working" |

---

### 7. State Management Approach

**Question**: Should App.tsx state management be kept or moved to component?

**Decision**: Remove App.tsx handlers, move to AgentManagement + hooks.

**Rationale**:
- Current App.tsx has mock handlers (handleAddAgent, handleDeleteAgent, etc.)
- After API integration, state comes from server, not local mock data
- AgentManagement should own its data fetching via useAgents hook
- Eliminates prop drilling from App.tsx through route components
- Matches pattern used in ReportManagement, ResourceManagement

**Migration**:
1. Remove agent-related state from App.tsx
2. Remove agent props from AgentManagement route
3. AgentManagement calls useAgents() hook directly
4. Mutations call API functions directly

---

## Summary

All research items resolved. Key decisions:

1. **ID Types**: Numeric in API layer, string in UI (convert at boundary)
2. **Service Pattern**: Follow reports.ts pattern
3. **Role Mapping**: Uppercase backend codes ↔ display-friendly frontend values
4. **Hooks**: Create useAgents hook for data fetching
5. **Error Handling**: Use existing patterns with 423 extension
6. **State Management**: Move from App.tsx to component-level hooks
