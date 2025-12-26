# Quickstart: Model Management API Integration

**Feature**: 008-model-api-integration
**Date**: 2025-12-26

## Prerequisites

1. **Backend Service Running**
   ```bash
   # Model API should be running on port 7070
   curl http://localhost:7070/swagger.json
   ```

2. **Frontend Dev Server**
   ```bash
   npm run dev
   # Runs on http://localhost:3000
   # Proxy configured: /api/v1/models/* → localhost:7070
   ```

## Quick Verification

### 1. Test API Proxy
```bash
# From terminal, test proxy is working
curl -X POST http://localhost:3000/api/v1/models/list \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "size": 10, "operatorId": 1}'
```

### 2. Check UI
1. Navigate to http://localhost:3000
2. Click "Neural Assets" / Model Management
3. Verify models load from API (not mock data)

## Development Workflow

### Adding New Types
```typescript
// services/api/types.ts
export interface ModelDTO {
  id: number;
  name: string;
  model_id: string;
  // ... see data-model.md
}
```

### Creating API Functions
```typescript
// services/api/models.ts
import { apiPost } from './client';
import type { ModelListRequest, ModelListResponse } from './types';

export async function listModels(request: ModelListRequest): Promise<ModelListResponse> {
  return apiPost('/api/v1/models/list', request);
}
```

### Creating Hooks
```typescript
// services/hooks/useModels.ts
import { useState, useEffect } from 'react';
import { listModels } from '../api/models';

export function useModels(page: number, size: number, isActiveFilter?: boolean) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ... implementation

  return { models, loading, error, refresh, totalPages };
}
```

### Updating Component
```typescript
// components/ModelManagement.tsx
import { useModels } from '../services/hooks/useModels';
import { useModelMutations } from '../services/hooks/useModelMutations';

const ModelManagement = () => {
  const { models, loading, error, refresh, totalPages } = useModels(page, 8);
  const { createModel, updateModel, deleteModel } = useModelMutations();

  // Replace local state with hook data
  // ...
};
```

## File Checklist

### New Files to Create
- [ ] `services/api/models.ts` - API functions
- [ ] `services/hooks/useModels.ts` - List hook
- [ ] `services/hooks/useModelMutations.ts` - Mutation hook

### Files to Modify
- [ ] `services/api/types.ts` - Add Model types
- [ ] `services/api/index.ts` - Export models
- [ ] `services/hooks/index.ts` - Export new hooks
- [ ] `components/ModelManagement.tsx` - Use hooks

## Testing

### Manual Testing
1. **List**: Page loads, models display, pagination works
2. **Create**: New model form, submit, appears in list
3. **Edit**: Click model, modify, save, changes persist
4. **Delete**: Delete button, confirm, model removed
5. **Toggle**: Status toggle updates is_active
6. **Filter**: Active filter shows/hides inactive models
7. **Error**: Stop backend, verify error state displays
8. **Timeout**: Slow network, verify 10s timeout

### E2E Testing (Playwright)
```bash
npx playwright test model-management
```

## Troubleshooting

### "Network Error" on API calls
- Check backend is running on port 7070
- Verify vite proxy config in `vite.config.ts`
- Check browser Network tab for actual request URL

### Models not updating
- Check `refresh()` is called after mutations
- Verify response data structure matches types

### Type errors
- Ensure `ModelDTO` matches backend response exactly
- Check optional fields are marked with `?`
