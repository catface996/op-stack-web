# Implementation Plan: Topology Report Template Binding

**Branch**: `014-topology-report-template` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-topology-report-template/spec.md`

## Summary

Implement a report template binding feature for topologies that allows users to bind/unbind report templates using a two-column UI layout. The feature integrates with existing TopologyDetailView and follows established patterns from agent-tool binding (useAgentBinding hook, ToolsStage component).

## Technical Context

**Language/Version**: TypeScript 5.8.2, React 18.2.0
**Primary Dependencies**: React, Lucide React (icons), Vite 6.2.0
**Storage**: N/A (Backend API handles persistence via gateway)
**Testing**: Manual testing via browser
**Target Platform**: Web browser
**Project Type**: Web application (frontend only)
**Performance Goals**: Template lists load within 2 seconds (SC-003)
**Constraints**: Must follow existing API pagination patterns, two-column layout matching ToolsStage
**Scale/Scope**: Support 100+ templates with pagination and search

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. API Pagination Request Format | PASS | Will use `{ page, size }` format |
| II. API Pagination Response Format | PASS | Will extract from `data.content` |
| III. API Client Conventions | PASS | Will use `apiPostRaw` and handle `success` field |
| API Contract Standards | PASS | Backend APIs provided, follow standard envelope |
| Frontend Development Standards | PASS | Will define TypeScript interfaces, use existing hooks pattern |

## Project Structure

### Documentation (this feature)

```text
specs/014-topology-report-template/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
components/
├── topology/
│   ├── TopologyDetailView.tsx      # Modified: Add report templates section
│   └── TopologyReportTemplates.tsx # New: Two-column binding UI component

services/
├── api/
│   ├── types.ts                    # Modified: Add topology report template binding types
│   └── topologyReportTemplates.ts  # New: API client for bind/unbind/query
└── hooks/
    └── useTopologyReportTemplates.ts # New: Hook for managing template bindings
```

**Structure Decision**: Frontend-only changes following existing patterns from agent-tool binding feature.

## Complexity Tracking

> No constitution violations - standard implementation following established patterns.
