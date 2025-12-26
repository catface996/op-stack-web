# API Contract: Model Management

**Feature**: 008-model-api-integration
**Base URL**: `/api/v1/models` (proxied to localhost:7070)
**Protocol**: HTTP POST (all endpoints)

## Endpoints

### 1. List Models

**Endpoint**: `POST /api/v1/models/list`

**Request**:
```json
{
  "page": 1,
  "size": 8,
  "is_active": true,
  "operatorId": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | number | Yes | Page number (1-based) |
| `size` | number | Yes | Items per page |
| `is_active` | boolean | No | Filter by active status |
| `operatorId` | number | Auto | Injected in dev mode |

**Response** (200 OK):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "GPT-4 Turbo",
        "model_id": "gpt-4-turbo",
        "description": "Latest GPT-4 model",
        "is_active": true,
        "max_tokens": 128000,
        "temperature": 0.7,
        "top_p": 1.0,
        "region": "us-east-1"
      }
    ],
    "total": 15,
    "page": 1,
    "size": 8
  }
}
```

---

### 2. Create Model

**Endpoint**: `POST /api/v1/models/create`

**Request**:
```json
{
  "name": "Claude 3 Opus",
  "model_id": "claude-3-opus",
  "description": "Most capable Claude model",
  "is_active": true,
  "max_tokens": 200000,
  "temperature": 0.5,
  "top_p": 0.9,
  "region": "us-west-2",
  "operatorId": 1
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | Non-empty |
| `model_id` | string | Yes | Non-empty, unique |
| `description` | string | No | - |
| `is_active` | boolean | No | Default: true |
| `max_tokens` | number | No | Positive integer |
| `temperature` | number | No | 0.0-2.0 |
| `top_p` | number | No | 0.0-1.0 |
| `region` | string | No | - |

**Response** (201 Created):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 2,
    "name": "Claude 3 Opus",
    "model_id": "claude-3-opus",
    ...
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "code": 400,
  "message": "model_id already exists"
}
```

---

### 3. Get Model

**Endpoint**: `POST /api/v1/models/get`

**Request**:
```json
{
  "id": 1,
  "operatorId": 1
}
```

**Response** (200 OK):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "GPT-4 Turbo",
    "model_id": "gpt-4-turbo",
    ...
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "code": 404,
  "message": "Model not found"
}
```

---

### 4. Update Model

**Endpoint**: `POST /api/v1/models/update`

**Request**:
```json
{
  "id": 1,
  "name": "GPT-4 Turbo (Updated)",
  "is_active": false,
  "operatorId": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Model ID to update |
| Other fields | various | No | Only changed fields |

**Response** (200 OK):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "GPT-4 Turbo (Updated)",
    ...
  }
}
```

---

### 5. Delete Model

**Endpoint**: `POST /api/v1/models/delete`

**Request**:
```json
{
  "id": 1,
  "operatorId": 1
}
```

**Response** (200 OK):
```json
{
  "code": 0,
  "message": "success"
}
```

**Error Response** (404 Not Found):
```json
{
  "code": 404,
  "message": "Model not found"
}
```

---

## Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 200 | 0 | Success |
| 201 | 0 | Created |
| 400 | 400 | Bad request / Validation error |
| 401 | 401 | Unauthorized |
| 404 | 404 | Not found |
| 500 | 500 | Internal server error |

## Timeout

All requests should complete within **10 seconds**. Client should abort and display error after timeout.

## Authentication

- Development: `operatorId` auto-injected by client
- Production: Gateway handles authentication via JWT token
