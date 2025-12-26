# Feature Specification: URL Routing and Navigation History

**Feature Branch**: `006-url-routing`
**Created**: 2025-12-26
**Status**: Draft
**Input**: User description: "切换页面时，浏览器中的地址要发生变化，另外，要记录页面的跳转历史，比如拓扑详情页有两种进入方式，一种是从拓扑管理页面的card进入，另外一种是从资源详情页中的拓扑tab页中的card进入，从拓扑详情页返回时，要返回到之前的页面，而不是统一返回到拓扑团里页面。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - URL Reflects Current Page (Priority: P1)

As a user navigating the application, I want the browser URL to change when I switch between pages, so that I can bookmark specific pages, share URLs with colleagues, and return to a specific view by entering the URL directly.

**Why this priority**: URL routing is the foundation for all other navigation features. Without URLs reflecting the current page, users cannot bookmark, share, or directly access specific pages.

**Independent Test**: Can be fully tested by navigating to different pages and verifying the URL changes accordingly, then copying the URL and pasting it in a new browser tab to verify the same page loads.

**Acceptance Scenarios**:

1. **Given** I am on the dashboard, **When** I click on "Topologies" in the navigation, **Then** the browser URL changes to `/topologies`
2. **Given** I am on the resources page at `/resources`, **When** I click on a resource card, **Then** the browser URL changes to `/resources/{resourceId}`
3. **Given** I am on the topologies page at `/topologies`, **When** I click on a topology card, **Then** the browser URL changes to `/topologies/{topologyId}`
4. **Given** I have a URL `/topologies/123`, **When** I enter this URL directly in the browser, **Then** the application loads and displays the topology detail page for topology ID 123
5. **Given** I am on a detail page, **When** I refresh the browser, **Then** the same page reloads correctly

---

### User Story 2 - Browser History Navigation (Priority: P1)

As a user, I want to use the browser's back and forward buttons to navigate through my page history, so that I can easily return to previously visited pages without manually clicking navigation links.

**Why this priority**: Browser history navigation is a fundamental user expectation. Without it, the application feels broken and users lose their navigation context.

**Independent Test**: Can be tested by navigating through multiple pages, then using browser back/forward buttons and verifying correct page restoration.

**Acceptance Scenarios**:

1. **Given** I navigate from dashboard to topologies to topology detail, **When** I click the browser back button, **Then** I return to the topologies page
2. **Given** I am on the topologies page after clicking back, **When** I click the browser forward button, **Then** I return to the topology detail page
3. **Given** I navigate from resources to resource detail to topology detail (via topology tab), **When** I click the browser back button, **Then** I return to the resource detail page (not the topologies management page)

---

### User Story 3 - Context-Aware Back Navigation (Priority: P2)

As a user who entered a topology detail page from a resource detail page, I want to return to the resource detail page when I click "Back", so that I maintain my navigation context and workflow.

**Why this priority**: This ensures logical navigation flow based on user's actual journey, not a hard-coded destination. It improves user experience by respecting the user's navigation path.

**Independent Test**: Can be tested by entering topology detail from two different entry points and verifying back navigation returns to the correct origin page.

**Acceptance Scenarios**:

1. **Given** I am on a resource detail page viewing the Topologies tab, **When** I click a topology card and then click "Back" on the topology detail page, **Then** I return to the resource detail page
2. **Given** I am on the topologies management page, **When** I click a topology card and then click "Back" on the topology detail page, **Then** I return to the topologies management page
3. **Given** I directly accessed a topology detail page via URL (no previous page in history), **When** I click "Back" on the topology detail page, **Then** I am navigated to the topologies management page (sensible default)

---

### User Story 4 - Deep Linking Support (Priority: P3)

As a user who received a shared URL from a colleague, I want to access the exact page they intended, so that I can quickly view the resource or topology they wanted to show me.

**Why this priority**: Deep linking enables collaboration and sharing. It builds on the foundation of URL routing (P1) but is less critical than basic navigation.

**Independent Test**: Can be tested by generating URLs for various pages, sharing them, and verifying recipients land on the correct page.

**Acceptance Scenarios**:

1. **Given** I receive a URL `/resources/42` from a colleague, **When** I open this URL in my browser, **Then** I see the resource detail page for resource ID 42
2. **Given** I receive a URL `/topologies/15`, **When** I open this URL in my browser while already logged in, **Then** I see the topology detail page for topology ID 15
3. **Given** I bookmark the URL `/resources/42` when viewing resource 42, **When** I open this bookmark later, **Then** I return to the same resource detail page

---

### Edge Cases

- What happens when a user navigates to a URL for a resource/topology that doesn't exist?
  - System should display a "Not Found" message with option to return to the list page
- How does the system handle when a user modifies the URL to an invalid format (e.g., `/topologies/abc`)?
  - System should redirect to the list page or show an error message
- What happens when browser history is cleared and user tries to go back?
  - System should handle gracefully, falling back to a sensible default (e.g., parent list page)
- How does the system handle hash-based vs path-based routing?
  - System uses path-based routing for clean URLs (assumed based on modern SPA practices)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST update the browser URL when the user navigates to a different page
- **FR-002**: System MUST support direct URL access to any page (deep linking)
- **FR-003**: System MUST preserve browser history entries for each navigation
- **FR-004**: System MUST respond correctly to browser back/forward button clicks
- **FR-005**: System MUST restore the correct page state when loading from a URL
- **FR-006**: System MUST preserve page parameters (e.g., resource ID, topology ID) in the URL
- **FR-007**: System MUST display a user-friendly error when navigating to a non-existent resource/topology
- **FR-008**: Back button in application UI MUST navigate to the previous page in browser history (not a hard-coded destination)
- **FR-009**: System MUST handle page refresh without losing the current view
- **FR-010**: System MUST use clean, human-readable URLs (e.g., `/topologies/123` rather than query strings)

### URL Structure

The following URL patterns will be supported:

| Page | URL Pattern | Example |
|------|-------------|---------|
| Dashboard | `/` or `/dashboard` | `/dashboard` |
| Topologies Management | `/topologies` | `/topologies` |
| Topology Detail | `/topologies/{id}` | `/topologies/123` |
| Resources Management | `/resources` | `/resources` |
| Resource Detail | `/resources/{id}` | `/resources/42` |
| Resource Detail (specific tab) | `/resources/{id}?tab={tabName}` | `/resources/42?tab=topologies` |
| Agents Management | `/agents` | `/agents` |
| Reports | `/reports` | `/reports` |
| Report Detail | `/reports/{id}` | `/reports/789` |
| Discovery | `/discovery` | `/discovery` |
| Scanner | `/scanner` | `/scanner` |

### Key Entities

- **Route**: Represents a URL path mapping to a specific view and its parameters
- **Navigation History**: The browser's record of visited pages, managed by the routing system
- **Route Parameters**: Dynamic values in URLs (e.g., resource ID, topology ID) that determine page content

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can bookmark any page and return to the exact same view via the bookmark
- **SC-002**: Users can share URLs with colleagues who can access the same page directly
- **SC-003**: Browser back/forward buttons work correctly for 100% of navigation actions
- **SC-004**: Page refresh preserves the current view for all pages
- **SC-005**: Back navigation from topology detail returns to the correct origin page (topologies list OR resource detail, depending on entry point)
- **SC-006**: All pages load correctly when accessed directly via URL within 2 seconds
- **SC-007**: Invalid URLs display a clear error message rather than a blank page or crash

## Assumptions

- Users are authenticated before accessing the application (authentication is handled separately)
- The application is a single-page application (SPA) that will use client-side routing
- Path-based routing is preferred over hash-based routing for cleaner URLs
- The existing navigation sidebar will continue to function alongside URL-based navigation
- Query parameters may be used for optional state (like active tab) but primary navigation uses path segments
