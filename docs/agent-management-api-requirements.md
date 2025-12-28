# Agent Management API Requirements

## 1. Overview

The Agent Management module manages AI agents that perform automated diagnosis, monitoring, and analysis tasks within the system. Agents are organized in a hierarchical structure:

- **Global Supervisor**: The top-level orchestrator (singleton)
- **Team Supervisor**: Coordinates agents within a team (one per team)
- **Worker**: Executes specific tasks assigned by supervisors

## 2. Data Models

### 2.1 Agent Entity

```typescript
interface Agent {
  id: string;                    // Unique identifier (UUID recommended)
  name: string;                  // Display name, e.g., "Log Analyzer"
  role: AgentRole;               // Role in hierarchy
  specialty?: string;            // Area of expertise, e.g., "Error Tracking", "Network Analysis"
  status: AgentStatus;           // Current operational status
  currentTask?: string;          // Description of current task (if working)
  findings: AgentFindings;       // Aggregated findings from executions
  config?: AgentConfig;          // AI model configuration
  teamId?: string;               // Reference to parent team (null for Global Supervisor)
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### 2.2 Agent Role Enumeration

```typescript
enum AgentRole {
  GLOBAL_SUPERVISOR = 'Global Supervisor',  // System-wide orchestrator (singleton)
  TEAM_SUPERVISOR = 'Team Supervisor',       // Team coordinator
  WORKER = 'Worker',                          // Task executor
  SCOUTER = 'Scouter'                         // Discovery agent
}
```

### 2.3 Agent Status Enumeration

```typescript
enum AgentStatus {
  IDLE = 'IDLE',           // Available for tasks
  THINKING = 'THINKING',   // Processing/reasoning
  WORKING = 'WORKING',     // Executing task
  COMPLETED = 'COMPLETED', // Task finished
  WAITING = 'WAITING',     // Waiting for dependencies
  ERROR = 'ERROR'          // Error state
}
```

### 2.4 Agent Configuration

```typescript
interface AgentConfig {
  model: string;              // AI model identifier, e.g., "gemini-2.5-flash"
  temperature: number;        // Creativity parameter (0.0 - 1.0)
  systemInstruction: string;  // System prompt defining agent behavior
  defaultContext?: string;    // Default context appended to every task
}
```

### 2.5 Agent Findings

```typescript
interface AgentFindings {
  warnings: number;   // Count of warnings detected
  critical: number;   // Count of critical issues detected
}
```

### 2.6 Team Entity (Optional - for context)

```typescript
interface Team {
  id: string;
  resourceId: string;        // Associated resource/topology node ID
  name: string;
  supervisorId: string;      // Reference to Team Supervisor agent
  memberIds: string[];       // References to Worker agents
  createdAt: string;
  updatedAt: string;
}
```

## 3. API Endpoints

### 3.1 List Agents

**Endpoint**: `POST /api/service/v1/agents/list`

**Request**:
```typescript
interface ListAgentsRequest {
  page?: number;              // Page number (1-based), default: 1
  size?: number;              // Page size, default: 10
  role?: AgentRole;           // Filter by role
  status?: AgentStatus;       // Filter by status
  teamId?: string;            // Filter by team
  keyword?: string;           // Search by name or specialty
}
```

**Response**:
```typescript
interface ListAgentsResponse {
  code: number;               // 0 = success
  success: boolean;
  message: string;
  data: {
    content: AgentDTO[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  }
}
```

### 3.2 Get Agent Detail

**Endpoint**: `POST /api/service/v1/agents/get`

**Request**:
```typescript
interface GetAgentRequest {
  id: string;                 // Agent ID
}
```

**Response**:
```typescript
interface GetAgentResponse {
  code: number;
  success: boolean;
  message: string;
  data: AgentDTO;
}
```

**Error Codes**:
- `404`: Agent not found

### 3.3 Create Agent

**Endpoint**: `POST /api/service/v1/agents/create`

**Request**:
```typescript
interface CreateAgentRequest {
  name: string;               // Required: Display name
  role: AgentRole;            // Required: Agent role (typically 'Worker')
  specialty?: string;         // Optional: Area of expertise
  teamId?: string;            // Optional: Assign to team
  config?: {                  // Optional: AI configuration
    model?: string;           // Default: "gemini-2.0-flash"
    temperature?: number;     // Default: 0.3
    systemInstruction?: string;
    defaultContext?: string;
  }
}
```

**Response**:
```typescript
interface CreateAgentResponse {
  code: number;
  success: boolean;
  message: string;
  data: AgentDTO;             // Created agent with generated ID
}
```

**Validation Rules**:
- `name`: Required, 1-100 characters
- `role`: Required, must be valid AgentRole
- `config.temperature`: Must be between 0.0 and 1.0
- `config.model`: Must be a valid registered model ID

**Error Codes**:
- `400`: Validation error
- `409`: Duplicate name within same team

### 3.4 Update Agent

**Endpoint**: `POST /api/service/v1/agents/update`

**Request**:
```typescript
interface UpdateAgentRequest {
  id: string;                 // Required: Agent ID
  name?: string;              // Optional: New display name
  specialty?: string;         // Optional: Update specialty
  status?: AgentStatus;       // Optional: Update status
  config?: {                  // Optional: Update configuration
    model?: string;
    temperature?: number;
    systemInstruction?: string;
    defaultContext?: string;
  }
}
```

**Response**:
```typescript
interface UpdateAgentResponse {
  code: number;
  success: boolean;
  message: string;
  data: AgentDTO;             // Updated agent
}
```

**Business Rules**:
- Cannot change `role` after creation
- Cannot update `GLOBAL_SUPERVISOR` role assignment
- Cannot update agent while `status` is `WORKING` or `THINKING`

**Error Codes**:
- `400`: Validation error
- `404`: Agent not found
- `409`: Name conflict
- `423`: Agent is busy (cannot update)

### 3.5 Update Agent Configuration

**Endpoint**: `POST /api/service/v1/agents/config/update`

**Request**:
```typescript
interface UpdateAgentConfigRequest {
  id: string;                 // Required: Agent ID
  config: {
    model?: string;
    temperature?: number;
    systemInstruction?: string;
    defaultContext?: string;
  }
}
```

**Response**: Same as Update Agent

### 3.6 Delete Agent

**Endpoint**: `POST /api/service/v1/agents/delete`

**Request**:
```typescript
interface DeleteAgentRequest {
  id: string;                 // Agent ID to delete
}
```

**Response**:
```typescript
interface DeleteAgentResponse {
  code: number;
  success: boolean;
  message: string;
  data: null;
}
```

**Business Rules**:
- Cannot delete `GLOBAL_SUPERVISOR`
- Cannot delete `TEAM_SUPERVISOR` if team has members
- Cannot delete agent while `status` is `WORKING` or `THINKING`

**Error Codes**:
- `400`: Cannot delete (supervisor with members, or busy)
- `404`: Agent not found
- `423`: Agent is busy

### 3.7 Assign Agent to Team

**Endpoint**: `POST /api/service/v1/agents/assign`

**Request**:
```typescript
interface AssignAgentRequest {
  agentId: string;            // Agent ID
  teamId: string;             // Target team ID
}
```

**Response**:
```typescript
interface AssignAgentResponse {
  code: number;
  success: boolean;
  message: string;
  data: AgentDTO;
}
```

### 3.8 Unassign Agent from Team

**Endpoint**: `POST /api/service/v1/agents/unassign`

**Request**:
```typescript
interface UnassignAgentRequest {
  agentId: string;            // Agent ID
}
```

## 4. Agent Configuration Templates

The system provides predefined templates for common agent configurations:

| Template Name | Use Case | Default Instructions |
|--------------|----------|---------------------|
| Standard Coordinator | General team supervision | Coordinate workers, aggregate findings, report status |
| Strict Security Auditor | Security-focused analysis | Scrutinize for vulnerabilities, flag anomalies |
| Performance Optimizer | Performance tuning | Identify bottlenecks, suggest optimizations |
| Root Cause Analyst | Incident investigation | Correlate logs, trace error origins |
| Concise Reporter | Minimal output worker | Report only facts and metrics in JSON |

**Endpoint**: `POST /api/service/v1/agents/templates/list`

**Response**:
```typescript
interface AgentTemplateListResponse {
  code: number;
  success: boolean;
  message: string;
  data: AgentTemplate[];
}

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  defaultContext?: string;
  recommendedModel?: string;
  recommendedTemperature?: number;
}
```

## 5. Agent Statistics

**Endpoint**: `POST /api/service/v1/agents/stats`

**Request**:
```typescript
interface AgentStatsRequest {
  agentId?: string;           // Optional: specific agent, or all if omitted
  startTime?: string;         // ISO 8601 timestamp
  endTime?: string;           // ISO 8601 timestamp
}
```

**Response**:
```typescript
interface AgentStatsResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    totalAgents: number;
    byRole: Record<AgentRole, number>;
    byStatus: Record<AgentStatus, number>;
    totalExecutions: number;
    successRate: number;        // Percentage (0-100)
    avgExecutionTime: number;   // Milliseconds
    totalWarnings: number;
    totalCritical: number;
  }
}
```

## 6. Available AI Models

The following models should be registered and available for agent configuration:

| Model ID | Display Name | Provider | Context Window |
|----------|--------------|----------|----------------|
| gemini-2.0-flash | Gemini 2.0 Flash | Google | 1M tokens |
| gemini-2.5-flash | Gemini 2.5 Flash | Google | 1M tokens |
| gemini-2.5-flash-thinking | Gemini 2.5 Flash (Thinking) | Google | 1M tokens |
| gemini-3-pro-preview | Gemini 3 Pro (Preview) | Google | 2M tokens |

## 7. Frontend Features Supported

The API should support the following UI operations:

### 7.1 Agent Registry Page
- List all agents with pagination
- Filter by role (All, Supervisor, Worker)
- Search by name or specialty
- Card and List view modes

### 7.2 Agent Actions
- **View**: Display agent profile with config details
- **Configure**: Update model, temperature, system instructions
- **Delete**: Remove worker agents (with confirmation)
- **Trace Log**: View execution history (separate API)

### 7.3 Create Agent Modal
- Name input (required)
- Specialty input (optional)
- Auto-assign to first available team (temporary behavior)

## 8. Error Response Format

All error responses follow this format:

```typescript
interface ErrorResponse {
  code: number;           // Error code (4xx, 5xx)
  success: false;
  message: string;        // Human-readable error message
  data: null;
  errors?: {              // Optional: field-level validation errors
    field: string;
    message: string;
  }[];
}
```

## 9. Implementation Notes

### 9.1 ID Generation
- Use UUID v4 for agent IDs
- Prefix format: `agent-{uuid}` or `worker-{uuid}`

### 9.2 Default Values
```typescript
const DEFAULT_AGENT_CONFIG = {
  model: 'gemini-2.0-flash',
  temperature: 0.3,
  systemInstruction: 'You are a specialized worker agent.',
  defaultContext: ''
};

const DEFAULT_AGENT_STATUS = AgentStatus.IDLE;

const DEFAULT_FINDINGS = {
  warnings: 0,
  critical: 0
};
```

### 9.3 Singleton Constraint
- Only one `GLOBAL_SUPERVISOR` agent should exist in the system
- Attempting to create another should return `409 Conflict`

### 9.4 Cascading Operations
- Deleting a team should unassign (not delete) its member agents
- Deleting a `TEAM_SUPERVISOR` should first check for team members

## 10. Future Considerations

- Agent execution logging and audit trail
- Agent performance metrics and analytics
- Agent health monitoring and auto-recovery
- Role-based access control for agent management
- Agent versioning for configuration history
