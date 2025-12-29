# Research: Unified Card Style

**Feature**: 015-unified-card-style
**Date**: 2025-12-29

## Overview

This research documents the findings from analyzing the current card implementations across all management pages and establishes the unified pattern to be applied.

## Decision 1: Card Header Layout Pattern

**Decision**: Use `flex items-center gap-3` wrapper around icon and name elements

**Rationale**:
- Flexbox with `items-center` provides vertical centering
- `gap-3` (12px) provides consistent spacing matching existing UI patterns
- Pattern is already partially used in some components (e.g., list view rows)

**Alternatives Considered**:
- CSS Grid: More complex, overkill for two-element layout
- Inline-flex: No benefit over regular flex
- Absolute positioning: Fragile, not responsive

## Decision 2: Text Truncation Strategy

**Decision**: Use `min-w-0` on text container with `truncate` on heading

**Rationale**:
- `min-w-0` allows flex child to shrink below content width
- `truncate` applies `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- Prevents long names from breaking card layout

**Alternatives Considered**:
- `line-clamp-1`: Works but adds unnecessary CSS (webkit prefixes)
- Fixed max-width: Not responsive, may cut off names prematurely

## Decision 3: Icon Container Sizing

**Decision**: Add `shrink-0` to icon container to prevent shrinking

**Rationale**:
- Icons should maintain consistent size regardless of card width
- Prevents icon from being compressed when name is long

**Alternatives Considered**:
- Fixed width/height: Less flexible, harder to maintain

## Decision 4: Implementation Approach

**Decision**: Direct inline CSS updates to each management page (Option A)

**Rationale**:
- Each page has slightly different badge/status configurations
- Creating a flexible component would require many props and conditional rendering
- Direct updates are simpler to review and less risky
- Can extract to shared component later if patterns stabilize

**Alternatives Considered**:
- Shared CardHeader component: Too much variation in status/badge areas
- CSS-only solution via global styles: Would require class name changes anyway

## Current Card Implementations Analyzed

| Component | Card View Location | Status Badge | Special Features |
|-----------|-------------------|--------------|------------------|
| ResourceManagement.tsx | Line 350 | Status color-coded | Type icon varies |
| AgentManagement.tsx | Line 260 | Role + status badges | Toggle on agent type |
| ReportManagement.tsx | Line 200 | Type + status badges | Report type colors |
| ReportTemplateManagement.tsx | Line 212 | Category badge | Category colors |
| ToolManagement.tsx | Line 373 | Status badge | Executor icon varies |
| CategoryManagement.tsx | Line ~100 | None | Dynamic category color |
| TopologiesManagement.tsx | Line 262 | Node count + active | Active state highlight |
| PromptManagement.tsx | Line 304 | Usage + version badges | Usage type colors |
| ModelManagement.tsx | Line 277 | Active toggle switch | Provider icon |

## Unified Pattern Template

```tsx
{/* Unified Card Header Pattern */}
<div className="flex justify-between items-start mb-4">
  {/* Left: Icon + Name Group */}
  <div className="flex items-center gap-3">
    {/* Icon Container - varies per component */}
    <div className={`p-2 rounded-lg shrink-0 ${iconStyles}`}>
      <Icon size={20} />
    </div>
    {/* Name + Subtitle Container */}
    <div className="min-w-0">
      <h3 className="text-base font-bold text-white truncate group-hover:text-cyan-400 transition-colors leading-tight">
        {name}
      </h3>
      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] opacity-80">
        {subtitle}
      </div>
    </div>
  </div>
  {/* Right: Status/Badge Area - varies per component */}
  <div className="shrink-0">
    {statusBadge}
  </div>
</div>
```

## Key CSS Classes Reference

| Class | Tailwind Value | Purpose |
|-------|---------------|---------|
| `flex` | `display: flex` | Flex container |
| `items-center` | `align-items: center` | Vertical centering |
| `gap-3` | `gap: 0.75rem (12px)` | Spacing between icon and text |
| `shrink-0` | `flex-shrink: 0` | Prevent element from shrinking |
| `min-w-0` | `min-width: 0` | Allow shrinking for truncation |
| `truncate` | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` | Text ellipsis |

## Testing Checklist

After implementation, verify on each page:
- [ ] Icon and name appear on same horizontal line
- [ ] Icon and name are vertically centered
- [ ] Long names truncate with ellipsis
- [ ] Status badges still visible on right side
- [ ] Card maintains proper height
- [ ] Responsive behavior preserved (grid columns adjust)
- [ ] Hover states work correctly
- [ ] Click interactions preserved
