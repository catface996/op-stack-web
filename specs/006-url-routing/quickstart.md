# Quickstart: URL Routing Implementation

## Prerequisites

1. Node.js and npm installed
2. Project dependencies installed (`npm install`)

## Setup

### 1. Install React Router

```bash
npm install react-router-dom
```

### 2. Wrap Application with BrowserRouter

In `index.tsx`:

```tsx
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

### 3. Define Routes

In `App.tsx`, replace the switch statement with Routes:

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="topologies" element={<TopologiesManagement />} />
        <Route path="topologies/:id" element={<TopologyDetailView />} />
        <Route path="resources" element={<ResourceManagement />} />
        <Route path="resources/:id" element={<ApiResourceDetailView />} />
        {/* ... more routes */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
```

## Common Patterns

### Navigate Programmatically

```tsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/topologies/123');
  };

  const handleBack = () => {
    navigate(-1); // Go to previous page in history
  };

  return <button onClick={handleClick}>View Topology</button>;
}
```

### Read URL Parameters

```tsx
import { useParams } from 'react-router-dom';

function TopologyDetailView() {
  const { id } = useParams<{ id: string }>();

  // id is now available as a string
  const topologyId = parseInt(id!, 10);

  // Fetch topology data...
}
```

### Read Query Parameters

```tsx
import { useSearchParams } from 'react-router-dom';

function ApiResourceDetailView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'info';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
  );
}
```

### Active Navigation Links

```tsx
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <nav>
      <NavLink
        to="/topologies"
        className={({ isActive }) => isActive ? 'nav-active' : 'nav-link'}
      >
        Topologies
      </NavLink>
    </nav>
  );
}
```

## Migration Checklist

### For Each Component

1. [ ] Remove navigation callback props (`onBack`, `onViewDetail`, etc.)
2. [ ] Add `useNavigate` hook
3. [ ] Replace callback calls with `navigate()` calls
4. [ ] For detail views, add `useParams` to read ID from URL
5. [ ] Remove ID prop (now from URL)

### Example Migration

**Before:**
```tsx
interface Props {
  topologyId: string;
  onBack: () => void;
}

function TopologyDetailView({ topologyId, onBack }: Props) {
  return (
    <button onClick={onBack}>Back</button>
  );
}
```

**After:**
```tsx
import { useParams, useNavigate } from 'react-router-dom';

function TopologyDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate(-1)}>Back</button>
  );
}
```

## Testing

### Manual Testing

1. Navigate to each page via sidebar
2. Verify URL changes in browser address bar
3. Copy URL, open in new tab - should load same page
4. Use browser back/forward buttons
5. Refresh page - should stay on same view

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('direct URL navigation works', async ({ page }) => {
  await page.goto('/topologies');
  await expect(page).toHaveURL('/topologies');
  await expect(page.locator('h1')).toContainText('Topologies');
});

test('browser back button works', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-nav="topologies"]');
  await expect(page).toHaveURL('/topologies');
  await page.goBack();
  await expect(page).toHaveURL('/');
});
```

## Troubleshooting

### Page shows blank on direct URL access

**Cause**: Server not configured for SPA routing

**Solution**: Configure server to return `index.html` for all routes

For Vite dev server, this should work by default. For production:
- Nginx: `try_files $uri /index.html;`
- Vercel: Add `rewrites` in `vercel.json`

### Navigation doesn't update URL

**Cause**: Using state-based navigation instead of router

**Solution**: Replace `setCurrentView('...')` with `navigate('/...')`

### Back button goes to wrong page

**Cause**: Using `navigate('/path')` instead of `navigate(-1)`

**Solution**: Use `navigate(-1)` for back buttons to respect browser history
