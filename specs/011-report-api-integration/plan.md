# Implementation Plan: Report and Report Template API Integration

**Branch**: `011-report-api-integration` | **Date**: 2024-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-report-api-integration/spec.md`

## Summary

Integrate the frontend Report Management and Report Template Management pages with backend REST APIs. Replace mock data with real API calls following the established patterns (useTools, useCategories hooks). The backend APIs are available at `/api/service/v1/reports/*` and `/api/service/v1/report-templates/*`.

## Technical Context

**Language/Version**: TypeScript 5.8, React 18.2
**Primary Dependencies**: React, Vite 6.2, Lucide-React (icons)
**Storage**: N/A (backend API handles persistence)
**Testing**: Manual testing (existing project pattern)
**Target Platform**: Web browser (Vite dev server proxied to localhost:8080)
**Project Type**: Web application (frontend only - backend exists)
**Performance Goals**: Page load < 2s, API response display < 1s
**Constraints**: Follow constitution pagination format, POST-only APIs
**Scale/Scope**: 2 pages (Reports, Templates), 9 API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. API Pagination Request Format | PASS | Using `{ page, size }` format |
| II. API Pagination Response Format | PASS | Extracting from `data.content`, handling `totalElements`, `totalPages` |
| III. API Client Conventions | PASS | Using POST method, `apiPostRaw` for full response |
| API Contract Standards | PASS | Backend follows standard envelope |
| Frontend Development Standards | PASS | TypeScript interfaces, proper response unwrapping |

**Gate Result**: PASS - No violations, proceed to implementation.

## Project Structure

### Documentation (this feature)

```text
specs/011-report-api-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts from backend)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
services/
├── api/
│   ├── reports.ts           # NEW: Report API functions
│   ├── report-templates.ts  # NEW: Report Template API functions
│   └── types.ts             # MODIFY: Add Report/ReportTemplate types
└── hooks/
    ├── useReports.ts        # NEW: Report list hook
    ├── useReport.ts         # NEW: Single report hook
    ├── useReportTemplates.ts # NEW: Template list hook
    ├── useReportTemplate.ts # NEW: Single template hook
    └── useReportTemplateMutations.ts # NEW: Template CRUD hook

components/
├── ReportManagement.tsx     # MODIFY: Replace mock data with API
└── ReportTemplateManagement.tsx # MODIFY: Replace mock data with API

types.ts                     # MODIFY: Update Report/ReportTemplate interfaces
```

**Structure Decision**: Following existing project patterns (services/api/, services/hooks/, components/). New files follow naming conventions from useTools.ts, useCategories.ts.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
