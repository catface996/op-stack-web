# Data Model: Agent API Integration

**Feature**: 012-agent-api-integration
**Date**: 2025-12-28

## Entities

### 1. AgentDTO (Backend API Entity)

The backend representation of an agent returned from API endpoints.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number (int64) | Yes | Unique identifier |
| name | string | Yes | Display name (max 100 chars) |
| role | AgentRoleDTO | Yes | Agent role in hierarchy |
| specialty | string | null | No | Area of expertise |
| status | AgentStatusDTO | Yes | Current operational status |
| warnings | number | Yes | Count of warning findings |
| critical | number | Yes | Count of critical findings |
| config | AgentConfigDTO | null | No | AI model configuration |
| teamIds | number[] | Yes | IDs of teams this agent belongs to |
| createdAt | string (ISO 8601) | Yes | Creation timestamp |
| updatedAt | string (ISO 8601) | Yes | Last update timestamp |

### 2. AgentConfigDTO

AI model configuration for an agent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| model | string | Yes | AI model identifier (e.g., "gemini-2.0-flash") |
| temperature | number | Yes | Creativity parameter (0.0 - 1.0) |
| systemInstruction | string | Yes | System prompt defining behavior |
| defaultContext | string | null | No | Default context for all tasks |

### 3. AgentTemplateDTO

Predefined configuration template for quick agent setup.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Template name |
| description | string | Yes | Template description |
| recommendedRole | AgentRoleDTO | null | No | Suggested role |
| systemInstruction | string | Yes | Template system instruction |
| recommendedModel | string | null | No | Suggested model |
| recommendedTemperature | number | null | No | Suggested temperature |

## Enumerations

### AgentRoleDTO

Backend role enumeration (uppercase codes).

```typescript
type AgentRoleDTO =
  | 'GLOBAL_SUPERVISOR'  // System-wide orchestrator (singleton)
  | 'TEAM_SUPERVISOR'    // Team coordinator
  | 'WORKER'             // Task executor
  | 'SCOUTER';           // Discovery agent
```

### AgentStatusDTO

Agent operational status.

```typescript
type AgentStatusDTO =
  | 'IDLE'       // Available for tasks
  | 'THINKING'   // Processing/reasoning
  | 'WORKING'    // Executing task
  | 'COMPLETED'  // Task finished
  | 'WAITING'    // Waiting for dependencies
  | 'ERROR';     // Error state
```

## Type Mapping

### Frontend to Backend Role Mapping

| Frontend AgentRole | Backend AgentRoleDTO |
|-------------------|----------------------|
| `AgentRole.GLOBAL_SUPERVISOR` ("Global Supervisor") | `"GLOBAL_SUPERVISOR"` |
| `AgentRole.TEAM_SUPERVISOR` ("Team Supervisor") | `"TEAM_SUPERVISOR"` |
| `AgentRole.WORKER` ("Worker") | `"WORKER"` |
| `AgentRole.SCOUTER` ("Scouter") | `"SCOUTER"` |

### ID Type Conversion

- **Backend**: `id: number (int64)`
- **Frontend**: `id: string`
- **Conversion**: `String(dto.id)` on fetch, `Number(agent.id)` on mutation

## Validation Rules

### Agent Creation

| Field | Rule |
|-------|------|
| name | Required, 1-100 characters, unique within team |
| role | Required, valid AgentRoleDTO value |
| specialty | Optional, max 200 characters |
| config.model | Must be registered model ID |
| config.temperature | Range: 0.0 - 1.0 |

### Agent Update

| Field | Rule |
|-------|------|
| id | Required, must exist |
| name | If provided, 1-100 characters |
| status | Cannot update while WORKING or THINKING |

### Agent Delete

| Constraint | Rule |
|------------|------|
| GLOBAL_SUPERVISOR | Cannot delete |
| TEAM_SUPERVISOR | Cannot delete if has team members |
| Busy agent | Cannot delete while WORKING or THINKING |

## State Transitions

### Agent Status Flow

```
                        ┌──────────────┐
    ┌──────────────────►│    IDLE      │◄────────────────┐
    │                   └──────┬───────┘                 │
    │                          │                         │
    │                   ┌──────▼───────┐                 │
    │                   │   THINKING   │                 │
    │                   └──────┬───────┘                 │
    │                          │                         │
    │                   ┌──────▼───────┐                 │
    │                   │   WORKING    │                 │
    │                   └──────┬───────┘                 │
    │                          │                         │
    │           ┌──────────────┼──────────────┐         │
    │           │              │              │         │
    │    ┌──────▼───────┐ ┌────▼─────┐ ┌─────▼────┐    │
    └────│  COMPLETED   │ │  ERROR   │ │ WAITING  │────┘
         └──────────────┘ └──────────┘ └──────────┘
```

### Status Constraints

| Current Status | Allowed Operations |
|----------------|-------------------|
| IDLE | Create, Update, Delete, Configure |
| THINKING | Read only |
| WORKING | Read only |
| COMPLETED | All |
| WAITING | Read only |
| ERROR | All |

## Relationships

```
┌─────────────────┐
│   AgentDTO      │
├─────────────────┤         ┌─────────────────┐
│ id              │         │   TeamDTO       │
│ name            │    N:M  ├─────────────────┤
│ role            │◄───────►│ id              │
│ teamIds[]       │         │ members[]       │
│ config ─────────┼────────►│ supervisorId    │
│                 │    1:1  └─────────────────┘
└─────────────────┘
        │
        │ 1:0..1
        ▼
┌─────────────────┐
│ AgentConfigDTO  │
├─────────────────┤
│ model           │
│ temperature     │
│ systemInstruction│
│ defaultContext  │
└─────────────────┘
```

## API Response Structure

All agent API responses follow the constitution envelope format:

```typescript
interface AgentApiResponse<T> {
  code: number;       // 0 = success
  message: string;    // "success" or error message
  success: boolean;   // true if successful
  data: T;           // Response payload
}

// Paginated list response
interface AgentListData {
  content: AgentDTO[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
```
