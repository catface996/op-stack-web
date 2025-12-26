# Data Model: Model Management API Integration

**Feature**: 008-model-api-integration
**Date**: 2025-12-26

## Entities

### Model (Primary Entity)

Represents an AI model configuration for the platform.

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | number | Yes (read) | Auto-generated | Unique identifier |
| `name` | string | Yes | Non-empty | Display name |
| `model_id` | string | Yes | Non-empty | Technical model identifier |
| `description` | string | No | - | Optional description |
| `is_active` | boolean | Yes | - | Active/inactive status |
| `max_tokens` | number | No | Positive integer | Token limit |
| `temperature` | number | No | 0.0-2.0 | Sampling temperature |
| `top_p` | number | No | 0.0-1.0 | Nucleus sampling |
| `region` | string | No | - | Deployment region |

### Relationships

- **Model** is standalone entity (no foreign keys)
- Future: May link to PromptTemplate via model selection

## TypeScript Definitions

```typescript
// services/api/types.ts

/**
 * Model entity from backend API
 */
export interface ModelDTO {
  id: number;
  name: string;
  model_id: string;
  description?: string;
  is_active: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  region?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Request for listing models
 */
export interface ModelListRequest {
  page: number;
  size: number;
  is_active?: boolean;  // Optional filter
}

/**
 * Response wrapper for paginated list
 */
export interface ModelListResponse {
  items: ModelDTO[];
  total: number;
  page: number;
  size: number;
}

/**
 * Request for creating a model
 */
export interface ModelCreateRequest {
  name: string;
  model_id: string;
  description?: string;
  is_active?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  region?: string;
}

/**
 * Request for getting a single model
 */
export interface ModelGetRequest {
  id: number;
}

/**
 * Request for updating a model
 */
export interface ModelUpdateRequest {
  id: number;
  name?: string;
  model_id?: string;
  description?: string;
  is_active?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  region?: string;
}

/**
 * Request for deleting a model
 */
export interface ModelDeleteRequest {
  id: number;
}
```

## State Transitions

```
┌─────────────┐
│   Created   │
│ (is_active  │
│   = true)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     Toggle      ┌─────────────┐
│   Active    │◄───────────────►│  Inactive   │
│(is_active   │                 │(is_active   │
│  = true)    │                 │  = false)   │
└──────┬──────┘                 └──────┬──────┘
       │                               │
       │         Delete                │
       └───────────────┬───────────────┘
                       ▼
               ┌─────────────┐
               │   Deleted   │
               │ (removed)   │
               └─────────────┘
```

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `name` | Required, non-empty | "Name is required" |
| `model_id` | Required, non-empty | "Model ID is required" |
| `temperature` | 0.0 ≤ value ≤ 2.0 | "Temperature must be between 0 and 2" |
| `top_p` | 0.0 ≤ value ≤ 1.0 | "Top P must be between 0 and 1" |
| `max_tokens` | Positive integer | "Max tokens must be positive" |

## Migration Notes

### Frontend Type Deprecation

The existing `AIModel` type in `types.ts` will be deprecated:

```typescript
// DEPRECATED - use ModelDTO instead
interface AIModel {
  id: string;           // → ModelDTO.model_id (display) or id (number)
  name: string;         // → ModelDTO.name
  provider: string;     // → removed (not in backend)
  contextWindow: number;// → ModelDTO.max_tokens
  type: string;         // → removed (not in backend)
  status: string;       // → ModelDTO.is_active (boolean)
}
```

### Field Mapping

| Old (AIModel) | New (ModelDTO) | Notes |
|---------------|----------------|-------|
| `id` (string) | `id` (number) | Changed type |
| `name` | `name` | Same |
| `provider` | - | Removed |
| `contextWindow` | `max_tokens` | Renamed |
| `type` | - | Removed |
| `status` | `is_active` | Changed to boolean |
| - | `model_id` | New field |
| - | `description` | New field |
| - | `temperature` | New field |
| - | `top_p` | New field |
| - | `region` | New field |
