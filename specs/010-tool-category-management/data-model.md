# Data Model: Tool Category Management

## Entities

### ToolCategory (Updated - Flat Structure)

Represents a category for organizing tools. Categories are flat (no hierarchy).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Unique identifier |
| name | string | Yes | Display name, must be unique |
| description | string \| null | No | Category description |
| created_at | string (ISO 8601) | Yes | Creation timestamp |
| updated_at | string (ISO 8601) | Yes | Last update timestamp |

**Note**: The existing `ToolCategoryDTO` in types.ts has `parent_id` which should be removed or ignored as categories are flat per spec clarification.

### Tool (Existing - Modified)

The existing ToolDTO already has `category_id` and `category` fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| category_id | string \| null | No | Reference to category |
| category | ToolCategoryDTO \| null | No | Populated category object |

## TypeScript Types

### Request Types

```typescript
// List categories with pagination
interface ToolCategoryListRequest {
  page?: number;
  page_size?: number;
}

// Create a new category
interface ToolCategoryCreateRequest {
  name: string;
  description?: string;
}

// Update an existing category
interface ToolCategoryUpdateRequest {
  category_id: string;
  name?: string;
  description?: string;
}

// Get or delete a category by ID
interface ToolCategoryIdRequest {
  category_id: string;
}
```

### Response Types

```typescript
// Single category response (already exists as ToolCategoryDTO)
interface ToolCategoryDTO {
  id: string;
  name: string;
  description: string | null;
  // parent_id: string | null;  // IGNORE - not used in flat structure
  created_at: string;
  updated_at: string;
}

// List response
interface ToolCategoryListResponse {
  items: ToolCategoryDTO[];
  total: number;
  page: number;
  page_size: number;
}
```

## Validation Rules

### Category Name
- Required, cannot be empty
- Must be unique across all categories
- Recommended max length: 50 characters

### Category Description
- Optional
- Recommended max length: 200 characters

## State Transitions

Categories have no explicit status field. Implicit states:

```
[Create] → Active → [Update] → Active
                  → [Delete] → Removed (if no tools assigned)
```

**Delete Constraint**: Categories with assigned tools cannot be deleted. API returns error.

## Relationships

```
ToolCategory 1 ←——— 0..* Tool
```

- One category can have zero or more tools
- One tool can have zero or one category
- Deleting a category is blocked if tools reference it
