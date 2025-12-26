# Data Model: URL Routing

## Route Definitions

### Route Entity

A route maps a URL pattern to a React component with optional parameters.

| Property | Type | Description |
|----------|------|-------------|
| path | string | URL path pattern (e.g., `/topologies/:id`) |
| element | ReactElement | Component to render |
| children | Route[] | Nested routes (optional) |

### Route Parameters

| Route | Parameter | Type | Source | Validation |
|-------|-----------|------|--------|------------|
| `/topologies/:id` | id | string | URL path | Must be numeric string |
| `/resources/:id` | id | string | URL path | Must be numeric string |
| `/reports/:id` | id | string | URL path | Any string |
| `/resources/:id?tab=X` | tab | string | Query param | One of: info, topologies, agents, history |

## Route Configuration

```typescript
// Route paths as constants
export const ROUTES = {
  DASHBOARD: '/',
  TOPOLOGIES: '/topologies',
  TOPOLOGY_DETAIL: '/topologies/:id',
  RESOURCES: '/resources',
  RESOURCE_DETAIL: '/resources/:id',
  AGENTS: '/agents',
  AGENTS_PROMPTS: '/agents/prompts',
  AGENTS_MODELS: '/agents/models',
  AGENTS_TOOLS: '/agents/tools',
  REPORTS: '/reports',
  REPORT_DETAIL: '/reports/:id',
  REPORT_TEMPLATES: '/reports/templates',
  DISCOVERY: '/discovery',
  SCANNER: '/scanner',
  DIAGNOSIS: '/diagnosis',
} as const;

// Helper to generate paths with parameters
export const paths = {
  topologyDetail: (id: string | number) => `/topologies/${id}`,
  resourceDetail: (id: string | number) => `/resources/${id}`,
  reportDetail: (id: string) => `/reports/${id}`,
};
```

## Navigation State

### Location State (for context-aware back navigation)

```typescript
interface NavigationState {
  from?: string;  // Previous path (optional, for fallback)
}

// Usage
navigate('/topologies/123', { state: { from: '/resources/42' } });
```

**Note**: In practice, `navigate(-1)` is preferred as it uses actual browser history.

## Component Props Changes

### Before (Callback-based)

```typescript
interface TopologiesManagementProps {
  onEnter: (id: string) => void;
  onNavigateToDiagnosis: () => void;
  // ...other props
}
```

### After (Router-based)

```typescript
interface TopologiesManagementProps {
  // Navigation callbacks removed - components use useNavigate() internally
  // ...other props remain
}
```

## URL Query Parameters

For pages with tabs or filters:

```typescript
// Reading query params
const [searchParams] = useSearchParams();
const activeTab = searchParams.get('tab') || 'info';

// Setting query params
const setActiveTab = (tab: string) => {
  setSearchParams({ tab });
};
```

## Route Hierarchy

```
/                          → Dashboard
├── /topologies            → TopologiesManagement
│   └── /topologies/:id    → TopologyDetailView
├── /resources             → ResourceManagement
│   └── /resources/:id     → ApiResourceDetailView
├── /agents                → AgentManagement
│   ├── /agents/prompts    → PromptManagement
│   ├── /agents/models     → ModelManagement
│   └── /agents/tools      → ToolManagement
├── /reports               → ReportManagement
│   ├── /reports/:id       → ReportDetailView
│   └── /reports/templates → ReportTemplateManagement
├── /discovery             → Discovery
├── /scanner               → Scanner
├── /diagnosis             → Diagnosis
└── /*                     → NotFound (404)
```

## Error States

### Not Found (404)

When route matches but resource doesn't exist:
- Topology ID not found → Show error in TopologyDetailView
- Resource ID not found → Show error in ApiResourceDetailView

When route doesn't match any pattern:
- Render `NotFound` component
- Provide link back to dashboard
