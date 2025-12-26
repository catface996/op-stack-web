# Quickstart: Topologies Management Page

**Feature**: 003-topologies-management
**Date**: 2025-12-25

## Prerequisites

- Node.js 18+ installed
- Backend API running on `localhost:8080`
- Project dependencies installed (`npm install`)

## Setup Steps

### 1. Start Development Server

```bash
cd /Users/catface/Documents/code/GitHub/op-stack/op-stack-web
npm run dev
```

The app will start on `http://localhost:3000` (or next available port).

### 2. Verify Backend Connection

Ensure the backend is running and accessible:

```bash
curl -X POST http://localhost:8080/api/v1/resources/query \
  -H "Content-Type: application/json" \
  -d '{"page":1,"size":10,"operatorId":1}'
```

Expected: JSON response with resource list (or empty list).

### 3. Verify Topology API

Test the members API (from spec 002):

```bash
# Test member query (use a valid subgraphId)
curl -X POST http://localhost:8080/api/v1/resources/members/query \
  -H "Content-Type: application/json" \
  -d '{"subgraphId":1,"page":1,"size":10,"operatorId":1}'
```

## Feature Verification

### Test 1: View Topology List

1. Open `http://localhost:3000`
2. Click "Topologies" in the top navigation
3. **Expected**: List view loads (may be empty if no Topologies exist)
4. **Verify**: No console errors, loading state shows during fetch

### Test 2: Create Topology

1. Click "Create Topology" button
2. Fill in: Name = "Test Topology", Description = "Test"
3. Click "Save"
4. **Expected**: New Topology appears in list
5. **Verify**: Network tab shows POST to `/api/v1/resources/create`

### Test 3: Edit Topology

1. Click "Edit" (gear icon) on a Topology
2. Change the description
3. Click "Save"
4. **Expected**: Changes reflected in list
5. **Verify**: Network tab shows POST to `/api/v1/resources/update`

### Test 4: Delete Topology

1. Click "Delete" (trash icon) on a Topology
2. Confirm in dialog
3. **Expected**: Topology removed from list
4. **Verify**: Network tab shows POST to `/api/v1/resources/delete`

### Test 5: View Topology Detail & Members

1. Click on a Topology card (or "Explore" button)
2. **Expected**: Navigate to detail view with member list
3. **Verify**: Members list loads (may be empty)

### Test 6: Add Members

1. In Topology detail view, click "Add Members"
2. Select resources from the dialog
3. Click "Add"
4. **Expected**: Selected resources appear in member list
5. **Verify**: Network tab shows POST to `/api/v1/resources/members/add`

### Test 7: Remove Members

1. In Topology detail view, click "Remove" on a member
2. Confirm in dialog
3. **Expected**: Member removed from list
4. **Verify**: Network tab shows POST to `/api/v1/resources/members/remove`

### Test 8: Search & Pagination

1. Type a search term in the search box
2. **Expected**: List filters in real-time (<300ms)
3. Navigate to different pages
4. **Expected**: Pagination works correctly

## Troubleshooting

### Issue: API calls fail with CORS error

**Solution**: Ensure Vite proxy is configured correctly in `vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  },
},
```

### Issue: "No Topologies found" but backend has data

**Solution**: Check if filtering is correct:
1. Verify resources have `attributes.isSubgraph = true`
2. Check Network tab for actual API response
3. Verify filter logic in `useTopologies` hook

### Issue: Version conflict on update

**Solution**: This is expected when another user modified the same record:
1. Refresh the data
2. Re-apply changes
3. Save again

### Issue: Cycle detection error when adding member

**Solution**: This is expected when adding a subgraph that would create circular reference:
1. Review the cycle path shown in error
2. Choose different resources to add

## Development Tips

### Hot Reload
File changes auto-reload. If not working, restart dev server.

### Debug API Calls
Open Browser DevTools → Network tab → Filter by "api"

### Check Component State
Use React DevTools extension to inspect component state and props.

### TypeScript Errors
Run `npx tsc --noEmit` to check for type errors.

## Files to Modify

| File | Changes |
|------|---------|
| `components/TopologiesManagement.tsx` | Replace mock data with API hooks |
| `services/hooks/useTopologies.ts` | New hook for topology list |
| `components/topology/AddMembersDialog.tsx` | New dialog for adding members |
| `components/topology/MembersList.tsx` | New component for member list |
| `App.tsx` | Update topology-detail view routing |
