# Route Contracts

## URL Patterns

| URL Pattern | Component | Parameters | Query Params |
|-------------|-----------|------------|--------------|
| `/` | Dashboard | - | - |
| `/dashboard` | Dashboard | - | - |
| `/topologies` | TopologiesManagement | - | - |
| `/topologies/:id` | TopologyDetailView | `id: string` | - |
| `/resources` | ResourceManagement | - | - |
| `/resources/:id` | ApiResourceDetailView | `id: string` | `tab?: string` |
| `/agents` | AgentManagement | - | - |
| `/agents/prompts` | PromptManagement | - | - |
| `/agents/models` | ModelManagement | - | - |
| `/agents/tools` | ToolManagement | - | - |
| `/reports` | ReportManagement | - | - |
| `/reports/:id` | ReportDetailView | `id: string` | - |
| `/reports/templates` | ReportTemplateManagement | - | - |
| `/discovery` | Discovery | - | - |
| `/scanner` | Scanner | - | - |
| `/diagnosis` | Diagnosis | - | - |
| `/*` | NotFound | - | - |

## Navigation Actions

### Programmatic Navigation

| Action | From | To | Method |
|--------|------|-----|--------|
| View topology detail | TopologiesManagement | TopologyDetailView | `navigate(\`/topologies/${id}\`)` |
| View resource detail | ResourceManagement | ApiResourceDetailView | `navigate(\`/resources/${id}\`)` |
| View topology from resource | ApiResourceDetailView | TopologyDetailView | `navigate(\`/topologies/${id}\`)` |
| Back to list | Detail views | List views | `navigate(-1)` |
| Switch main section | Sidebar | Any main view | `navigate(path)` |

### Link-based Navigation

Sidebar navigation items should use `<NavLink>` for automatic active state styling:

```tsx
<NavLink to="/topologies" className={({ isActive }) => isActive ? 'active' : ''}>
  Topologies
</NavLink>
```

## Route Guards

No authentication guards required (authentication handled separately per assumptions).

## Scroll Behavior

- Default: Scroll to top on navigation
- Back navigation: Restore previous scroll position (browser default)

## URL Validation

| Parameter | Valid | Invalid | Handling |
|-----------|-------|---------|----------|
| Topology ID | `/topologies/123` | `/topologies/abc` | Component shows error if API returns 404 |
| Resource ID | `/resources/42` | `/resources/xyz` | Component shows error if API returns 404 |
| Unknown route | - | `/unknown/path` | Show NotFound component |

## Browser History Behavior

| Action | History Effect |
|--------|----------------|
| Click sidebar item | Push new entry |
| Click card to view detail | Push new entry |
| Click "Back" button in UI | `navigate(-1)` - go back in history |
| Browser back button | Pop entry (browser native) |
| Browser forward button | Push entry (browser native) |
| Direct URL entry | Replace entry |
| Page refresh | No change to history |

## State Preservation

| State Type | Preserved Across Navigation | Notes |
|------------|----------------------------|-------|
| URL params | Yes | Part of URL |
| Query params | Yes | Part of URL |
| Form inputs | No | Clear on navigation (unless explicitly managed) |
| Scroll position | Yes (on back) | Browser managed |
| Component state | No | Remounted on route change |
