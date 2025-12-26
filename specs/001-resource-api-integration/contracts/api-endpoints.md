# API Endpoints: 资源管理

**Base URL**: `/api/v1`
**Authentication**: Bearer Token (JWT)
**Content-Type**: `application/json`

---

## Resource CRUD

### 查询资源列表

```
POST /api/v1/resources/query
```

**Request Body**:
```json
{
  "resourceTypeId": 1,        // 可选
  "status": "RUNNING",        // 可选: RUNNING|STOPPED|MAINTENANCE|OFFLINE
  "keyword": "web",           // 可选
  "page": 1,                  // 默认 1
  "size": 10                  // 默认 10, 最大 100
}
```

**Response** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "content": [
      {
        "id": 1,
        "name": "web-server-01",
        "description": "生产环境Web服务器",
        "resourceTypeId": 1,
        "resourceTypeName": "服务器",
        "resourceTypeCode": "SERVER",
        "status": "RUNNING",
        "statusDisplay": "运行中",
        "attributes": "{\"ip\":\"192.168.1.100\"}",
        "version": 1,
        "createdAt": "2025-12-25T10:00:00Z",
        "updatedAt": "2025-12-25T10:00:00Z",
        "createdBy": 1
      }
    ],
    "page": 1,
    "size": 10,
    "totalElements": 100,
    "totalPages": 10,
    "first": true,
    "last": false
  },
  "success": true
}
```

---

### 创建资源

```
POST /api/v1/resources/create
```

**Request Body**:
```json
{
  "name": "web-server-01",         // 必填, max 100
  "description": "生产环境服务器",  // 可选, max 500
  "resourceTypeId": 1,             // 必填
  "attributes": "{\"ip\":\"192.168.1.100\"}"  // 可选, JSON
}
```

**Response** (201):
```json
{
  "id": 1,
  "name": "web-server-01",
  "description": "生产环境服务器",
  "resourceTypeId": 1,
  "resourceTypeName": "服务器",
  "resourceTypeCode": "SERVER",
  "status": "RUNNING",
  "statusDisplay": "运行中",
  "attributes": "{\"ip\":\"192.168.1.100\"}",
  "version": 1,
  "createdAt": "2025-12-25T10:00:00Z",
  "updatedAt": "2025-12-25T10:00:00Z",
  "createdBy": 1
}
```

**Errors**:
- 400: 参数无效
- 409: 资源名称已存在

---

### 获取资源详情

```
POST /api/v1/resources/get
```

**Request Body**:
```json
{
  "id": 1    // 必填
}
```

**Response** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": { /* ResourceDTO */ },
  "success": true
}
```

**Errors**:
- 404: 资源不存在

---

### 更新资源

```
POST /api/v1/resources/update
```

**Request Body**:
```json
{
  "id": 1,                          // 必填
  "name": "web-server-02",          // null=不修改
  "description": "测试环境服务器",   // null=不修改
  "attributes": "{\"ip\":\"192.168.1.101\"}",  // null=不修改
  "version": 1                      // 必填, 乐观锁
}
```

**Response** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": { /* ResourceDTO with version: 2 */ },
  "success": true
}
```

**Errors**:
- 400: 参数无效
- 403: 无权限
- 404: 资源不存在
- 409: 版本冲突

---

### 更新资源状态

```
POST /api/v1/resources/update-status
```

**Request Body**:
```json
{
  "id": 1,              // 必填
  "status": "STOPPED",  // 必填: RUNNING|STOPPED|MAINTENANCE|OFFLINE
  "version": 1          // 必填, 乐观锁
}
```

**Response** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": { /* ResourceDTO with updated status */ },
  "success": true
}
```

**Errors**:
- 400: 无效的状态值
- 404: 资源不存在
- 409: 版本冲突

---

### 删除资源

```
POST /api/v1/resources/delete
```

**Request Body**:
```json
{
  "id": 1,                       // 必填
  "confirmName": "web-server-01" // 必填, 必须匹配资源名称
}
```

**Response** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": null,
  "success": true
}
```

**Errors**:
- 400: 资源名称确认不匹配
- 403: 无权限
- 404: 资源不存在

---

## Resource Types

### 查询资源类型列表

```
POST /api/v1/resource-types/query
```

**Request Body**:
```json
{
  "page": 1,   // 可选
  "size": 20   // 可选
}
```

**Response** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "code": "SERVER",
      "name": "服务器",
      "description": "物理服务器或虚拟机",
      "icon": "server-icon",
      "systemPreset": true
    }
  ],
  "success": true
}
```

---

## Audit Logs

### 查询审计日志

```
POST /api/v1/resources/audit-logs/query
```

**Request Body**:
```json
{
  "resourceId": 1,  // 必填
  "page": 1,        // 可选
  "size": 20        // 可选
}
```

**Response** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "content": [
      {
        "id": 1,
        "resourceId": 1,
        "operation": "UPDATE",
        "operationDisplay": "更新",
        "oldValue": "{\"name\":\"old-name\"}",
        "newValue": "{\"name\":\"new-name\"}",
        "operatorId": 1,
        "operatorName": "张三",
        "operatedAt": "2025-12-25T10:00:00Z"
      }
    ],
    "page": 1,
    "size": 20,
    "totalElements": 5,
    "totalPages": 1,
    "first": true,
    "last": true
  },
  "success": true
}
```

**Errors**:
- 404: 资源不存在

---

## Common Error Response Format

```json
{
  "code": 40001,
  "message": "资源名称已存在",
  "data": null,
  "success": false
}
```

| HTTP Status | Description |
|-------------|-------------|
| 400 | 请求参数无效 |
| 401 | 未认证或 Token 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突（名称重复/版本冲突）|
| 500 | 服务器内部错误 |
