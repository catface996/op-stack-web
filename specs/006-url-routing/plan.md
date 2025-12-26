# Implementation Plan: URL Routing and Navigation History

**Branch**: `006-url-routing` | **Date**: 2025-12-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-url-routing/spec.md`

## Summary

Implement browser-native URL routing for the op-stack-web application. Currently, the app uses React state (`currentView`) for navigation without updating browser URLs. This feature will:
- Add React Router for URL-based navigation
- Enable browser back/forward button support
- Support deep linking (direct URL access to any page)
- Preserve context-aware back navigation (return to actual previous page, not hard-coded destinations)

## Technical Context

**Language/Version**: TypeScript 5.8.2, React 18.2.0
**Primary Dependencies**: Vite 6.2.0, React Router DOM 6.x (NEW)
**Storage**: N/A (frontend-only, no persistence required)
**Testing**: Playwright (E2E tests for navigation flows)
**Target Platform**: Web browser (SPA)
**Project Type**: Web application (frontend only)
**Performance Goals**: Page transitions complete within 200ms, direct URL loads within 2 seconds
**Constraints**: Maintain backward compatibility with existing navigation sidebar, no breaking changes to component APIs
**Scale/Scope**: ~20 components affected (navigation handlers), 1 new dependency

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution is not configured. Proceeding with standard development practices:
- ✅ Maintain existing code structure and patterns
- ✅ No breaking changes to component interfaces
- ✅ Follow existing TypeScript conventions
- ✅ Use established React patterns (hooks, functional components)

## Project Structure

### Documentation (this feature)

```text
specs/006-url-routing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (route definitions)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── routes.md        # Route configuration contract
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Frontend-only web application
App.tsx                  # MAJOR UPDATE: Replace state-based routing with React Router
index.tsx                # UPDATE: Wrap with BrowserRouter

components/
├── Layout.tsx           # NEW: Shared layout with navigation
├── NotFound.tsx         # NEW: 404 page component
├── ApiResourceDetailView.tsx  # UPDATE: Use router params & navigate
├── ResourceManagement.tsx     # UPDATE: Use navigate instead of callbacks
├── TopologiesManagement.tsx   # UPDATE: Use navigate instead of callbacks
├── topology/
│   └── TopologyDetailView.tsx # UPDATE: Use router params & navigate
└── ...

services/
└── navigation.ts        # NEW: Navigation utilities (optional)

tests/
└── navigation.spec.ts   # NEW: E2E tests for routing
```

**Structure Decision**: Minimal changes to existing structure. React Router will be integrated at the App level with route-based rendering replacing the switch statement. Individual components will use `useNavigate` and `useParams` hooks instead of callback props.

## Complexity Tracking

No constitution violations to justify - this is a standard React Router integration following established patterns.

## Implementation Phases

### Phase 0: Research (Complete)

See [research.md](./research.md) for:
- React Router 6 patterns and best practices
- Migration strategy from state-based to URL-based routing
- Browser history API considerations

### Phase 1: Design & Contracts (Complete)

See artifacts:
- [data-model.md](./data-model.md) - Route definitions and parameters
- [contracts/routes.md](./contracts/routes.md) - URL patterns and navigation contracts
- [quickstart.md](./quickstart.md) - Developer guide

### Phase 2: Tasks (via /speckit.tasks)

Implementation tasks will be generated with dependencies and verification criteria.
