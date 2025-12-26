# Research: Model Management API Integration

**Feature**: 008-model-api-integration
**Date**: 2025-12-26

## Research Tasks

### 1. Backend API Structure

**Task**: Understand Model API endpoints and request/response formats

**Findings**:
- Backend runs on port 7070 (separate from main API at 8080)
- All endpoints use POST method (consistent with existing API pattern)
- Swagger documentation available at `http://localhost:7070/swagger.json`

**Decision**: Use POST-only pattern matching existing `apiPost` client
**Rationale**: Maintains consistency with resource/topology APIs
**Alternatives considered**: REST conventions (GET/PUT/DELETE) - rejected for consistency

### 2. Field Mapping: Frontend vs Backend

**Task**: Map current frontend AIModel type to backend Model schema

**Current Frontend Type** (`types.ts`):
```typescript
interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  type: 'Text' | 'Multimodal' | 'Audio';
  status: 'Active' | 'Deprecated';
}
```

**Backend Schema** (from swagger.json):
```typescript
interface Model {
  id: number;
  name: string;
  model_id: string;
  description?: string;
  is_active: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  region?: string;
}
```

**Decision**: Create new `ModelDTO` type matching backend, deprecate `AIModel`
**Rationale**: Spec requirement - "字段命名以后端为准" (field names follow backend)
**Alternatives considered**: Adapter layer to translate - rejected as unnecessary complexity

### 3. Existing Hook Patterns

**Task**: Analyze feature 007 hooks for reusable patterns

**Findings** from `usePromptTemplates.ts`:
- Uses `useState` for data, loading, error states
- `useEffect` for initial fetch
- `refresh` function for manual refetch
- Pagination handled via request params

**Findings** from `usePromptTemplateMutations.ts`:
- Separate hook for mutation operations
- Returns `{ createX, updateX, deleteX, loading, error }`
- Accepts callback for post-mutation refresh

**Decision**: Follow same hook structure for models
**Rationale**: Proven pattern, consistent codebase
**Alternatives considered**: Single combined hook - rejected for separation of concerns

### 4. Proxy Configuration

**Task**: Configure Vite proxy for Model API

**Decision**: Already configured in `vite.config.ts`
```typescript
'/api/v1/models': {
  target: 'http://localhost:7070',
  changeOrigin: true,
  secure: false,
}
```
**Rationale**: More specific path matches first, falls through to default 8080 proxy
**Alternatives considered**: Environment variable for API URL - deferred to gateway migration

### 5. Form Validation Strategy

**Task**: Determine validation approach for model form

**Decision**: Client-side validation before API call
- Required: `name`, `model_id`
- Range: `temperature` (0.0-2.0), `top_p` (0.0-1.0)
- Optional: `description`, `max_tokens`, `region`

**Rationale**: Better UX with immediate feedback
**Alternatives considered**: Server-only validation - rejected for poor UX

### 6. Timeout Implementation

**Task**: Implement 10-second API timeout

**Decision**: Use AbortController with 10000ms timeout in API client
**Rationale**: Clarification session specified 10s threshold
**Alternatives considered**:
- 5s (too aggressive for slow networks)
- 30s (too long for user experience)

## Summary

All research tasks resolved. No NEEDS CLARIFICATION items remaining.

| Item | Resolution |
|------|------------|
| API pattern | POST-only, matching existing client |
| Type mapping | New `ModelDTO` matching backend schema |
| Hook structure | Separate list/mutation hooks |
| Proxy config | Already configured |
| Validation | Client-side with defined ranges |
| Timeout | 10 seconds via AbortController |
