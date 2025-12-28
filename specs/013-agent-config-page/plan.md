# Implementation Plan: Agent Configuration Page

**Branch**: `013-agent-config-page` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-agent-config-page/spec.md`

## Summary

Replace the existing agent configuration modal with a dedicated full-page configuration interface featuring a three-stage wizard (Basic Info, Prompt Template, Tools). Each stage has independent save functionality. The Prompt Template stage includes a collapsible side panel for template preview. The Tools stage displays available tools grouped by category with multi-select checkboxes.

## Technical Context

**Language/Version**: TypeScript 5.8.2
**Primary Dependencies**: React 18.2.0, React Router DOM 7.11.0, Lucide React 0.303.0, Vite 6.2.0
**Storage**: N/A (backend API handles persistence)
**Testing**: Playwright 1.57.0 (E2E)
**Target Platform**: Web (modern browsers)
**Project Type**: web (frontend SPA)
**Performance Goals**: Page load < 2s, API response handling < 500ms perceived
**Constraints**: Must follow existing component patterns, use existing hooks and API services
**Scale/Scope**: Single configuration page with 3 stages, ~5 new/modified components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. API Pagination Request Format | PASS | Uses existing pagination format for template/tool lists |
| II. API Pagination Response Format | PASS | Will use existing hooks that handle response format |
| III. API Client Conventions | PASS | Will use `apiPostRaw` and existing patterns |
| API Contract Standards | PASS | Agent update API verified, includes toolIds field |
| Frontend Development Standards | PASS | Will define TypeScript interfaces, use existing hooks |

**Gate Result**: PASS - No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/013-agent-config-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - using existing APIs)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
components/
├── AgentConfigPage.tsx           # New: Main configuration page component
├── agent-config/
│   ├── BasicInfoStage.tsx        # New: Stage 1 - Basic info form
│   ├── PromptTemplateStage.tsx   # New: Stage 2 - Template selection with preview
│   ├── ToolsStage.tsx            # New: Stage 3 - Tool selection by category
│   └── ConfigStepper.tsx         # New: Wizard stepper navigation
├── AgentManagement.tsx           # Modified: Link to config page instead of modal
└── AgentConfigModal.tsx          # Deprecated: Will be removed

services/
├── routes.ts                     # Modified: Add agent config route
├── api/types.ts                  # Modified: Add toolIds to UpdateAgentRequest
└── hooks/
    └── useAgents.ts              # Modified: Support toolIds in update
```

**Structure Decision**: Frontend-only changes following existing component/services pattern. No new API services needed - leveraging existing `useAgents`, `usePromptTemplates`, `useTools`, and `useCategories` hooks.

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |
