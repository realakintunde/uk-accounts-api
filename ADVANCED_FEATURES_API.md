# Advanced Features API Documentation

## Overview
This document outlines all new API endpoints added to the UK Annual Accounts Filing System.

---

## USER MANAGEMENT ENDPOINTS

### Get Company Members
```
GET /api/management/:companyId/members
```
Returns all members of a company with their roles.

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin",
    "status": "active",
    "created_at": "2026-03-22T10:00:00Z"
  }
]
```

### Add User to Company
```
POST /api/management/:companyId/members
```
Adds a new user to a company with a specified role.

**Request Body:**
```json
{
  "userId": "uuid",
  "roleId": "uuid"
}
```

### Update User Role
```
PUT /api/management/:companyId/members/:userId
```
Changes a user's role in the company.

**Request Body:**
```json
{
  "roleId": "uuid"
}
```

### Remove User from Company
```
DELETE /api/management/:companyId/members/:userId
```
Removes a user from the company.

---

## AUDIT LOG ENDPOINTS

### Get Company Audit Logs
```
GET /api/management/:companyId/audit-logs?limit=100&offset=0
```
Retrieves audit log entries for a company.

**Response:**
```json
[
  {
    "id": "uuid",
    "action": "document_updated",
    "user_email": "user@example.com",
    "table_name": "documents",
    "record_id": "uuid",
    "old_values": { ... },
    "new_values": { ... },
    "created_at": "2026-03-22T10:00:00Z"
  }
]
```

### Get Record History
```
GET /api/management/:companyId/audit-logs/record/:recordId?tableName=documents
```
Retrieves the complete history of changes for a specific record.

---

## NOTIFICATION ENDPOINTS

### Get User Notifications
```
GET /api/management/notifications?unread=true&limit=50
```
Retrieves user's notifications (optionally filtered to unread only).

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "approval_requested",
    "title": "Document Approval Requested",
    "message": "A document requires your approval",
    "is_read": false,
    "created_at": "2026-03-22T10:00:00Z"
  }
]
```

### Get Unread Count
```
GET /api/management/notifications/unread/count
```

**Response:**
```json
{
  "unreadCount": 5
}
```

### Mark Notification as Read
```
PUT /api/management/notifications/:notificationId/read
```

### Mark All as Read
```
PUT /api/management/notifications/read-all
```

### Delete Notification
```
DELETE /api/management/notifications/:notificationId
```

---

## FINANCIAL ENDPOINTS

### BUDGETS

#### Create Budget
```
POST /api/financial/:companyId/budgets
```

**Request Body:**
```json
{
  "name": "2026 Operating Budget",
  "fiscalYear": 2026,
  "totalBudget": 500000,
  "items": [
    { "category": "Salaries", "amount": 200000 },
    { "category": "Operations", "amount": 150000 },
    { "category": "Marketing", "amount": 100000 },
    { "category": "Technology", "amount": 50000 }
  ]
}
```

#### Get Budgets
```
GET /api/financial/:companyId/budgets?fiscalYear=2026
```

#### Get Budget Items
```
GET /api/financial/:companyId/budgets/:budgetId/items
```

**Response:**
```json
[
  {
    "id": "uuid",
    "category": "Salaries",
    "budgeted_amount": 200000,
    "actual_amount": 180000,
    "variance_percentage": -10.0
  }
]
```

---

### BANK RECONCILIATION

#### Create Bank Account
```
POST /api/financial/:companyId/bank-accounts
```

**Request Body:**
```json
{
  "accountName": "Main Operating Account",
  "accountNumber": "12345678",
  "sortCode": "201530",
  "bankName": "Example Bank",
  "currencyId": "uuid"
}
```

#### Get Bank Accounts
```
GET /api/financial/:companyId/bank-accounts
```

#### Import Bank Transaction
```
POST /api/financial/:companyId/bank-transactions
```

**Request Body:**
```json
{
  "bankAccountId": "uuid",
  "transactionDate": "2026-03-22",
  "reference": "CHQ001",
  "description": "Office supplies purchase",
  "amount": 250.00,
  "type": "debit"
}
```

#### Get Bank Transactions
```
GET /api/financial/:companyId/bank-accounts/:accountId/transactions?reconciled=false
```

#### Reconcile Transaction
```
PUT /api/financial/:companyId/bank-transactions/:transactionId/reconcile
```

---

### RECURRING ENTRIES

#### Create Recurring Entry
```
POST /api/financial/:companyId/recurring-entries
```

**Request Body:**
```json
{
  "description": "Monthly rent payment",
  "amount": 5000.00,
  "category": "Rent",
  "frequency": "monthly",
  "startDate": "2026-03-22",
  "endDate": "2028-03-22"
}
```

#### Get Recurring Entries
```
GET /api/financial/:companyId/recurring-entries
```

---

### TAX SETTINGS

#### Set Tax Settings
```
POST /api/financial/:companyId/tax-settings
```

**Request Body:**
```json
{
  "taxYearEnd": "03-31",
  "vatRate": 20.0,
  "corporationTaxRate": 19.0,
  "payrollTaxRate": 8.0,
  "nextTaxReturn": "2026-04-15"
}
```

#### Get Tax Settings
```
GET /api/financial/:companyId/tax-settings
```

---

## DOCUMENT VERSIONING ENDPOINTS

### Create Document Version
```
POST /api/documents/:documentId/versions
```

**Request Body:**
```json
{
  "content": { ... },
  "changeSummary": "Updated revenue figures",
  "companyId": "uuid"
}
```

### Get Document Versions
```
GET /api/documents/:documentId/versions?limit=50
```

**Response:**
```json
[
  {
    "id": "uuid",
    "version_number": 2,
    "created_by_email": "user@example.com",
    "change_summary": "Updated revenue figures",
    "status": "draft",
    "created_at": "2026-03-22T10:00:00Z"
  }
]
```

### Get Specific Version
```
GET /api/documents/versions/:versionId
```

### Compare Versions
```
GET /api/documents/:documentId/versions/compare?fromVersionId=uuid&toVersionId=uuid
```

**Response:**
```json
{
  "version1": { ... },
  "version2": { ... },
  "changes": {
    "revenue": { "from": 1000000, "to": 1100000 },
    "expenses": { "from": 500000, "to": 520000 }
  }
}
```

---

## DOCUMENT COMMENTS & APPROVAL ENDPOINTS

### Add Document Comment
```
POST /api/documents/:documentId/comments
```

**Request Body:**
```json
{
  "comment": "Need to clarify this figure",
  "versionId": "uuid",
  "companyId": "uuid"
}
```

### Get Document Comments
```
GET /api/documents/:documentId/comments
```

### Create Approval Workflow
```
POST /api/documents/:companyId/approvals
```

**Request Body:**
```json
{
  "documentId": "uuid",
  "approverIds": ["uuid1", "uuid2", "uuid3"]
}
```

### Get Workflow
```
GET /api/documents/:companyId/approvals/:workflowId
```

### Approve Step
```
PUT /api/documents/:companyId/approvals/:workflowId/steps/:stepId/approve
```

**Request Body:**
```json
{
  "comment": "Looks good, approved"
}
```

### Reject Step
```
PUT /api/documents/:companyId/approvals/:workflowId/steps/:stepId/reject
```

**Request Body:**
```json
{
  "comment": "Need revisions on the cash flow section"
}
```

### Get Pending Approvals
```
GET /api/documents/approvals/pending
```

---

## RESPONSE CODES

- `200 OK` - Request successful
- `201 Created` - Resource successfully created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## AUTHENTICATION

All endpoints (except public ones) require JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## ROLES & PERMISSIONS

### Available Roles:
- **admin** - Full access to all features
- **accountant** - Can create and edit financial statements
- **viewer** - Read-only access to reports
- **approver** - Can approve document submissions

---

## ERROR HANDLING

All error responses follow this format:

```json
{
  "error": "Description of the error",
  "statusCode": 400,
  "timestamp": "2026-03-22T10:00:00Z"
}
```

---

## PAGINATION

Endpoints that return lists support pagination:

```
GET /api/management/:companyId/audit-logs?limit=50&offset=0
```

- `limit` - Number of items per page (default: 50)
- `offset` - Number of items to skip (default: 0)

---

## FILTERING

Supported query filters vary by endpoint. Common filters include:

- `unread` - Boolean filter for notifications
- `reconciled` - Boolean filter for bank transactions
- `fiscalYear` - Integer filter for budgets
- `status` - String filter for approvals

---
