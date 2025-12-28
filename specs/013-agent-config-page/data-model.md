# Data Model: Agent Configuration Page

**Feature**: 013-agent-config-page
**Date**: 2025-12-28

## Entities

### Agent (Extended)

The core entity being configured. Extends existing `AgentWithApiFields` type.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier |
| name | string | Yes | Agent display name (max 100 chars) |
| role | AgentRole | Yes | Agent role (GLOBAL_SUPERVISOR, TEAM_SUPERVISOR, WORKER, SCOUTER) |
| specialty | string | No | Specialty description (max 200 chars) |
| promptTemplateId | number | No | Associated prompt template ID |
| promptTemplateName | string | No | Prompt template name (read-only, from API) |
| model | string | No | AI model identifier |
| temperature | number | No | Temperature parameter (0.0-2.0) |
| topP | number | No | Top P parameter (0.0-1.0) |
| maxTokens | number | No | Maximum output tokens |
| maxRuntime | number | No | Maximum runtime in seconds |
| **toolIds** | number[] | No | **NEW: Array of assigned tool IDs** |
| teamIds | number[] | No | Associated team IDs |
| createdAt | string | Yes | Creation timestamp |
| updatedAt | string | Yes | Last update timestamp |

### PromptTemplate (Existing)

Used for template selection and preview.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Unique identifier |
| name | string | Yes | Template name |
| description | string | No | Brief description |
| content | string | Yes | Full prompt content (for preview) |
| usageCode | string | Yes | Usage type code |
| currentVersion | number | Yes | Current version number |

### Tool (Existing)

Available tools for selection.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier |
| name | string | Yes | Tool name |
| description | string | No | Tool description |
| categoryId | string | Yes | Parent category ID |
| categoryName | string | No | Category name (denormalized) |
| status | ToolStatus | Yes | active/disabled |

### ToolCategory (Existing)

Groups tools for display.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier |
| name | string | Yes | Category name |
| description | string | No | Category description |
| toolCount | number | No | Number of tools in category |

## Frontend State Models

### ConfigPageState

Page-level state for the configuration wizard.

```typescript
interface ConfigPageState {
  agentId: string;
  currentStage: ConfigStage;
  agent: AgentWithApiFields | null;
  loading: boolean;
  error: string | null;
  stageStates: {
    basicInfo: StageState;
    promptTemplate: StageState;
    tools: StageState;
  };
}

type ConfigStage = 'basicInfo' | 'promptTemplate' | 'tools';

interface StageState {
  isDirty: boolean;
  isSaving: boolean;
  isCompleted: boolean;
  error: string | null;
}
```

### BasicInfoFormData

Form state for Stage 1.

```typescript
interface BasicInfoFormData {
  name: string;
  specialty: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  maxRuntime: number;
}
```

### PromptTemplateSelectionState

State for Stage 2.

```typescript
interface PromptTemplateSelectionState {
  selectedTemplateId: number | null;
  previewTemplateId: number | null;
  previewContent: string | null;
  searchKeyword: string;
}
```

### ToolSelectionState

State for Stage 3.

```typescript
interface ToolSelectionState {
  selectedToolIds: Set<number>;
  expandedCategories: Set<string>;
}
```

## Validation Rules

### Basic Info Stage

| Field | Rule | Error Message |
|-------|------|---------------|
| name | Required, non-empty | "Agent name is required" |
| name | Max 100 characters | "Name must be 100 characters or less" |
| specialty | Max 200 characters | "Specialty must be 200 characters or less" |
| temperature | 0.0 - 2.0 | "Temperature must be between 0.0 and 2.0" |
| topP | 0.0 - 1.0 | "Top P must be between 0.0 and 1.0" |
| maxTokens | >= 1 | "Max tokens must be at least 1" |
| maxRuntime | >= 1 | "Max runtime must be at least 1 second" |

### Prompt Template Stage

| Field | Rule | Error Message |
|-------|------|---------------|
| promptTemplateId | Optional | N/A - template selection is optional |

### Tools Stage

| Field | Rule | Error Message |
|-------|------|---------------|
| toolIds | Optional, array of valid IDs | N/A - tool selection is optional |

## State Transitions

### Stage Navigation

```
[Any Stage] --click stepper--> [Target Stage]
                               |
                               v
                    [Check isDirty]
                         |
            +-----------+-----------+
            |                       |
         isDirty               !isDirty
            |                       |
            v                       v
    [Show Confirm Dialog]    [Navigate to Target]
            |
    +-------+-------+
    |               |
  Save           Discard
    |               |
    v               v
[Save & Navigate] [Navigate to Target]
```

### Save Flow

```
[Click Save] --> [Validate Form]
                      |
         +-----------+-----------+
         |                       |
      Valid                  Invalid
         |                       |
         v                       v
   [Call API]             [Show Errors]
         |
    +----+----+
    |         |
 Success    Error
    |         |
    v         v
[Update State] [Show Error Toast]
[Mark Completed]
```

## Relationships

```
Agent (1) -----> (0..1) PromptTemplate
  |
  +-------------> (0..*) Tool
                    |
                    +----> (1) ToolCategory
```

- An Agent can have zero or one PromptTemplate assigned
- An Agent can have zero or more Tools assigned
- Each Tool belongs to exactly one ToolCategory
- Tool assignment uses full replacement semantics (sending new toolIds replaces all previous assignments)
