# Feature Specification: Unified Card Style

**Feature Branch**: `015-unified-card-style`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "I noticed that on the resource management page, agent management page, report management page, etc., in card mode, the icon and name are displayed on separate lines. I want the name to be placed on the right side of the icon, on the same line, and vertically centered. Can all card styles in card mode be unified with a global style?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Card Layout Across All Management Pages (Priority: P1)

Users viewing management pages (Resources, Agents, Reports, Topologies, Tools, etc.) in card view mode should see a consistent card layout where the icon and name appear side by side, horizontally aligned with vertical centering.

**Why this priority**: Consistent visual design improves user experience and reduces cognitive load when navigating between different management sections. This is the core requirement of the feature.

**Independent Test**: Can be tested by navigating to any management page in card mode and verifying the icon-name layout is horizontal with vertical centering.

**Acceptance Scenarios**:

1. **Given** a user is viewing the Resource Management page in card mode, **When** they look at any resource card, **Then** the icon should appear on the left with the resource name directly to its right on the same line, both vertically centered.

2. **Given** a user is viewing the Agent Management page in card mode, **When** they look at any agent card, **Then** the icon should appear on the left with the agent name directly to its right on the same line, both vertically centered.

3. **Given** a user is viewing the Report Management page in card mode, **When** they look at any report card, **Then** the icon should appear on the left with the report title directly to its right on the same line, both vertically centered.

4. **Given** a user switches between different management pages (Resources → Agents → Reports → Tools → Topologies), **When** they compare the card layouts, **Then** all cards should have the same consistent icon-name positioning pattern.

---

### User Story 2 - Maintainable Global Card Styles (Priority: P2)

Developers should be able to apply and maintain consistent card styling through a centralized style definition, reducing code duplication and ensuring future cards follow the same pattern.

**Why this priority**: This ensures long-term maintainability and consistency. While not user-facing, it directly supports the consistency goal of P1.

**Independent Test**: Can be verified by checking that card styles are defined in a reusable component or shared style definition, and that all management pages reference this shared style.

**Acceptance Scenarios**:

1. **Given** a developer needs to create a new management page with card view, **When** they implement the card layout, **Then** they should be able to reuse the global card style components without duplicating layout CSS.

2. **Given** a developer needs to change the icon-name spacing across all cards, **When** they modify the global card style definition, **Then** the change should be reflected on all management pages without modifying each page individually.

---

### Edge Cases

- What happens when the item name is very long (exceeds available width)?
  - The name should truncate with ellipsis while maintaining the horizontal layout
- How does the card layout behave on different screen sizes (responsive design)?
  - The icon-name horizontal alignment should be maintained on all screen sizes; card grid adjusts from 4 columns on large screens down to 1 column on mobile
- What happens when an item has no icon or uses a fallback icon?
  - The layout should remain consistent with a placeholder or default icon

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All card views in management pages MUST display the icon and name on the same horizontal line with vertical centering
- **FR-002**: The card layout MUST be consistent across all management pages including:
  - Resource Management
  - Agent Management
  - Report Management
  - Report Template Management
  - Tool Management
  - Tool Category Management
  - Topology Management
  - Prompt Template Management
  - Model Management
- **FR-003**: The card layout MUST handle long names gracefully with text truncation (ellipsis)
- **FR-004**: The unified card style MUST be implemented through reusable components or shared style definitions to ensure maintainability
- **FR-005**: The card layout MUST maintain responsiveness across different viewport sizes

### Assumptions

- The existing card structure (header area, content area, footer area) will be preserved; only the icon-name positioning within the header is changing
- The icon size will remain consistent with current implementations (typically 20-24px)
- The gap between icon and name will be standardized (approximately 12px / gap-3 in Tailwind)
- Secondary information (description, subtitle, type label) will appear below the icon-name row when present

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of management pages with card views display icon and name horizontally aligned
- **SC-002**: Users can identify the same visual pattern across all management sections without confusion
- **SC-003**: Card style definitions are centralized such that a single style change propagates to all management pages
- **SC-004**: All cards properly truncate long names without breaking the horizontal layout
- **SC-005**: Card layouts remain visually consistent and functional across desktop, tablet, and mobile viewport sizes
