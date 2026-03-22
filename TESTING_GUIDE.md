# 🧪 Testing & Quality Assurance Guide

## Introduction

Comprehensive testing ensures your UK Annual Accounts Filing System is reliable, secure, and performant. This guide covers unit testing, integration testing, end-to-end testing, and quality assurance.

---

## Part 1: Testing Strategy

### Testing Pyramid
```
        🎯 E2E Tests (10%)
      Integration Tests (20%)
   Unit Tests (70%)
```

### Test Types

| Type | Focus | Tools | Coverage |
|------|-------|-------|----------|
| Unit | Individual functions | Jest, Mocha | 70-80% |
| Integration | API endpoints | Supertest, Postman | 15-20% |
| E2E | Complete workflows | Cypress, Playwright | 5-10% |
| Performance | Load testing | Apache Bench, K6 | As needed |
| Security | Vulnerability scanning | npm audit, OWASP | As needed |

---

## Part 2: Setting Up Testing Framework

### Install Testing Dependencies

```bash
npm install --save-dev jest supertest

# For additional testing
npm install --save-dev @testing-library/node
npm install --save-dev nock  # for mocking HTTP requests
```

### Configure Jest

**File:** `jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js'
  ],
  testMatch: ['**/test/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  verbose: true,
  testTimeout: 10000
};
```

### Test Setup File

**File:** `test/setup.js`

```javascript
// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DB_HOST = 'localhost';

// Mock database for unit tests
beforeAll(() => {
  // Setup test database or mock
});

afterEach(() => {
  // Clean up after each test
});

afterAll(() => {
  // Close connections
});
```

### Update package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest test/integration",
    "test:e2e": "cypress run"
  }
}
```

---

## Part 3: Unit Testing

### Example: Test User Model

**File:** `test/models/User.test.js`

```javascript
const User = require('../../src/models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  describe('create()', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const user = await User.create(userData);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe(userData.password); // Should be hashed
    });

    it('should reject invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123'
      };

      await expect(User.create(userData)).rejects.toThrow('Invalid email');
    });

    it('should reject weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak'
      };

      await expect(User.create(userData)).rejects.toThrow('Password too weak');
    });
  });

  describe('findByEmail()', () => {
    it('should find user by email', async () => {
      await User.create({
        email: 'findme@example.com',
        password: 'SecurePassword123'
      });

      const user = await User.findByEmail('findme@example.com');

      expect(user).toBeDefined();
      expect(user.email).toBe('findme@example.com');
    });

    it('should return null for non-existent user', async () => {
      const user = await User.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('verifyPassword()', () => {
    it('should verify correct password', async () => {
      const password = 'CorrectPassword123';
      const user = await User.create({
        email: 'verify@example.com',
        password
      });

      const isValid = await User.verifyPassword(user, password);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await User.create({
        email: 'verify2@example.com',
        password: 'CorrectPassword123'
      });

      const isValid = await User.verifyPassword(user, 'WrongPassword');

      expect(isValid).toBe(false);
    });
  });
});
```

### Example: Test Utility Functions

**File:** `test/utils/calculations.test.js`

```javascript
const { calculateTax, calculateTotalAssets, calculateNetProfit } = require('../../src/utils/calculations');

describe('Financial Calculations', () => {
  describe('calculateTax()', () => {
    it('should calculate tax for small profit', () => {
      const result = calculateTax(30000);
      expect(result.tax).toBe(5700); // 30000 * 0.19
      expect(result.rate).toBe(0.19);
    });

    it('should calculate tax for large profit', () => {
      const result = calculateTax(300000);
      expect(result.tax).toBe(75000); // 300000 * 0.25
      expect(result.rate).toBe(0.25);
    });

    it('should handle zero profit', () => {
      const result = calculateTax(0);
      expect(result.tax).toBe(0);
    });

    it('should handle negative profit (loss)', () => {
      const result = calculateTax(-10000);
      expect(result.tax).toBeLessThanOrEqual(0);
    });
  });

  describe('calculateTotalAssets()', () => {
    it('should sum all assets', () => {
      const assets = {
        cash: 10000,
        debtors: 5000,
        inventory: 3000
      };

      const total = calculateTotalAssets(assets);

      expect(total).toBe(18000);
    });

    it('should handle missing properties', () => {
      const assets = {
        cash: 10000,
        debtors: null,
        inventory: undefined
      };

      const total = calculateTotalAssets(assets);

      expect(total).toBe(10000);
    });
  });

  describe('calculateNetProfit()', () => {
    it('should calculate net profit', () => {
      const financials = {
        revenue: 100000,
        costOfSales: 40000,
        operatingExpenses: 30000
      };

      const netProfit = calculateNetProfit(financials);

      expect(netProfit).toBe(30000);
    });
  });
});
```

---

## Part 4: Integration Tests

### Example: Test API Endpoints

**File:** `test/integration/auth.test.js`

```javascript
const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/models/User');

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePassword123',
          first_name: 'Jane',
          last_name: 'Smith'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await User.create({
        email: 'duplicate@example.com',
        password: 'SecurePassword123'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'SecurePassword123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'SecurePassword123'
        });

      expect(res.status).toBe(400);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        email: 'login@example.com',
        password: 'CorrectPassword123'
      });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'CorrectPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'profile@example.com',
          password: 'SecurePassword123'
        });

      token = res.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('profile@example.com');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile');

      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });
});
```

### Example: Test Company API

**File:** `test/integration/companies.test.js`

```javascript
const request = require('supertest');
const app = require('../../src/server');

let authToken;

describe('Companies API', () => {
  beforeAll(async () => {
    // Create test user and get token
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'companies@example.com',
        password: 'SecurePassword123'
      });

    authToken = res.body.data.token;
  });

  describe('POST /api/companies', () => {
    it('should create a company', async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Test Company Ltd',
          company_number: '12345678',
          business_address: '123 Test Street, London'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.company_number).toBe('12345678');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Incomplete Company'
          // Missing company_number
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/companies', () => {
    it('should list user companies', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/companies/:id', () => {
    let companyId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Details Company',
          company_number: '87654321'
        });

      companyId = res.body.data.id;
    });

    it('should get company details', async () => {
      const res = await request(app)
        .get(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.company_name).toBe('Details Company');
    });
  });

  describe('PUT /api/companies/:id', () => {
    let companyId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Update Company',
          company_number: '11111111'
        });

      companyId = res.body.data.id;
    });

    it('should update company', async () => {
      const res = await request(app)
        .put(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Updated Company Name'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.company_name).toBe('Updated Company Name');
    });
  });

  describe('DELETE /api/companies/:id', () => {
    let companyId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Delete Company',
          company_number: '99999999'
        });

      companyId = res.body.data.id;
    });

    it('should delete company', async () => {
      const res = await request(app)
        .delete(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });
});
```

---

## Part 5: End-to-End Testing

### Install Cypress

```bash
npm install --save-dev cypress

# Open Cypress
npx cypress open
```

### Example: E2E Test

**File:** `cypress/e2e/filing-workflow.cy.js`

```javascript
describe('Complete Filing Workflow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should register, create company, and file accounts', () => {
    // Step 1: Register
    cy.contains('Register').click();
    cy.get('[placeholder="Email"]').type('e2etest@example.com');
    cy.get('[placeholder="Password"]').type('SecurePassword123');
    cy.contains('button', 'Register').click();
    
    // Verify logged in
    cy.contains('Dashboard').should('be.visible');

    // Step 2: Create Company
    cy.contains('Companies').click();
    cy.contains('button', 'Add Company').click();
    cy.get('[placeholder="Company Name"]').type('E2E Company Ltd');
    cy.get('[placeholder="Company Number"]').type('12345678');
    cy.contains('button', 'Create Company').click();

    cy.contains('E2E Company Ltd').should('be.visible');

    // Step 3: Add Company Details
    cy.contains('Company Details').click();
    cy.get('[placeholder="Business Address"]').type('123 Test Road, London EC1V 9AB');
    cy.get('[placeholder="Email"]').type('info@e2e.com');
    cy.get('[placeholder="Phone"]').type('020 1234 5678');
    cy.contains('button', 'Save').click();

    cy.contains('Company details saved').should('be.visible');

    // Step 4: Add Financial Data - Balance Sheet
    cy.contains('Balance Sheet').click();
    
    // Add assets
    cy.get('[id*="cash"]').type('50000');
    cy.get('[id*="debtors"]').type('30000');
    cy.get('[id*="inventory"]').type('20000');
    
    // Add liabilities
    cy.get('[id*="creditors"]').type('15000');
    cy.get('[id*="bank-loans"]').type('25000');

    cy.contains('button', 'Save Balance Sheet').click();
    cy.contains('Balance sheet saved').should('be.visible');

    // Step 5: Add P&L Data
    cy.contains("P&L Account").click();
    cy.get('[id*="revenue"]').type('200000');
    cy.get('[id*="cogs"]').type('80000');
    cy.get('[id*="operating-expenses"]').type('50000');

    cy.contains('button', 'Save P&L').click();
    cy.contains('P&L saved').should('be.visible');

    // Step 6: Review & Submit
    cy.contains('Review & Submit').click();
    
    // Verify summary
    cy.contains('Filing Summary').should('be.visible');
    cy.contains('E2E Company Ltd').should('be.visible');
    cy.contains('£200,000').should('be.visible'); // Revenue

    // Submit filing
    cy.contains('button', 'Submit to Companies House').click();
    cy.contains('Filing submitted successfully').should('be.visible');

    // Step 7: Verify filing reference
    cy.contains('Filing Ref:').should('be.visible');
  });

  it('should export filing as PDF', () => {
    // Setup: Register and create filing
    cy.contains('Register').click();
    cy.get('[placeholder="Email"]').type('pdftest@example.com');
    cy.get('[placeholder="Password"]').type('SecurePassword123');
    cy.contains('button', 'Register').click();

    // Navigate to export
    cy.contains('Export').click();
    
    // Verify export options
    cy.contains('📄 PDF Report').should('be.visible');
    cy.contains('JSON Export').should('be.visible');
    cy.contains('CSV Export').should('be.visible');

    // Download PDF
    cy.contains('button', 'PDF Report').click();
    
    // Verify file was downloaded
    cy.readFile('cypress/downloads').then(files => {
      expect(files).to.include.something.that.matches(/\.pdf$/);
    });
  });
});
```

---

## Part 6: API Testing with Postman

### Create Postman Collection

**File:** `postman_collection.json`

```json
{
  "info": {
    "name": "UK Accounts API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"test@example.com\",\"password\":\"SecurePassword123\"}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"test@example.com\",\"password\":\"SecurePassword123\"}"
            }
          }
        }
      ]
    },
    {
      "name": "Companies",
      "item": [
        {
          "name": "Create Company",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/companies",
            "header": {
              "Authorization": "Bearer {{token}}"
            },
            "body": {
              "mode": "raw",
              "raw": "{\"company_name\":\"Test Ltd\",\"company_number\":\"12345678\"}"
            }
          }
        },
        {
          "name": "Get Companies",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/companies",
            "header": {
              "Authorization": "Bearer {{token}}"
            }
          }
        }
      ]
    }
  ]
}
```

---

## Part 7: Performance Testing

### Load Testing with Apache Bench

```bash
# Test concurrent users
ab -n 1000 -c 100 http://localhost:3000/api/companies

# Results interpretation:
# Requests per second: Higher is better
# Time per request: Lower is better
# Failed requests: Should be 0
```

### Load Testing with K6

**File:** `k6-load-test.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['<0.1'],
  },
};

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

export default function () {
  // Login
  if (!authToken) {
    const res = http.post(`${BASE_URL}/auth/login`, {
      email: 'loadtest@example.com',
      password: 'SecurePassword123'
    });

    authToken = res.json('data.token');
  }

  // Get companies
  const getRes = http.get(`${BASE_URL}/companies`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  check(getRes, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### Run Load Test

```bash
k6 run k6-load-test.js
```

---

## Part 8: Code Quality

### ESLint Configuration

```bash
npm install --save-dev eslint eslint-config-airbnb-base eslint-plugin-import
```

**File:** `.eslintrc.json`

```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": ["airbnb-base"],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": "warn",
    "no-shadow": "warn"
  }
}
```

### Run ESLint

```bash
npx eslint src/
npx eslint src/ --fix  # Auto-fix issues
```

### Code Coverage

```bash
npm run test:coverage

# Output shows coverage percentage for:
# - Lines
# - Functions
# - Branches
# - Statements
```

---

## Part 9: Security Testing

### OWASP Dependency Check

```bash
npm audit

# Fix vulnerabilities
npm audit fix
```

### SQL Injection Testing

Test that queries use parameterized statements:

```javascript
// ✓ GOOD - Parameterized query
db.query('SELECT * FROM users WHERE email = $1', [email]);

// ✗ BAD - String concatenation
db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### Authentication Testing

```javascript
it('should not allow unauthenticated access', async () => {
  const res = await request(app)
    .get('/api/companies')
    // No Authorization header
    
  expect(res.status).toBe(401);
});

it('should not allow access with invalid token', async () => {
  const res = await request(app)
    .get('/api/companies')
    .set('Authorization', 'Bearer invalid-token')
    
  expect(res.status).toBe(401);
});
```

---

## Part 10: Test Execution pipeline

### Run All Tests

```bash
# Unit tests
npm test

# Coverage report
npm run test:coverage

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Code quality
npx eslint src/

# Security audit
npm audit

# Load testing
k6 run k6-load-test.js
```

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run lint
        run: npx eslint src/
      
      - name: Run tests
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Part 11: CI/CD Integration

### Pre-commit Hooks

```bash
npm install --save-dev husky lint-staged

npx husky install
```

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**File:** `package.json`

```json
{
  "lint-staged": {
    "src/**/*.js": "eslint --fix",
    "*.{js,json,md}": "prettier --write"
  }
}
```

---

## Part 12: Test Reporting

### Coverage Report

```bash
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Test Results Output

```bash
PASS  test/models/User.test.js
  User Model
    create()
      ✓ should create a new user with hashed password (45ms)
      ✓ should reject invalid email (15ms)
      ✓ should reject weak password (10ms)
    findByEmail()
      ✓ should find user by email (25ms)
      ✓ should return null for non-existent user (5ms)

Test Suites: 5 passed, 5 total
Tests:       47 passed, 47 total
Snapshots:   0 total
Time:        8.342s
```

---

## Part 13: Quality Metrics

### Target Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Code Coverage | 80%+ | Most code executed in tests |
| Critical Coverage | 100% | Auth, security features fully tested |
| Test Pass Rate | 100% | All tests must pass before merge |
| Performance | <500ms | 95th percentile response time |
| Error Rate | <0.1% | Acceptable for production |

### Calculate Coverage

```bash
npm run test:coverage

# View results
Code coverage summary:
├─ Lines       : 85.2%
├─ Statements  : 84.8%
├─ Functions   : 82.1%
└─ Branches    : 79.5%
```

---

## Part 14: Debugging Tests

### Debug Failed Test

```bash
# Run specific test file
npm test -- User.test.js

# Run single test
npm test -- --testNamePattern="should create a new user"

# Watch mode
npm run test:watch

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Test Issues

**Issue: Database connections failing**
- Ensure test database exists
- Check environment variables in test/setup.js

**Issue: Async timeout**
- Increase timeout: `jest.setTimeout(10000)`
- Fix async/await handling

**Issue: Tests interfering with each other**
- Add beforeEach/afterEach cleanup
- Use unique test data

---

## Testing Checklist

### Before Deployment
- [ ] All unit tests passing (npm test)
- [ ] Coverage ≥ 80%
- [ ] All integration tests passing
- [ ] E2E workflow tests passing
- [ ] No ESLint errors
- [ ] npm audit shows 0 vulnerabilities
- [ ] Load test completed successfully
- [ ] Code review approved

### Continuous Monitoring
- [ ] Tests run on every commit
- [ ] Failed builds block merges
- [ ] Coverage reports tracked
- [ ] Performance metrics monitored
- [ ] Security scans automated

---

## Resources

- [Jest Testing Framework](https://jestjs.io/)
- [Supertest API Testing](https://github.com/visionmedia/supertest)
- [Cypress E2E Testing](https://cypress.io/)
- [K6 Load Testing](https://k6.io/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

*Last updated: March 22, 2026*
