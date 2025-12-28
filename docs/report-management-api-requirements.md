# Report Management API Requirements

## Overview

This document describes the backend API requirements for the Report Management module. The frontend is ready and currently uses mock data. Backend APIs are needed to enable full functionality.

---

## 1. Data Models

### 1.1 Report Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier (UUID recommended) |
| title | string | Yes | Report title, max 200 characters |
| type | enum | Yes | Report type: `Diagnosis`, `Audit`, `Performance`, `Security` |
| status | enum | Yes | Report status: `Draft`, `Final`, `Archived` |
| author | string | Yes | Author name or user ID |
| summary | string | Yes | Brief summary, max 500 characters |
| content | string | Yes | Full report content (Markdown format) |
| tags | string[] | No | Array of tags for categorization |
| topology_id | string | No | Associated topology ID (optional) |
| created_at | timestamp | Yes | Creation time |

> **Note**: Reports are immutable after creation. No update API is provided.

**Type Enum Values:**
```
Diagnosis   - System diagnosis reports
Audit       - Compliance and audit reports
Performance - Performance analysis reports
Security    - Security assessment reports
```

**Status Enum Values:**
```
Draft    - Report is being drafted
Final    - Report is finalized and published
Archived - Report is archived (read-only)
```

### 1.2 ReportTemplate Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier |
| name | string | Yes | Template name, max 100 characters |
| description | string | No | Template description, max 500 characters |
| category | enum | Yes | Category: `Incident`, `Performance`, `Security`, `Audit` |
| content | string | Yes | Template content with placeholders (Markdown) |
| tags | string[] | No | Array of tags |
| created_at | timestamp | Yes | Creation time |
| updated_at | timestamp | Yes | Last update time |

---

## 2. API Endpoints

### 2.1 Report APIs

#### 2.1.1 List Reports (Paginated)

```
POST /api/v1/reports/list
```

**Request Body:**
```json
{
  "page": 1,
  "size": 10,
  "type": "Security",        // Optional: filter by type
  "status": "Final",         // Optional: filter by status
  "keyword": "search term",  // Optional: search in title, summary, tags
  "sort_by": "created_at",   // Optional: sort field
  "sort_order": "desc"       // Optional: asc or desc
}
```

**Response:**
```json
{
  "code": 0,
  "success": true,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": "rpt-001",
        "title": "Q4 Security Audit Report",
        "type": "Security",
        "status": "Final",
        "author": "System Admin",
        "summary": "Comprehensive security assessment...",
        "tags": ["security", "compliance", "Q4"],
        "topology_id": "topo-001",
        "created_at": "2024-12-28T10:00:00Z",
        "updated_at": "2024-12-28T15:30:00Z"
      }
    ],
    "page": 1,
    "size": 10,
    "totalElements": 25,
    "totalPages": 3,
    "first": true,
    "last": false
  }
}
```

#### 2.1.2 Get Report Detail

```
POST /api/v1/reports/get
```

**Request Body:**
```json
{
  "report_id": "rpt-001"
}
```

**Response:**
```json
{
  "code": 0,
  "success": true,
  "message": "Success",
  "data": {
    "id": "rpt-001",
    "title": "Q4 Security Audit Report",
    "type": "Security",
    "status": "Final",
    "author": "System Admin",
    "summary": "Comprehensive security assessment...",
    "content": "# Security Audit Report\n\n## Executive Summary\n...",
    "tags": ["security", "compliance", "Q4"],
    "topology_id": "topo-001",
    "created_at": "2024-12-28T10:00:00Z",
    "updated_at": "2024-12-28T15:30:00Z"
  }
}
```

#### 2.1.3 Create Report

```
POST /api/v1/reports/create
```

**Request Body:**
```json
{
  "title": "New Security Report",
  "type": "Security",
  "status": "Draft",
  "author": "System Admin",
  "summary": "Brief summary of the report",
  "content": "# Report Content\n\nMarkdown content here...",
  "tags": ["security", "2024"],
  "topology_id": "topo-001"
}
```

**Response:**
```json
{
  "code": 0,
  "success": true,
  "message": "Report created successfully",
  "data": {
    "id": "rpt-002",
    "title": "New Security Report",
    "type": "Security",
    "status": "Draft",
    "author": "System Admin",
    "summary": "Brief summary of the report",
    "content": "# Report Content\n\nMarkdown content here...",
    "tags": ["security", "2024"],
    "topology_id": "topo-001",
    "created_at": "2024-12-28T16:00:00Z",
    "updated_at": "2024-12-28T16:00:00Z"
  }
}
```

#### 2.1.4 Delete Report

```
POST /api/v1/reports/delete
```

**Request Body:**
```json
{
  "report_id": "rpt-002"
}
```

**Response:**
```json
{
  "code": 0,
  "success": true,
  "message": "Report deleted successfully",
  "data": null
}
```

#### 2.1.5 Auto-Generate Report (AI Integration)

```
POST /api/v1/reports/generate
```

**Request Body:**
```json
{
  "template_id": "tpl-001",
  "topology_id": "topo-001",
  "parameters": {
    "time_range": "last_7_days",
    "include_metrics": true,
    "include_recommendations": true
  }
}
```

**Response:**
```json
{
  "code": 0,
  "success": true,
  "message": "Report generation started",
  "data": {
    "task_id": "task-001",
    "status": "processing",
    "estimated_time_seconds": 30
  }
}
```

---

### 2.2 Report Template APIs

#### 2.2.1 List Templates

```
POST /api/v1/report-templates/list
```

**Request Body:**
```json
{
  "page": 1,
  "size": 10,
  "category": "Security",
  "keyword": "audit"
}
```

**Response:**
```json
{
  "code": 0,
  "success": true,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": "tpl-001",
        "name": "Security Audit Template",
        "description": "Template for security audit reports",
        "category": "Security",
        "tags": ["security", "audit"],
        "created_at": "2024-12-01T00:00:00Z",
        "updated_at": "2024-12-15T00:00:00Z"
      }
    ],
    "page": 1,
    "size": 10,
    "totalElements": 5,
    "totalPages": 1,
    "first": true,
    "last": true
  }
}
```

#### 2.2.2 Get Template Detail

```
POST /api/v1/report-templates/get
```

**Request Body:**
```json
{
  "template_id": "tpl-001"
}
```

**Response:**
```json
{
  "code": 0,
  "success": true,
  "message": "Success",
  "data": {
    "id": "tpl-001",
    "name": "Security Audit Template",
    "description": "Template for security audit reports",
    "category": "Security",
    "content": "# {{Report_Title}}\n\n## Executive Summary\n{{Executive_Summary}}\n\n## Findings\n{{Findings}}",
    "tags": ["security", "audit"],
    "created_at": "2024-12-01T00:00:00Z",
    "updated_at": "2024-12-15T00:00:00Z"
  }
}
```

#### 2.2.3 Create Template

```
POST /api/v1/report-templates/create
```

**Request Body:**
```json
{
  "name": "New Template",
  "description": "Template description",
  "category": "Performance",
  "content": "# {{Title}}\n\n{{Content}}",
  "tags": ["performance", "metrics"]
}
```

#### 2.2.4 Update Template

```
POST /api/v1/report-templates/update
```

**Request Body:**
```json
{
  "template_id": "tpl-001",
  "name": "Updated Template Name",
  "description": "Updated description",
  "content": "Updated content...",
  "tags": ["updated", "tags"]
}
```

#### 2.2.5 Delete Template

```
POST /api/v1/report-templates/delete
```

**Request Body:**
```json
{
  "template_id": "tpl-001"
}
```

---

## 3. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| 0 | 200 | Success |
| 400001 | 400 | Invalid request parameters |
| 400002 | 400 | Report title is required |
| 400003 | 400 | Invalid report type |
| 400004 | 400 | Invalid report status |
| 404001 | 404 | Report not found |
| 404002 | 404 | Template not found |
| 404003 | 404 | Topology not found |
| 409001 | 409 | Report name already exists |
| 409002 | 409 | Cannot delete report in use |
| 500001 | 500 | Internal server error |
| 500002 | 500 | Report generation failed |

---

## 4. Frontend Features Summary

| Feature | Status | API Required |
|---------|--------|--------------|
| List reports with pagination | Ready | `POST /api/v1/reports/list` |
| Filter by type | Ready | Included in list API |
| Search by keyword | Ready | Included in list API |
| View report detail | Ready | `POST /api/v1/reports/get` |
| Create new report | UI needed | `POST /api/v1/reports/create` |
| Delete report | UI needed | `POST /api/v1/reports/delete` |
| Auto-generate report | Button ready | `POST /api/v1/reports/generate` |
| List templates | Ready | `POST /api/v1/report-templates/list` |
| Manage templates | Ready | Template CRUD APIs |

> **Note**: Reports are immutable - no update functionality is provided.

---

## 5. Database Schema Suggestion

### reports table
```sql
CREATE TABLE reports (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Final',
    author VARCHAR(100) NOT NULL,
    summary VARCHAR(500),
    content TEXT,
    tags JSON,
    topology_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_search (title, summary)
);
```

> **Note**: Reports are immutable after creation, so no `updated_at` field is needed.

### report_templates table
```sql
CREATE TABLE report_templates (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    category VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_category (category)
);
```

---

## 6. Notes

1. **API Format**: All APIs follow the project's standard POST-only pattern with JSON request/response.
2. **Pagination**: Follows the established pagination format (`page`, `size`, `totalElements`, `totalPages`).
3. **Response Wrapper**: All responses use `{ code, success, message, data }` format.
4. **Content Format**: Report content uses Markdown format for rich text rendering.
5. **Template Placeholders**: Templates use `{{placeholder_name}}` syntax for variable substitution.
6. **AI Integration**: The auto-generate feature will require integration with AI services (can be implemented in Phase 2).

---

## 7. Priority

| Priority | APIs |
|----------|------|
| P0 (Must Have) | List reports, Get report detail |
| P1 (Should Have) | Create/Delete reports |
| P2 (Nice to Have) | Template management APIs |
| P3 (Future) | Auto-generate report API |

---

*Document Version: 1.0*
*Created: 2024-12-28*
*Author: Frontend Team*
