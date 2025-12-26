# Research: URL Routing and Navigation History

## Current State Analysis

### Existing Navigation Implementation

The application currently uses React state for navigation in `App.tsx`:

```typescript
const [currentView, setCurrentView] = useState<'dashboard' | 'diagnosis' | 'resources' | ...>('dashboard');
const [selectedTopologyId, setSelectedTopologyId] = useState<string | null>(null);
const [selectedApiResourceId, setSelectedApiResourceId] = useState<number | null>(null);
```

Navigation is performed via callbacks:
```typescript
// Example: TopologiesManagement
onEnter={(id) => { setSelectedTopologyId(id); setCurrentView('topology-detail'); }}

// Example: ResourceManagement
onViewDetail={(resource) => { setSelectedApiResourceId(resource.id); setCurrentView('api-resource-detail'); }}
```

**Problems with current approach:**
1. URLs don't change when navigating (always shows root URL)
2. Browser back/forward buttons don't work
3. Cannot bookmark or share specific pages
4. Cannot directly access a page via URL
5. Page refresh loses current view

### Views to Route

| Current View State | Proposed URL | Parameters |
|-------------------|--------------|------------|
| `dashboard` | `/` or `/dashboard` | none |
| `topologies` | `/topologies` | none |
| `topology-detail` | `/topologies/:id` | `id: string` |
| `resources` | `/resources` | none |
| `api-resource-detail` | `/resources/:id` | `id: number` |
| `agents` | `/agents` | none |
| `prompts` | `/agents/prompts` | none |
| `models` | `/agents/models` | none |
| `tools` | `/agents/tools` | none |
| `reports` | `/reports` | none |
| `report-detail` | `/reports/:id` | `id: string` |
| `report-templates` | `/reports/templates` | none |
| `discovery` | `/discovery` | none |
| `scanner` | `/scanner` | none |
| `diagnosis` | `/diagnosis` | none |

## Technology Decision: React Router v6

### Decision
Use **React Router DOM v6** as the routing library.

### Rationale
1. **Industry Standard**: React Router is the de-facto routing solution for React applications
2. **React 18 Compatibility**: v6 is fully compatible with React 18 and concurrent features
3. **Declarative Routing**: Route configuration via JSX components
4. **Built-in Hooks**: `useNavigate`, `useParams`, `useLocation`, `useSearchParams`
5. **Nested Routes**: Supports layout routes for shared navigation
6. **Active Community**: Well-maintained with extensive documentation

### Alternatives Considered

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| React Router v6 | Industry standard, hooks-based, nested routes | Learning curve for v5 users | **SELECTED** |
| TanStack Router | Type-safe, file-based routing option | Newer, smaller community | Not selected |
| Wouter | Lightweight (~1.5KB) | Fewer features, less ecosystem | Not selected |
| Custom (History API) | No dependencies | More code to maintain, edge cases | Not selected |

## Migration Strategy

### Approach: Incremental Migration

Rather than a big-bang rewrite, migrate incrementally:

1. **Phase 1**: Install React Router, wrap app with `BrowserRouter`
2. **Phase 2**: Create route configuration alongside existing switch statement
3. **Phase 3**: Migrate one route at a time, starting with simple routes (dashboard, topologies list)
4. **Phase 4**: Migrate detail pages (topology detail, resource detail)
5. **Phase 5**: Remove old state-based navigation code
6. **Phase 6**: Update component props to use hooks instead of callbacks

### Key Migration Patterns

#### Before (State-based):
```typescript
// Parent component
const [selectedId, setSelectedId] = useState<number | null>(null);

<ChildComponent
  onViewDetail={(id) => { setSelectedId(id); setCurrentView('detail'); }}
/>

// Rendering
{currentView === 'detail' && selectedId && <DetailView id={selectedId} />}
```

#### After (URL-based):
```typescript
// Route configuration
<Route path="/items/:id" element={<DetailView />} />

// Child component
const navigate = useNavigate();
<button onClick={() => navigate(`/items/${id}`)}>View</button>

// Detail component
const { id } = useParams();
```

## Browser History Considerations

### Back Button Behavior

React Router automatically manages browser history. Key considerations:

1. **Default behavior**: Back button returns to previous URL in history stack
2. **Replace vs Push**: Use `navigate(path, { replace: true })` to replace current entry (for redirects)
3. **State preservation**: Router preserves scroll position by default

### Context-Aware Back Navigation

For the "back to previous page" requirement (topology detail → origin page):

**Solution**: Use `navigate(-1)` or store origin in location state

```typescript
// When navigating TO topology detail
navigate(`/topologies/${id}`, { state: { from: location.pathname } });

// Back button in TopologyDetailView
const location = useLocation();
const navigate = useNavigate();

const handleBack = () => {
  // If we have history, go back; otherwise, go to default
  if (location.state?.from) {
    navigate(location.state.from);
  } else {
    navigate('/topologies');
  }
};
```

**Better Solution**: Simply use `navigate(-1)` which leverages browser history:
```typescript
const handleBack = () => {
  navigate(-1); // Go to actual previous page in history
};
```

## Vite Configuration

For SPA routing with Vite, configure the dev server to redirect all requests to `index.html`:

```typescript
// vite.config.ts (likely already configured)
export default defineConfig({
  // ...existing config
  server: {
    // Ensure history fallback for SPA routing
    historyApiFallback: true, // Usually default in Vite
  },
});
```

For production, the server (nginx, etc.) must also be configured for SPA routing.

## Testing Strategy

### E2E Tests (Playwright)

```typescript
test('can navigate via URL directly', async ({ page }) => {
  await page.goto('/topologies/123');
  await expect(page.locator('h1')).toContainText('Topology');
});

test('browser back button works', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Topologies');
  await page.click('[data-testid="topology-card-1"]');
  await page.goBack();
  await expect(page).toHaveURL('/topologies');
});
```

## Dependencies to Add

```json
{
  "dependencies": {
    "react-router-dom": "^6.28.0"
  }
}
```

No additional type packages needed - `react-router-dom` includes TypeScript types.
