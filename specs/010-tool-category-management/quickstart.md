# Quickstart: Tool Category Management

## Prerequisites

- Node.js 18+
- npm
- Backend gateway running at localhost:8080 with categories API available

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Access the application at http://localhost:3000

## Feature Overview

This feature adds tool category management to the existing Tools management page.

### Key Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `services/api/categories.ts` | CREATE | Categories API service |
| `services/hooks/useCategories.ts` | CREATE | Category data fetching hook |
| `components/tool/CategoryManagement.tsx` | CREATE | Category CRUD UI component |
| `components/ToolManagement.tsx` | MODIFY | Add category tab and integration |
| `types.ts` | MODIFY | Add category request/response types |

### API Endpoints

All endpoints use POST method:

```
POST /api/tools/v1/categories/list    - List categories
POST /api/tools/v1/categories/create  - Create category
POST /api/tools/v1/categories/get     - Get category by ID
POST /api/tools/v1/categories/update  - Update category
POST /api/tools/v1/categories/delete  - Delete category
```

### Testing the Feature

1. Navigate to "工具管理" from the main menu
2. Click "类目" tab to view categories
3. Click "新建类目" to create a category
4. Edit/delete categories using action buttons
5. Assign categories to tools via tool edit form

### Validation Rules

- Category name: required, unique
- Category description: optional
- Categories with assigned tools cannot be deleted

## Code Patterns to Follow

### API Service Pattern (from tools.ts)

```typescript
import { apiPostRaw } from './client';

const CATEGORIES_API = {
  LIST: '/api/tools/v1/categories/list',
  // ...
} as const;

export async function listCategories(request: CategoryListRequest): Promise<CategoryListResponse> {
  return apiPostRaw<CategoryListRequest, CategoryListResponse>(CATEGORIES_API.LIST, request);
}
```

### Hook Pattern (from useTools.ts)

```typescript
export function useCategories(options: UseCategoriesOptions = {}) {
  const [categories, setCategories] = useState<ToolCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch logic with pagination...

  return { categories, loading, error, refresh };
}
```

### Component Pattern (from ToolManagement.tsx)

- Use Lucide React icons
- Use existing ConfirmDialog for deletions
- Show loading states with Loader2 icon
- Display errors with AlertCircle
- Follow existing styling (Tailwind classes)
