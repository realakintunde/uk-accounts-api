# 🏗️ System Architecture & Design

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                   (HTML5 + JavaScript)                          │
│                    /public/index.html                           │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS SERVER                          │
│                    (Node.js Runtime)                            │
│                   src/server.js (Port 3000)                    │
└─────────────────────────────────────────────────────────────────┘
  ↓                     ↓                      ↓                 ↓
┌───────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐
│   Routes      │ │ Middleware   │ │ Controllers  │ │   Models   │
│   (5 files)   │ │  (3 files)   │ │  (5 files)   │ │  (5 files) │
└───────────────┘ └──────────────┘ └──────────────┘ └────────────┘
                              ↓
                    ┌──────────────────┐
                    │   Data Storage   │
                    ├──────────────────┤
                    │ IN-MEMORY (Demo) │  ← Current (for testing)
                    │ PostgreSQL       │  ← Optional (for production)
                    └──────────────────┘
```

---

## Frontend Architecture

### Location
```
/public/index.html (1 file, 2689 lines)
```

### Technology Stack
- **HTML5**: Semantic markup and forms
- **CSS3**: Custom design system with CSS variables
- **JavaScript (Vanilla)**: No frameworks, pure JS
- **IndexedDB**: Client-side storage (fallback)
- **Fetch API**: XMLHttpRequest replacement

### Design System

**CSS Variables** (Theme Control):
```css
--navy:       #0b1829    /* Primary dark background */
--gold:       #c9a84c    /* Accent color */
--cream:      #f2ede3    /* Text color */
--red:        #b83232    /* Error/danger states *)
--green:      #1c7a4a    /* Success states *)
```

**Color Palette**:
- Navy/Gold/Cream (professional, financial look)
- Responsive grid system (CSS Grid + Flexbox)
- Consistent spacing and typography
- Accessibility-first design

### Components

```javascript
// Layout Components
├── Auth Screen (login/register)
├── Topbar (navigation, company selector)
├── Sidebar (section navigation)
├── Main Content (page wrappers)

// Form Components
├── Text inputs, selects, textareas
├── Tables with editable cells
├── Date pickers
├── Checkboxes

// Data Display
├── Cards (section containers)
├── Toast notifications
├── Modal dialogs
├── Data tables

// Calculated Sections
├── Balance Sheet (auto-calculation)
├── P&L Account (auto-calculation)
├── Cash Flow (auto-calculation)
```

### Data Flow

```
User Input
    ↓
Validation (Client-side)
    ↓
API Call (fetch with JWT token)
    ↓
Server Response
    ↓
Update DOM / Show Toast
    ↓
Save to localStorage (draft)
```

### Authentication Flow

```
1. User registers:    Email + Password → /auth/register → JWT Token
2. User logs in:      Email + Password → /auth/login → JWT Token
3. Token stored:      localStorage.setItem('uk_accounts_token')
4. API requests:      Headers: { Authorization: 'Bearer <token>' }
5. Protected routes:   Server checks token validity
6. Session expires:    After 24 hours (JWT expiry)
```

---

## Backend Architecture

### Project Structure

```
src/
├── server.js                 # Express app entry point
├── routes/                   # API endpoints
│   ├── auth.js              # Authentication
│   ├── companies.js         # Company CRUD
│   ├── statements.js        # Financial statements
│   ├── filings.js           # Filing submission
│   └── documents.js         # Document management
├── controllers/             # Business logic
│   ├── authController.js
│   ├── companiesController.js
│   ├── statementsController.js
│   ├── filingsController.js
│   └── documentsController.js
├── models/                  # Data models
│   ├── User.js             # User model with in-memory fallback
│   ├── Company.js          # Company model with in-memory fallback
│   ├── FinancialStatement.js
│   ├── Filing.js
│   └── Document.js
├── middleware/             # Middleware functions
│   ├── auth.js            # JWT authentication
│   ├── errorHandler.js    # Global error handling
│   └── validators.js      # Input validation
└── database/             # Database configuration
    ├── config.js         # Connection pool & graceful fallback
    └── migrations.js     # Schema definitions
```

### Technology Stack

**Runtime**: Node.js  
**Framework**: Express.js v4.18.0  
**Authentication**: JWT (jsonwebtoken)  
**Password Hashing**: bcryptjs  
**Database**: PostgreSQL (optional)  
**Database Driver**: node-postgres (pg)  
**Logging**: Morgan  

### API Design

**Base URL**:
```
http://localhost:3000/api
```

**RESTful Convention**:
```
GET    /resource          → List all
POST   /resource          → Create new
GET    /resource/:id      → Get one
PUT    /resource/:id      → Update one
DELETE /resource/:id      → Delete one
```

**Authentication**:
```
Headers: {
  Authorization: 'Bearer <jwt_token>',
  Content-Type: 'application/json'
}
```

**Response Format**:
```javascript
{
  success: true,           // Operation status
  data: { /* ... */ },    // Response data
  message: "..."          // Human-readable message
}
```

### Controllers Pattern

Each controller follows this pattern:

```javascript
// controllers/companiesController.js

exports.getAll = async (req, res, next) => {
  try {
    const data = await Company.findAll();
    res.json({ success: true, data });
  } catch (error) {
    next(error);  // Pass to error handler
  }
};

exports.create = async (req, res, next) => {
  try {
    const { company_name, company_number } = req.body;
    
    // Validation
    if (!company_name || !company_number) {
      return res.status(400).json({
        success: false,
        error: 'Name and number required'
      });
    }
    
    // Create
    const company = await Company.create(req.body);
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};
```

### Models Pattern

Each model provides database abstraction:

```javascript
// models/Company.js

class Company {
  static async findAll(limit = 10, offset = 0) {
    if (!db.isConnected()) {
      // Demo mode: return from in-memory Map
      return Array.from(inMemoryCompanies.values())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(offset, offset + limit);
    }
    // Production mode: query PostgreSQL
    const result = await db.query(sql, params);
    return result.rows;
  }

  static async create(data) {
    // ...
  }
}
```

### Middleware

**auth.js**: JWT Token Verification
```javascript
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token' });
  }
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(403).json({ success: false, error: 'Invalid token' });
  }
}
```

**errorHandler.js**: Global Error Handler
```javascript
function errorHandler(error, req, res, next) {
  console.error('Error:', error.message);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}
```

**validators.js**: Input Validation
```javascript
function validateCompanyData(req, res, next) {
  const { company_name, company_number } = req.body;
  
  if (!company_name || company_name.length < 2) {
    return res.status(400).json({ success: false, error: 'Invalid name' });
  }
  
  if (!company_number || !/^\d{8}$/.test(company_number)) {
    return res.status(400).json({ success: false, error: 'Invalid CRN' });
  }
  
  next();
}
```

---

## Database Architecture

### Schema Design

**Users Table**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Companies Table**
```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  company_number VARCHAR(8) UNIQUE,
  company_name VARCHAR(255),
  business_address VARCHAR(500),
  registered_office VARCHAR(500),
  industry_classification VARCHAR(100),
  incorporation_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Financial Statements Table**
```sql
CREATE TABLE financial_statements (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  statement_type VARCHAR(50),
  period_start_date DATE,
  period_end_date DATE,
  revenue DECIMAL(15,2),
  cost_of_goods_sold DECIMAL(15,2),
  gross_profit DECIMAL(15,2),
  operating_expenses DECIMAL(15,2),
  operating_profit DECIMAL(15,2),
  total_assets DECIMAL(15,2),
  total_liabilities DECIMAL(15,2),
  shareholders_equity DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Filings Table**
```sql
CREATE TABLE filings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  filing_type VARCHAR(50),
  filing_date DATE,
  filing_reference VARCHAR(50),
  submitted_by INTEGER REFERENCES users(id),
  filing_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Documents Table**
```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  document_type VARCHAR(50),
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Dual-Mode Operation (Demo vs Production)

**Demo Mode** (In-Memory):
```javascript
// src/models/Company.js

const inMemoryCompanies = new Map();

if (!db.isConnected()) {
  // Uses Map data structure
  const company = inMemoryCompanies.get(id);
  return company;
}
```

**Production Mode** (PostgreSQL):
```javascript
if (db.isConnected()) {
  // Uses PostgreSQL pool
  const result = await db.query('SELECT * FROM companies WHERE id = $1', [id]);
  return result.rows[0];
}
```

---

## Security Architecture

### Authentication Flow

```
1. Login Request:
   POST /api/auth/login
   { email: "user@example.com", password: "secret" }

2. Server:
   - Lookup user by email
   - Hash password with bcrypt
   - Compare hashes
   - Generate JWT token

3. Response:
   {
     success: true,
     data: {
       user: { id, email, name, role },
       token: "eyJhbGc..."  // JWT
     }
   }

4. Client:
   - Store token in localStorage
   - Add to all API request headers
   - Token expires after 24h

5. Protected Request:
   GET /api/companies
   Headers: { Authorization: "Bearer eyJhbGc..." }

6. Middleware Check:
   - Extract token from header
   - Verify signature
   - Check expiry
   - Continue if valid, 401 if not
```

### JWT Token Structure

```javascript
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload (claims)
{
  "id": 1,
  "email": "user@example.com",
  "role": "user",
  "iat": 1711097048,      // Issued at
  "exp": 1711183448       // Expires in 24h
}

// Signature
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  'secret'
)
```

### Password Security

```javascript
// Registration
password = "MyPassword123"
↓
hash = bcrypt.hash(password, 10)
↓
store: password_hash = "$2a$10$..."

// Login
entered_password = "MyPassword123"
↓
bcrypt.compare(entered_password, stored_hash)
↓
boolean: true/false
```

### Data Protection

- ✓ Passwords hashed with bcryptjs (10 rounds)
- ✓ JWT tokens signed with secret key
- ✓ HTTPS recommended (not enforced in dev)
- ✓ SQL injection prevented (parameterized queries)
- ✓ XSS protected (server returns JSON, not HTML)
- ✓ CORS configured for frontend origin

---

## Calculation Engine

### Balance Sheet Validation

```javascript
function calcBS() {
  // Sum all asset inputs
  let assetTotal = 0;
  document.querySelectorAll('#tbl-assets .bs-input')
    .forEach(el => assetTotal += parseFloat(el.value) || 0);
  
  // Sum all liability inputs
  let liabTotal = 0;
  document.querySelectorAll('#tbl-liab .bs-input')
    .forEach(el => liabTotal += parseFloat(el.value) || 0);
  
  // Display totals
  document.getElementById('total-assets').textContent = 
    '£' + assetTotal.toLocaleString();
  document.getElementById('total-liab').textContent = 
    '£' + liabTotal.toLocaleString();
  
  // Validate balance
  if (assetTotal !== liabTotal) {
    console.warn('Balance Sheet does not balance!');
  }
}
```

### P&L Calculation

```javascript
function calcPL() {
  const [turnover, cos, opex, tax] = getInputValues('#tbl-pl .pl-input');
  
  const gross = turnover - cos;
  const operating = gross - opex;
  const net = operating - tax;
  
  document.getElementById('gross-profit').textContent = formatCurrency(gross);
  document.getElementById('op-profit').textContent = formatCurrency(operating);
  document.getElementById('net-profit').textContent = formatCurrency(net);
}
```

### Cash Flow Calculation

```javascript
function calcCF() {
  const inputs = getInputValues('#tbl-cf .cf-input');
  const total = inputs.reduce((sum, val) => sum + val, 0);
  
  document.getElementById('net-cf').textContent = formatCurrency(total);
}
```

---

## Error Handling

### Strategy

```javascript
// Try-catch in routes
try {
  const data = await Company.findAll();
  res.json({ success: true, data });
} catch (error) {
  // Pass to global error handler
  next(error);
}

// Global error handler
app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || 'Internal server error';
  
  res.status(status).json({
    success: false,
    error: message
  });
});
```

### HTTP Status Codes

```
200 OK               - Request successful
201 Created          - Resource created
400 Bad Request      - Invalid input
401 Unauthorized     - Missing/invalid token
403 Forbidden        - Insufficient permissions
404 Not Found        - Resource doesn't exist
409 Conflict         - Resource already exists
500 Server Error     - Unexpected error
```

---

## Performance Considerations

### Frontend
- ✓ Vanilla JS (no framework overhead)
- ✓ CSS Grid for responsive layout
- ✓ Debounced calculations (prevents recalc spam)
- ✓ Event delegation for tables
- ✓ LocalStorage for draft saving

### Backend
- ✓ Connection pooling (PostgreSQL)
- ✓ In-memory option (eliminates DB latency)
- ✓ Parameterized queries (prevent injection)
- ✓ JSON response format (fast parsing)
- ✓ Morgan logging (debug-friendly)

### Scaling Opportunities
- Redis caching layer
- Database indexing
- API rate limiting
- Response compression
- Database pagination

---

## Development Workflow

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (with nodemon auto-reload)
npm run dev

# 3. In another terminal, run tests
node test-api.js

# 4. Make changes, nodemon restarts automatically
# 5. Test again to verify changes work
```

### Git Workflow (Recommended)

```bash
# Create feature branch
git checkout -b feature/pdf-export

# Make changes, test locally
npm run dev
node test-api.js

# Commit changes
git add .
git commit -m "Add PDF export functionality"

# Push and create pull request
git push origin feature/pdf-export
```

### Code Style

```javascript
// Naming conventions
- camelCase for variables/functions
- PascalCase for classes/constructors
- SCREAMING_SNAKE_CASE for constants
- Prefix private with underscore _private()

// Comments
// Single-line comments for code explanation
/* Multi-line for
   complex logic */

// Function documentation
/**
 * Calculates total assets
 * @param {Array} items - Asset items
 * @returns {Number} Total amount
 */
function calcTotal(items) { ... }
```

---

## Testing Strategy

### Unit Tests
```bash
npm install jest --save-dev
npm test
```

### Integration Tests
```javascript
// Test complete flow
const res = await fetch('/api/auth/register', { ... });
const res2 = await fetch('/api/auth/login', { ... });
const res3 = await fetch('/api/companies', { ... });
```

### End-to-End Tests
```bash
npm install cypress --save-dev
npx cypress open
```

---

## Deployment Checklist

- [ ] Tests passing
- [ ] Environment variables set
- [ ] Database configured
- [ ] HTTPS enabled
- [ ] Security headers added
- [ ] Logging configured
- [ ] Error monitoring setup
- [ ] Performance profiling done
- [ ] Documentation complete
- [ ] Backup strategy in place

---

## API Documentation

See `/src/routes/` for endpoint details.

Each route file contains:
- Endpoint path and method
- Authentication requirements
- Request parameters
- Response format
- Error handling

---

*Last updated: March 22, 2026*
