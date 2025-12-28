# Quickstart: Agent API Integration

**Feature**: 012-agent-api-integration
**Date**: 2025-12-28

## Overview

This feature integrates the backend Agent APIs with the frontend Agent management module, replacing mock data handlers with real API calls.

## Prerequisites

- Node.js 18+
- Backend service running at localhost:8080
- Vite dev server (proxies API requests)

## Quick Setup

```bash
# Start backend (separate terminal)
cd ../op-stack-backend
./gradlew bootRun

# Start frontend
cd op-stack-web
npm install
npm run dev
```

## Key Files

| File | Purpose |
|------|---------|
| `services/api/agents.ts` | Agent API service functions |
| `services/api/types.ts` | Agent type definitions |
| `services/hooks/useAgents.ts` | React hook for agent data |
| `components/AgentManagement.tsx` | Agent list/CRUD UI |
| `components/AgentConfigModal.tsx` | Agent configuration modal |

## Implementation Checklist

### 1. API Types (services/api/types.ts)

Add these types:

```typescript
// Agent Role enum (backend format)
export type AgentRoleDTO = 'GLOBAL_SUPERVISOR' | 'TEAM_SUPERVISOR' | 'WORKER' | 'SCOUTER';

// Agent Status enum
export type AgentStatusDTO = 'IDLE' | 'THINKING' | 'WORKING' | 'COMPLETED' | 'WAITING' | 'ERROR';

// Agent DTO
export interface AgentDTO {
  id: number;
  name: string;
  role: AgentRoleDTO;
  specialty: string | null;
  status: AgentStatusDTO;
  warnings: number;
  critical: number;
  config: AgentConfigDTO | null;
  teamIds: number[];
  createdAt: string;
  updatedAt: string;
}

// Request/Response types...
```

### 2. API Service (services/api/agents.ts)

Create service with these functions:

```typescript
import { apiPostRaw } from './client';

export async function listAgents(request: ListAgentsRequest): Promise<AgentListResponse>;
export async function getAgent(request: GetAgentRequest): Promise<AgentDetailResponse>;
export async function createAgent(request: CreateAgentRequest): Promise<AgentDetailResponse>;
export async function updateAgent(request: UpdateAgentRequest): Promise<AgentDetailResponse>;
export async function updateAgentConfig(request: UpdateAgentConfigRequest): Promise<AgentDetailResponse>;
export async function deleteAgent(request: DeleteAgentRequest): Promise<VoidResponse>;
export async function listAgentTemplates(): Promise<AgentTemplateListResponse>;
```

### 3. React Hook (services/hooks/useAgents.ts)

Create hook pattern:

```typescript
export function useAgents(params?: ListAgentsParams) {
  const [data, setData] = useState<AgentListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listAgents(params);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  return { data, loading, error, refresh: fetch };
}
```

### 4. Component Update (AgentManagement.tsx)

Replace prop-based data with hook:

```typescript
// Before
const AgentManagement: React.FC<AgentManagementProps> = ({ teams, onAddAgent, ... }) => {
  const allAgents = teams.flatMap(/* ... */);
}

// After
const AgentManagement: React.FC = () => {
  const { data, loading, error, refresh } = useAgents({ page: 1, size: 8 });
  const agents = data?.content ?? [];
}
```

## API Endpoints

| Operation | Endpoint | Method |
|-----------|----------|--------|
| List | /api/service/v1/agents/list | POST |
| Get | /api/service/v1/agents/get | POST |
| Create | /api/service/v1/agents/create | POST |
| Update | /api/service/v1/agents/update | POST |
| Config | /api/service/v1/agents/config/update | POST |
| Delete | /api/service/v1/agents/delete | POST |
| Templates | /api/service/v1/agents/templates/list | POST |

## Type Conversions

### Role Mapping

```typescript
// Frontend → Backend
function toApiRole(role: AgentRole): AgentRoleDTO {
  return role.toUpperCase().replace(/ /g, '_') as AgentRoleDTO;
}

// Backend → Frontend
function fromApiRole(dto: AgentRoleDTO): AgentRole {
  const map = {
    'GLOBAL_SUPERVISOR': AgentRole.GLOBAL_SUPERVISOR,
    'TEAM_SUPERVISOR': AgentRole.TEAM_SUPERVISOR,
    'WORKER': AgentRole.WORKER,
    'SCOUTER': AgentRole.SCOUTER,
  };
  return map[dto];
}
```

### ID Conversion

```typescript
// API response → Frontend
const agent: Agent = {
  ...dto,
  id: String(dto.id),  // number → string
};

// Frontend → API request
const request = {
  id: Number(agent.id),  // string → number
};
```

## Error Handling

```typescript
// Handle API errors
try {
  const response = await createAgent(request);
  if (!response.success) {
    showError(response.message);
    return;
  }
  // Success...
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 409: showError('Agent name already exists'); break;
      case 423: showError('Cannot modify busy agent'); break;
      default: showError(error.message);
    }
  }
}
```

## Testing

```bash
# Run e2e tests
npx playwright test tests/agents.spec.ts

# Manual testing
1. Navigate to /agents
2. Verify list loads from API
3. Create new agent
4. Update agent config
5. Delete agent
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on API calls | Check backend is running at localhost:8080 |
| CORS errors | Use Vite proxy (already configured) |
| Empty agent list | Backend may have no data - create test agent |
| 423 error on update | Agent is busy - wait for status change |
