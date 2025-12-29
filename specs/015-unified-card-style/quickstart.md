# Quickstart: Unified Card Style

## Overview

This feature unifies the card header layout across all management pages so that the icon and name appear on the same horizontal line with vertical centering.

## Before & After

### Before (Current Pattern)
```
┌────────────────────────────────────┐
│ [Icon]                    [Status] │
│                                    │
│ Resource Name                      │
│ Subtitle/Type                      │
│ ...content...                      │
└────────────────────────────────────┘
```

### After (Unified Pattern)
```
┌────────────────────────────────────┐
│ [Icon] Resource Name      [Status] │
│        Subtitle/Type               │
│ ...content...                      │
└────────────────────────────────────┘
```

## Implementation Pattern

Apply this Tailwind CSS pattern to each card's header section:

```tsx
<div className="flex justify-between items-start mb-4">
  {/* Icon + Name (left side) */}
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg shrink-0 {iconStyles}">
      <Icon size={20} />
    </div>
    <div className="min-w-0">
      <h3 className="text-base font-bold text-white truncate">{name}</h3>
      <div className="text-[9px] text-slate-500">{subtitle}</div>
    </div>
  </div>
  {/* Status badge (right side) */}
  <div className="shrink-0">{statusBadge}</div>
</div>
```

## Key Classes

| Class | Purpose |
|-------|---------|
| `flex items-center gap-3` | Horizontal layout, vertical centering |
| `shrink-0` | Prevent icon from shrinking |
| `min-w-0` | Allow text to shrink for truncation |
| `truncate` | Ellipsis on long names |

## Pages to Update

1. `components/ResourceManagement.tsx`
2. `components/AgentManagement.tsx`
3. `components/ReportManagement.tsx`
4. `components/ReportTemplateManagement.tsx`
5. `components/ToolManagement.tsx`
6. `components/tool/CategoryManagement.tsx`
7. `components/TopologiesManagement.tsx`
8. `components/PromptManagement.tsx`
9. `components/ModelManagement.tsx`

## Verification

After updating each page:
1. Run `npm run build` to ensure no TypeScript errors
2. Navigate to the page in card view mode
3. Verify icon and name are horizontally aligned
4. Test with a long name to ensure truncation works
5. Verify responsive behavior on different screen sizes
