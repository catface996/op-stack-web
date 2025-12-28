# Implementation Plan: Agent API Integration

**Branch**: `012-agent-api-integration` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-agent-api-integration/spec.md`

## Summary

Integrate backend Agent APIs with the frontend Agent management module. This involves replacing mock data handlers in App.tsx with real API calls, creating an agent API service layer following established patterns, and updating the AgentManagement component to use the new API service for CRUD operations.

## Technical Context

**Language/Version**: TypeScript 5.8.2
**Primary Dependencies**: React 18.2.0, Vite 6.2.0, Lucide React (icons)
**Storage**: Backend API (proxied to localhost:8080)
**Testing**: Playwright (e2e tests)
**Target Platform**: Web (modern browsers)
**Project Type**: Web application (frontend only - backend is separate service)
**Performance Goals**: Page load < 2s, search/filter < 1s (per SC-001, SC-005)
**Constraints**: POST-only API pattern, pagination format per constitution
**Scale/Scope**: Single page (AgentManagement), ~6 API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. API Pagination Request Format | ✅ PASS | Will use `{ page, size }` format |
| II. API Pagination Response Format | ✅ PASS | Will extract from `data.content`, use `totalElements`, `totalPages` |
| III. API Client Conventions | ✅ PASS | All requests use POST, will use existing `apiPost`/`apiPostRaw` client |
| API Contract Standards | ✅ PASS | Backend already returns standard envelope format |
| Frontend Development Standards | ✅ PASS | Will define TypeScript interfaces matching API response structure |

**Gate Result**: ✅ PASSED - No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/012-agent-api-integration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
/
├── App.tsx                      # Main app - contains agent state handlers (to be updated)
├── types.ts                     # Frontend types - Agent, AgentConfig, AgentRole, etc.
├── components/
│   ├── AgentManagement.tsx      # Agent list/CRUD UI (to be updated)
│   └── AgentConfigModal.tsx     # Agent configuration modal
├── services/
│   └── api/
│       ├── client.ts            # HTTP client (apiPost, apiPostRaw)
│       ├── types.ts             # API types (PaginatedResponse, etc.)
│       ├── agents.ts            # NEW: Agent API service
│       └── index.ts             # API exports (to be updated)
└── tests/
    └── agents.spec.ts           # NEW: Agent e2e tests (optional)
```

**Structure Decision**: Frontend-only web application. New agent API service follows existing pattern in `services/api/` directory (e.g., resources.ts, reports.ts). Component updates in-place.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - table not needed.
