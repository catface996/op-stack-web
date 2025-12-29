# Implementation Plan: Unified Card Style

**Branch**: `015-unified-card-style` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-unified-card-style/spec.md`

## Summary

Unify the card header layout across all management pages so that the icon and name appear on the same horizontal line with vertical centering. Currently, cards display the icon in the top-left with the name in a separate row below. The new layout will place the icon and name side-by-side (icon left, name right) while preserving the status badge on the right edge of the card header. This will be achieved through consistent Tailwind CSS patterns applied to each management page, with optional extraction into a shared CardHeader component for maintainability.

## Technical Context

**Language/Version**: TypeScript 5.8.2
**Primary Dependencies**: React 18.2.0, Tailwind CSS, Lucide React (icons)
**Storage**: N/A (UI-only feature)
**Testing**: Manual visual testing across all management pages
**Target Platform**: Web (responsive: desktop, tablet, mobile)
**Project Type**: Web frontend (React SPA)
**Performance Goals**: No performance impact (CSS-only changes)
**Constraints**: Must preserve existing card functionality and interactions
**Scale/Scope**: 9 management pages with card views

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| API Pagination Request Format | N/A | No API changes |
| API Pagination Response Format | N/A | No API changes |
| API Client Conventions | N/A | No API changes |
| Frontend Development Standards | PASS | TypeScript interfaces unchanged, UI-only changes |

**Gate Status**: PASS - This is a frontend-only UI refactoring with no API changes.

## Project Structure

### Documentation (this feature)

```text
specs/015-unified-card-style/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── tasks.md             # Phase 2 output (/speckit.tasks command)
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
components/
├── ui/
│   └── CardHeader.tsx       # NEW: Optional shared card header component
├── ResourceManagement.tsx   # Update card header layout
├── AgentManagement.tsx      # Update card header layout
├── ReportManagement.tsx     # Update card header layout
├── ReportTemplateManagement.tsx  # Update card header layout
├── ToolManagement.tsx       # Update card header layout
├── tool/
│   └── CategoryManagement.tsx    # Update card header layout
├── TopologiesManagement.tsx # Already updated (reference implementation)
├── PromptManagement.tsx     # Update card header layout
└── ModelManagement.tsx      # Update card header layout
```

**Structure Decision**: Modify existing component files in-place. Optionally create a shared `CardHeader` component in `components/ui/` to encapsulate the unified pattern for future reuse.

## Current State Analysis

### Existing Card Header Patterns

All management pages currently use this pattern (icon and name in **separate rows**):

```tsx
{/* Current: Icon and status on row 1, name below */}
<div className="flex justify-between items-start mb-4">
  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
    <Icon size={20} />
  </div>
  <div className="status-badge">...</div>
</div>
<div className="mb-4">
  <h3 className="text-base font-bold">{name}</h3>
  <div className="text-[9px]">{subtitle}</div>
</div>
```

### Target Card Header Pattern

New unified pattern (icon and name on **same row**):

```tsx
{/* Target: Icon + name together, status badge on right */}
<div className="flex justify-between items-start mb-4">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
      <Icon size={20} />
    </div>
    <div className="min-w-0">
      <h3 className="text-base font-bold truncate">{name}</h3>
      <div className="text-[9px]">{subtitle}</div>
    </div>
  </div>
  <div className="status-badge shrink-0">...</div>
</div>
```

### Key CSS Classes for Unified Pattern

| Class | Purpose |
|-------|---------|
| `flex items-center gap-3` | Horizontal layout with vertical centering and 12px gap |
| `shrink-0` | Prevent icon container from shrinking |
| `min-w-0` | Allow text container to shrink for truncation |
| `truncate` | Enable text ellipsis on long names |

### Reference Implementation

`TopologiesManagement.tsx` (lines 262-280) was already partially updated but uses a different structure. The full reference implementation with icon+name side-by-side exists as a working model.

## Pages Requiring Updates

| Page | File | Current Pattern | Priority |
|------|------|-----------------|----------|
| Resource Management | `ResourceManagement.tsx` | Icon top, name below | P1 |
| Agent Management | `AgentManagement.tsx` | Icon top, name below | P1 |
| Report Management | `ReportManagement.tsx` | Icon top, name below | P1 |
| Report Template Management | `ReportTemplateManagement.tsx` | Icon top, name below | P1 |
| Tool Management | `ToolManagement.tsx` | Icon top, name below | P1 |
| Tool Category Management | `tool/CategoryManagement.tsx` | Icon top, name below | P1 |
| Topology Management | `TopologiesManagement.tsx` | Partially updated | P2 |
| Prompt Management | `PromptManagement.tsx` | Icon top, name below | P1 |
| Model Management | `ModelManagement.tsx` | Icon top, name below | P1 |

## Implementation Approach

### Option A: Direct Inline Updates (Recommended)

Update each management page's card header directly with the unified Tailwind CSS pattern. This is the simplest approach with minimal risk.

**Pros:**
- No new components to maintain
- Minimal code changes
- Easy to review and test

**Cons:**
- Pattern duplicated across files
- Future changes require updating all files

### Option B: Shared CardHeader Component

Create a reusable `CardHeader` component that encapsulates the icon+name+badge pattern.

**Pros:**
- Single source of truth
- Easy to update globally
- Enforces consistency

**Cons:**
- More initial work
- Requires refactoring each page to use the component
- May not fit all variations (some cards have complex badge areas)

### Chosen Approach: Option A (Direct Updates)

Given the variation in badge/status display across different card types, direct inline updates provide the cleanest solution. A shared component could be added later if patterns stabilize.

## Complexity Tracking

No constitution violations. No complexity justification needed.
