# Feature Specification: Tool Category Management

**Feature Branch**: `010-tool-category-management`
**Created**: 2025-12-27
**Status**: Draft
**Input**: User description: "http://localhost:8080/docs/tools/v3/api-docs 中定义了工具类目，参考相关的设计，在Tools管理页面中，增加工具类目的管理"

## Clarifications

### Session 2025-12-27

- Q: 删除含有已分配工具的类目时应如何处理？ → A: 阻止删除（显示错误，要求先移除工具）
- Q: 删除含有子类目的父类目时应如何处理？ → A: 类目不支持嵌套，无子类目概念（扁平结构）
- Q: 类目名称是否允许重复？ → A: 不允许重复，强制唯一

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Tool Categories (Priority: P1)

As a platform administrator, I want to view a list of all tool categories so that I can understand how tools are organized.

**Why this priority**: This is the foundational feature that enables all other category management operations. Without viewing categories, users cannot manage them.

**Independent Test**: Can be fully tested by navigating to the Tools management page, clicking a "Categories" tab/button, and verifying that all existing categories are displayed in a flat list.

**Acceptance Scenarios**:

1. **Given** the user is on the Tools management page, **When** they click on "类目管理" tab/button, **Then** they see a flat list of all tool categories with name and description
2. **Given** there are no categories defined, **When** the user views the categories list, **Then** an empty state message is displayed with an option to create the first category

---

### User Story 2 - Create New Category (Priority: P1)

As a platform administrator, I want to create new tool categories so that I can organize tools into logical groups.

**Why this priority**: Creating categories is essential for organizing tools. This enables the primary use case of category management.

**Independent Test**: Can be fully tested by opening the create category form, filling in required fields, submitting, and verifying the new category appears in the list.

**Acceptance Scenarios**:

1. **Given** the user is viewing the categories list, **When** they click "新建类目" button, **Then** a modal form opens with fields for name (required) and description (optional)
2. **Given** the create category form is open, **When** the user fills in a valid unique name and submits, **Then** the category is created and appears in the list
3. **Given** the user submits a category with an empty name, **When** validation runs, **Then** an error message is displayed requiring the name field
4. **Given** a category with name "X" already exists, **When** the user tries to create another category with name "X", **Then** an error message is displayed indicating the name is already in use

---

### User Story 3 - Edit Existing Category (Priority: P2)

As a platform administrator, I want to edit existing categories so that I can update their information as requirements change.

**Why this priority**: Editing is important for maintenance but less critical than initial creation and viewing capabilities.

**Independent Test**: Can be fully tested by selecting a category, modifying its properties, saving, and verifying the changes persist.

**Acceptance Scenarios**:

1. **Given** a category exists in the list, **When** the user clicks the edit button on that category, **Then** a modal form opens pre-filled with the category's current name and description
2. **Given** the edit form is open, **When** the user changes the name or description and saves, **Then** the category is updated with the new values

---

### User Story 4 - Delete Category (Priority: P2)

As a platform administrator, I want to delete categories that are no longer needed so that the category list stays clean and relevant.

**Why this priority**: Deletion is a maintenance operation needed less frequently than create/view operations.

**Independent Test**: Can be fully tested by selecting a category, confirming deletion, and verifying it no longer appears in the list.

**Acceptance Scenarios**:

1. **Given** a category exists with no tools assigned, **When** the user clicks delete and confirms, **Then** the category is removed from the list
2. **Given** the user clicks delete on a category, **When** the confirmation dialog appears, **Then** the user can cancel to abort the deletion
3. **Given** a category has tools assigned to it, **When** the user tries to delete it, **Then** the system blocks the deletion and displays an error message requiring the user to first remove or reassign the tools

---

### User Story 5 - Assign Category to Tool (Priority: P3)

As a platform administrator, I want to assign a category to a tool so that tools are properly organized.

**Why this priority**: This connects the category management feature to the existing tool management, but requires categories to exist first.

**Independent Test**: Can be fully tested by editing a tool, selecting a category from a dropdown, saving, and verifying the tool shows its assigned category.

**Acceptance Scenarios**:

1. **Given** the user is editing a tool, **When** they see the category field, **Then** a dropdown shows all available categories as a flat list
2. **Given** a tool has no category assigned, **When** the user selects a category and saves, **Then** the tool is updated with the selected category_id
3. **Given** a tool has a category assigned, **When** viewing the tool in the list/card, **Then** the category name is displayed as part of the tool information

---

### Edge Cases

- **Category with assigned tools**: Deletion is blocked; system displays error requiring user to first remove or reassign all tools from the category
- **Flat structure**: Categories do not support nesting (no parent_id); all categories are at the same level
- **Duplicate names**: Category names must be unique; system displays error when attempting to create/edit with an existing name

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to view a flat list of all tool categories with pagination
- **FR-002**: System MUST allow users to create new categories with name (required) and description (optional)
- **FR-003**: System MUST allow users to edit existing category name and description
- **FR-004**: System MUST allow users to delete categories with confirmation dialog
- **FR-005**: System MUST block deletion of categories that have tools assigned (display error message)
- **FR-006**: System MUST provide a category selection dropdown in the tool create/edit form
- **FR-007**: System MUST display the assigned category on tool cards and list items
- **FR-008**: System MUST validate that category name is not empty before submission
- **FR-009**: System MUST enforce unique category names (reject duplicates with error message)
- **FR-010**: System MUST show loading states during API operations
- **FR-011**: System MUST display error messages when API operations fail

### Key Entities

- **ToolCategory**: Represents a category for organizing tools (flat structure, no nesting)
  - `id` (UUID): Unique identifier
  - `name` (string, required): Display name of the category
  - `description` (string, optional): Description of what tools belong in this category
  - `created_at` (datetime): Timestamp of creation
  - `updated_at` (datetime): Timestamp of last update

- **Tool** (existing, to be modified): Add `category_id` field
  - `category_id` (UUID, optional): Reference to the assigned category

## API Endpoints

Based on the API documentation at http://localhost:8080/docs/tools/v3/api-docs:

| Operation | Endpoint | Request Body | Response |
|-----------|----------|--------------|----------|
| Create | POST /api/tools/v1/categories/create | `{name, description?}` | `ToolCategoryResponse` |
| List | POST /api/tools/v1/categories/list | `{page?, size?}` | `{items, total, page, size}` |
| Get | POST /api/tools/v1/categories/get | `{category_id}` | `ToolCategoryResponse` |
| Update | POST /api/tools/v1/categories/update | `{category_id, name?, description?}` | `ToolCategoryResponse` |
| Delete | POST /api/tools/v1/categories/delete | `{category_id}` | `void` |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new category within 30 seconds (3 clicks: open modal, fill name, save)
- **SC-002**: All CRUD operations provide visual feedback (loading spinners, success/error messages)
- **SC-003**: Category dropdown in tool form loads all categories as a flat list
- **SC-004**: 100% of category API endpoints are integrated and functional in the UI
- **SC-005**: Deletion of categories with assigned tools is blocked with clear error message
