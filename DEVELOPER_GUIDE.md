# 🔧 Developer Extension Guide

## Introduction

This guide teaches you how to extend the UK Annual Accounts Filing System with new features. The system is designed with extensibility in mind using standard patterns and modular architecture.

## Prerequisites

- Node.js v14+ installed
- Understanding of JavaScript/Node.js
- Familiarity with Express.js basics
- Git for version control

## Project Architecture Overview

The system follows the standard **MVC (Model-View-Controller)** pattern:

```
User Request
    ↓
Route Handler (/api/...)
    ↓
Middleware (Auth, Validation)
    ↓
Controller (Business Logic)
    ↓
Model (Data Access)
    ↓
Database (PostgreSQL or In-Memory)
```

## Part 1: Adding a New API Endpoint

### Example: Add Email Notifications Feature

### Step 1: Create the Model

**File:** `src/models/Notification.js`

```javascript
const db = require('../database/config');

class Notification {
  static async create(data) {
    const { user_id, type, title, message, filing_id } = data;
    
    if (!db.isConnected()) {
      // Demo mode
      const id = Math.floor(Math.random() * 1000000);
      return { id, user_id, type, title, message, filing_id, created_at: new Date() };
    }
    
    const query = `
      INSERT INTO notifications (user_id, type, title, message, filing_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(query, [user_id, type, title, message, filing_id]);
    return result.rows[0];
  }

  static async findByUser(user_id) {
    if (!db.isConnected()) {
      return [];
    }
    
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    const result = await db.query(query, [user_id]);
    return result.rows;
  }
}

module.exports = Notification;
```

### Step 2: Create the Controller

**File:** `src/controllers/notificationsController.js`

```javascript
const Notification = require('../models/Notification');

exports.list = async (req, res, next) => {
  try {
    const notifications = await Notification.findByUser(req.user.id);
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

exports.send = async (req, res, next) => {
  try {
    const { user_id, type, title, message, filing_id } = req.body;
    
    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message required'
      });
    }
    
    const notification = await Notification.create({
      user_id,
      type: type || 'info',
      title,
      message,
      filing_id
    });
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};
```

### Step 3: Create the Route

**File:** `src/routes/notifications.js`

```javascript
const express = require('express');
const { list, send } = require('../controllers/notificationsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, list);
router.post('/', authenticateToken, send);

module.exports = router;
```

### Step 4: Register the Route in Server

**File:** `src/server.js`

```javascript
// Add this line with other route registrations:
app.use('/api/notifications', require('./routes/notifications'));
```

### Step 5: Test the Endpoint

```bash
# Get notifications
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/notifications

# Send notification
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Hello","type":"info"}'
```

---

## Part 2: Adding Frontend UI Features

### Example: Add a Notifications Panel

### Step 1: Add HTML Structure

In `public/index.html`, find the `<div class="topbar">` section and add:

```html
<div class="notification-bell" onclick="toggleNotifications()">
  🔔 <span id="notif-count" class="notif-badge">0</span>
</div>

<div class="notifications-panel" id="notif-panel" style="display:none">
  <div class="notif-header">
    <h3>Notifications</h3>
    <button onclick="toggleNotifications()" style="background:none;border:none;cursor:pointer">×</button>
  </div>
  <div class="notif-list" id="notif-list">
    <p>No notifications</p>
  </div>
</div>
```

### Step 2: Add CSS Styling

```css
.notification-bell {
  cursor: pointer;
  position: relative;
  padding: 8px 12px;
  border-radius: var(--radius);
  transition: all 0.2s;
}

.notification-bell:hover {
  background: var(--navy-light);
}

.notif-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--red);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}

.notifications-panel {
  position: absolute;
  top: 60px;
  right: 20px;
  background: var(--navy-mid);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: var(--shadow);
  z-index: 100;
}

.notif-header {
  padding: 14px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notif-list {
  padding: 10px;
}

.notif-item {
  padding: 10px;
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.notif-item:hover {
  background: var(--navy-light);
}
```

### Step 3: Add JavaScript Functions

```javascript
let notificationsOpen = false;

function toggleNotifications() {
  const panel = document.getElementById('notif-panel');
  notificationsOpen = !notificationsOpen;
  panel.style.display = notificationsOpen ? 'block' : 'none';
  if (notificationsOpen) loadNotifications();
}

async function loadNotifications() {
  try {
    const res = await apiCall('GET', '/notifications');
    const notifs = res.data || [];
    
    const list = document.getElementById('notif-list');
    if (notifs.length === 0) {
      list.innerHTML = '<p style="padding:10px;text-align:center;color:var(--muted)">No notifications</p>';
      return;
    }
    
    list.innerHTML = notifs.map(n => `
      <div class="notif-item" onclick="handleNotification('${n.id}')">
        <div style="font-weight:600">${n.title}</div>
        <div style="color:var(--muted);font-size:11px">${n.message}</div>
        <div style="color:var(--muted);font-size:10px">${new Date(n.created_at).toLocaleDateString()}</div>
      </div>
    `).join('');
    
    document.getElementById('notif-count').textContent = notifs.length;
  } catch(e) {
    console.error('Failed to load notifications', e);
  }
}

function handleNotification(notifId) {
  toast('Notification clicked: ' + notifId, 'info');
}
```

---

## Part 3: Adding Database Features

### Example: Add Audit Logging

### Step 1: Create Database Table

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id INTEGER,
  changes JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Step 2: Create Audit Model

```javascript
// src/models/AuditLog.js
class AuditLog {
  static async log(user_id, action, resourceType, resourceId, changes = {}) {
    const ip_address = '127.0.0.1'; // In real app, get from req.ip
    
    if (!db.isConnected()) return null;
    
    const query = `
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      user_id,
      action,
      resourceType,
      resourceId,
      JSON.stringify(changes),
      ip_address
    ]);
    
    return result.rows[0];
  }
}

module.exports = AuditLog;
```

### Step 3: Use in Controllers

```javascript
// src/controllers/companiesController.js
const AuditLog = require('../models/AuditLog');

exports.update = async (req, res, next) => {
  try {
    const company = await Company.update(req.params.id, req.body);
    
    // Log the change
    await AuditLog.log(
      req.user.id,
      'UPDATE_COMPANY',
      'Company',
      req.params.id,
      req.body
    );
    
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};
```

---

## Part 4: Adding Calculations

### Example: Add Tax Calculation

**File:** `src/utils/taxCalculator.js`

```javascript
/**
 * Calculate corporation tax (UK rates 2025)
 * @param {number} profit - Pre-tax profit
 * @returns {Object} Tax calculation details
 */
function calculateTax(profit) {
  const SMALL_COMPANY_RATE = 0.19;  // 19% for profits under £50k
  const STANDARD_RATE = 0.25;        // 25% for profits over £250k
  const MARGINAL_RATE = 0.25;        // Marginal rate between £50k-£250k

  let tax = 0;

  if (profit <= 50000) {
    tax = profit * SMALL_COMPANY_RATE;
  } else if (profit <= 250000) {
    // Marginal relief applies
    const thresholdProfit = profit - 50000;
    tax = (50000 * SMALL_COMPANY_RATE) + (thresholdProfit * MARGINAL_RATE);
  } else {
    tax = profit * STANDARD_RATE;
  }

  return {
    profit,
    tax: Math.round(tax),
    rate: profit <= 50000 ? SMALL_COMPANY_RATE : STANDARD_RATE,
    netProfit: profit - Math.round(tax),
    effectiveRate: (Math.round(tax) / profit * 100).toFixed(2) + '%'
  };
}

module.exports = { calculateTax };
```

**Use in Frontend:**

```javascript
function calcAndDisplayTax() {
  const operatingProfit = parseFloat(document.getElementById('op-profit-value')?.textContent || 0);
  
  // Add tax calculation endpoint
  fetch(`/api/calculate/tax?profit=${operatingProfit}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById('tax-display').innerHTML = `
        <div>Tax: £${data.data.tax}</div>
        <div style="font-size:11px;color:var(--muted)">Rate: ${data.data.rate * 100}%</div>
      `;
    });
}
```

---

## Part 5: Common Extension Patterns

### Pattern 1: Add a New Section to the Form

```html
<!-- In public/index.html, add new page-wrapper -->
<div class="page-wrapper" id="sec-newsection">
  <div class="page-hdr">
    <div class="page-hdr-left">
      <h2>New Section</h2>
      <p>Description of the section</p>
    </div>
  </div>
  
  <div class="card">
    <div class="card-hdr"><h3>Content</h3></div>
    <div class="field">
      <label>Field Name</label>
      <input type="text" id="field-id" placeholder="Enter value">
    </div>
  </div>
  
  <button class="btn btn-primary" onclick="saveSectionAndNext('newsection','nextsection')">
    Continue →
  </button>
</div>

<!-- Update sidebar -->
<div class="nav-item" onclick="showSection('newsection')">
  <span class="nav-icon">📌</span><span>New Section</span>
  <span class="nav-check" id="chk-newsection"></span>
</div>
```

### Pattern 2: Add Validation

```javascript
// In src/middleware/validators.js
function validateNewSection(req, res, next) {
  const { field_required } = req.body;
  
  if (!field_required) {
    return res.status(400).json({
      success: false,
      error: 'Field required is mandatory'
    });
  }
  
  next();
}

module.exports = validateNewSection;

// Use in route
router.post('/', validateNewSection, controller.create);
```

### Pattern 3: Add Calculations

```javascript
// Client-side
function calculateNewMetric() {
  const value1 = parseFloat(document.getElementById('input1').value) || 0;
  const value2 = parseFloat(document.getElementById('input2').value) || 0;
  
  const result = value1 + value2;
  document.getElementById('result').textContent = formatCurrency(result);
}

// Server-side
router.post('/calculate', (req, res) => {
  const result = req.body.value1 + req.body.value2;
  res.json({
    success: true,
    data: { result }
  });
});
```

---

## Part 6: Testing Your Extensions

### Unit Testing

**File:** `test/companies.test.js`

```javascript
const request = require('supertest');
const app = require('../src/server');

describe('Companies', () => {
  it('should create a company', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${token}`)
      .send({
        company_name: 'Test Co',
        company_number: '11111111'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
```

### Manual Testing

```bash
# Test new endpoint
curl -X POST http://localhost:3000/api/MyNewFeature \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":"value"}'

# Check response
# Should return: { success: true, data: {...} }
```

---

## Part 7: Best Practices

### 1. Follow the MVC Pattern
- Routes → Controllers → Models → Database

### 2. Use Async/Await
```javascript
// Good
async function getCompany(id) {
  const company = await Company.findById(id);
  return company;
}

// Avoid
function getCompany(id) {
  Company.findById(id).then(company => company);
}
```

### 3. Error Handling
```javascript
try {
  const data = await model.operation();
  res.json({ success: true, data });
} catch (error) {
  next(error); // Pass to error handler
}
```

### 4. Validation
```javascript
// Validate inputs
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return res.status(400).json({ success: false, error: 'Invalid email' });
}
```

### 5. Security
- Always authenticate protected routes
- Validate and sanitize inputs
- Use parameterized queries
- Don't expose sensitive data

### 6. Logging
```javascript
console.log('Operation started:', { userId, action });
console.error('Operation failed:', error.message);
```

---

## Part 8: File Organization

```
src/
├── models/
│   ├── User.js
│   ├── Company.js
│   └── MyNewModel.js          ← Add here
├── controllers/
│   ├── companiesController.js
│   └── myNewController.js     ← Add here
├── routes/
│   ├── companies.js
│   └── myNewRoute.js          ← Add here
├── middleware/
│   ├── auth.js
│   ├── validators.js
│   └── myNewMiddleware.js     ← Add here
├── utils/
│   ├── pdfGenerator.js
│   └── myUtility.js           ← Add here
└── database/
    └── config.js
```

---

## Part 9: Useful Code Snippets

### Get Current User
```javascript
exports.getProfile = async (req, res, next) => {
  const userId = req.user.id;  // From JWT middleware
  const user = await User.findById(userId);
  res.json({ success: true, data: user });
};
```

### Format Currency
```javascript
function formatCurrency(amount) {
  return '£' + parseFloat(amount).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
```

### Parse Form Data
```javascript
const formData = new FormData(document.querySelector('form'));
const data = Object.fromEntries(formData);

// Send to API
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify(data)
});
```

---

## Part 10: Debugging Tips

### Check Server Logs
```bash
npm run dev
# Watch for console.error() and console.log() messages
```

### Test API with cURL
```bash
curl -X GET http://localhost:3000/api/test \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -v  # verbose for debugging
```

### Use Browser DevTools
- F12 → Network tab to see all requests/responses
- Console for JavaScript errors
- Application tab for localStorage

### Add Debug Logging
```javascript
console.log('DEBUG:', { variable1, variable2 });
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

---

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Best Practices](https://nodejs.org/en/docs/)
- [JavaScript MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/)

---

*Last updated: March 22, 2026*
