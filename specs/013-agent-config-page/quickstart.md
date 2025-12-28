# Quickstart: Agent Configuration Page

**Feature**: 013-agent-config-page
**Date**: 2025-12-28

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend services running at localhost:8080

## Setup

```bash
# Clone and install (if not already done)
cd op-stack-web
npm install

# Start development server
npm run dev
```

## Development Workflow

### 1. Type Updates First

Update `services/api/types.ts` to add `toolIds` to both request and response types:

```typescript
// In UpdateAgentRequest
toolIds?: number[];

// In AgentDTO
toolIds?: number[];
```

### 2. Hook Updates

Update `services/hooks/useAgents.ts`:
- Add `toolIds` to `AgentWithApiFields` interface
- Update `toFrontendAgent` to map toolIds

### 3. Route Configuration

Add new route in `services/routes.ts`:

```typescript
export const ROUTES = {
  // ... existing routes
  AGENT_CONFIG: '/agents/:id/config',
};

export const paths = {
  // ... existing paths
  agentConfig: (id: string | number) => `/agents/${id}/config`,
};
```

### 4. Component Development Order

Recommended implementation sequence:

1. **ConfigStepper** - Reusable stepper navigation component
2. **BasicInfoStage** - Form with existing fields (adapt from modal)
3. **AgentConfigPage** - Main page layout with stepper integration
4. **PromptTemplateStage** - Template list + preview panel
5. **ToolsStage** - Category accordion + tool checkboxes
6. **AgentManagement** - Update to link to new page

### 5. Testing Endpoints

Manual API testing (using curl or REST client):

```bash
# Get agent with toolIds
curl -X POST http://localhost:8080/api/service/v1/agents/get \
  -H "Content-Type: application/json" \
  -d '{"id": 1, "operatorId": 1}'

# Update agent with toolIds
curl -X POST http://localhost:8080/api/service/v1/agents/update \
  -H "Content-Type: application/json" \
  -d '{"id": 1, "toolIds": [1, 2, 3], "operatorId": 1}'

# List prompt templates
curl -X POST http://localhost:8080/api/service/v1/prompt-templates/list \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "size": 20, "operatorId": 1}'

# List tool categories
curl -X POST http://localhost:8080/api/tools/v1/categories/list \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "size": 100, "operatorId": 1}'

# List tools by category
curl -X POST http://localhost:8080/api/tools/v1/tools/list \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "size": 100, "category_id": "1", "operatorId": 1}'
```

## Key Implementation Notes

### Stepper Component

```tsx
// Basic stepper structure
const stages = [
  { key: 'basicInfo', label: 'Basic Info', icon: Settings },
  { key: 'promptTemplate', label: 'Prompt Template', icon: FileText },
  { key: 'tools', label: 'Tools', icon: Wrench },
];
```

### Dirty State Tracking

```tsx
// Per-stage dirty tracking
const [isDirty, setIsDirty] = useState(false);

// Compare with initial values on change
useEffect(() => {
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
  setIsDirty(hasChanges);
}, [formData, initialData]);
```

### Navigation Blocking (React Router 7.x)

```tsx
import { useBlocker } from 'react-router-dom';

// Block navigation when dirty
const blocker = useBlocker(
  ({ currentLocation, nextLocation }) =>
    isDirty && currentLocation.pathname !== nextLocation.pathname
);
```

### Tool Selection State

```tsx
// Use Set for efficient lookups
const [selectedToolIds, setSelectedToolIds] = useState<Set<number>>(
  new Set(agent?.toolIds || [])
);

// Toggle tool selection
const toggleTool = (toolId: number) => {
  setSelectedToolIds(prev => {
    const next = new Set(prev);
    if (next.has(toolId)) {
      next.delete(toolId);
    } else {
      next.add(toolId);
    }
    return next;
  });
};

// Convert to array for API
const toolIdsArray = Array.from(selectedToolIds);
```

## File Checklist

New files to create:
- [ ] `components/AgentConfigPage.tsx`
- [ ] `components/agent-config/ConfigStepper.tsx`
- [ ] `components/agent-config/BasicInfoStage.tsx`
- [ ] `components/agent-config/PromptTemplateStage.tsx`
- [ ] `components/agent-config/ToolsStage.tsx`

Files to modify:
- [ ] `services/api/types.ts` - Add toolIds
- [ ] `services/hooks/useAgents.ts` - Map toolIds
- [ ] `services/routes.ts` - Add config route
- [ ] `App.tsx` - Add route component
- [ ] `components/AgentManagement.tsx` - Link to config page

Files to deprecate/remove:
- [ ] `components/AgentConfigModal.tsx` - After migration complete

## Common Issues

### Agent locked during task
If you get HTTP 423 when updating, the agent is currently running a task. Wait for task completion or show read-only mode.

### Tools API different service
Note that tools API uses `/api/tools/v1/...` not `/api/service/v1/...`. This is a different backend service.

### Template content large
Prompt templates can have large content. Consider lazy loading preview only when user clicks to preview.
