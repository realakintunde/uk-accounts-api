# ⚡ Quick Reference Guide

Fast lookup for common tasks, commands, and configurations.

---

## Starting the System

### Development Mode
```bash
cd C:\Users\reala\uk-accounts-api
npm run dev
# Server runs on http://localhost:3000
```

### Test Mode
```bash
npm test
# Runs all unit tests
```

---

## Authentication

### Create New Account via API
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires token)

### Companies
- `POST /api/companies` - Create company
- `GET /api/companies` - List user's companies
- `GET /api/companies/:id` - Get company details
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Financial Statements
- `POST /api/statements` - Create statement
- `GET /api/statements/:company_id` - List statements
- `PUT /api/statements/:id` - Update statement

### Export
- `GET /api/export/filing/:id/pdf` - Export as PDF
- `GET /api/export/filing/:id/json` - Export as JSON
- `GET /api/export/filing/:id/csv` - Export as CSV
- `GET /api/export/filing/:id/text` - Export as text

### Filing
- `POST /api/filings` - Submit filing
- `GET /api/filings` - List filings

---

## Database Commands

### Connect to PostgreSQL
```bash
psql -U postgres -d uk_accounts_db
```

### Common Queries
```sql
-- List all users
SELECT * FROM users;

-- List user's companies
SELECT * FROM companies WHERE user_id = 1;

-- Check financial statements
SELECT * FROM financial_statements WHERE company_id = 1;

-- View filings
SELECT * FROM filings WHERE company_id = 1;
```

### Backup Database
```bash
pg_dump -U postgres uk_accounts_db > backup.sql
```

### Restore Database
```bash
psql -U postgres uk_accounts_db < backup.sql
```

---

## File Structure

```
project/
├── src/
│   ├── server.js              # Main app entry
│   ├── models/                # Data models
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── FinancialStatement.js
│   │   ├── Filing.js
│   │   └── Document.js
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   └── companiesController.js
│   ├── routes/                # API routes
│   │   ├── auth.js
│   │   ├── companies.js
│   │   ├── statements.js
│   │   ├── filings.js
│   │   └── export.js
│   ├── middleware/            # Express middleware
│   │   └── auth.js
│   ├── utils/                 # Utilities
│   │   ├── pdfGenerator.js
│   │   └── calculations.js
│   └── database/              # Database config
│       ├── config.js
│       └── migrations.js
├── public/
│   └── index.html             # Frontend app
├── test/                      # Tests
│   ├── models/
│   ├── integration/
│   └── setup.js
├── .env                       # Secrets (not in git)
├── .gitignore
├── package.json
├── jest.config.js
├── setup-database.js          # DB initialization
└── README.md
```

---

## Environment Variables

```
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=uk_accounts_db
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

---

## Common Tasks

### Add New API Endpoint

1. **Create model** (src/models/MyModel.js)
2. **Create controller** (src/controllers/myController.js)
3. **Create route** (src/routes/my.js)
4. **Register in server.js**: `app.use('/api/my', require('./routes/my'));`
5. **Test**: `npm test` or `curl http://localhost:3000/api/my`

### Add Frontend Page

1. **Add HTML section** to `public/index.html`
2. **Add CSS** to style section
3. **Add JavaScript** functions to handle logic
4. **Update sidebar** navigation
5. **Test** in browser (F12 DevTools)

### Add Database Field

1. **Update model** to include field
2. **Create migration** file in database/
3. **Run migration**: `psql -U postgres < migration-file.sql`
4. **Test**: `npm test`

---

## Debugging Tips

### Server Issues
```bash
# Check if port is in use
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows PowerShell

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### Database Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # Mac

# Check connections
psql -U postgres -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
```

### Frontend Issues
```bash
# Open browser console (F12)
# Check Network tab for API calls
# Look for error messages in console

# Clear cache
# Chrome: DevTools → Application → Clear storage
```

### API Testing
```bash
# Test endpoint with curl
curl -X GET http://localhost:3000/api/companies \
  -H "Authorization: Bearer YOUR_TOKEN"

# Pretty-print JSON response
curl ... | jq

# Verbose output
curl -v ...
```

---

## Performance Benchmarks

### Expected Performance
- API Response time: < 100ms (average)
- Database queries: < 50ms
- PDF generation: < 2 seconds
- Page load: < 1 second

### Test Performance
```bash
# Load test
npm install -g Apache Bench
ab -n 1000 -c 100 http://localhost:3000/api/companies

# Expected results for 1000 requests, 100 concurrent:
# Requests per second: > 100
# Time per request: < 100ms
```

---

## Security Checklist

### Before Going Live
- [ ] Change JWT_SECRET to random value
  ```bash
  openssl rand -base64 32
  ```
- [ ] Change PostgreSQL password
- [ ] Enable HTTPS via nginx/Apache
- [ ] Set CORS_ORIGIN to your domain only
- [ ] Disable debug logging
- [ ] Run `npm audit` and fix issues
- [ ] Review sensitive code for leaks

### Regular Maintenance
- [ ] Review logs daily
- [ ] Update dependencies: `npm update`
- [ ] Run security audit: `npm audit`
- [ ] Backup database daily
- [ ] Check server resources

---

## Useful npm Scripts

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix",
  "audit": "npm audit",
  "audit:fix": "npm audit fix"
}
```

---

## Frontend API Helper

Use in browser console or frontend code:

```javascript
// Authentication
const TOKEN = localStorage.getItem('token');

// API Call
async function apiCall(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  };
  
  if (data) options.body = JSON.stringify(data);
  
  const response = await fetch(`/api${endpoint}`, options);
  return response.json();
}

// Usage
apiCall('GET', '/companies')
  .then(res => console.log(res.data))
  .catch(err => console.error(err));
```

---

## Status Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Request worked |
| 201 | Created | Resource created |
| 400 | Bad Request | Check input validation |
| 401 | Unauthorized | Login required or invalid token |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Check server logs |

---

## Common Error Messages

### "Cannot POST /api/users"
- Wrong endpoint name
- Check spelling in route
- Make sure route is registered in server.js

### "Unauthorized" (401)
- Missing Authorization header
- Invalid/expired JWT token
- Token not included with request

### "Cannot find module"
- Missing npm dependency
- Run: `npm install package-name`
- Check spelling in require()

### "Connection refused (database)"
- PostgreSQL not running
- Wrong DB credentials
- Check .env file

### "Port 3000 is already in use"
- Process already running on port
- Find and kill: `lsof -i :3000`
- Or change PORT in .env

---

## Keyboard Shortcuts

### VS Code
- F1 - Command palette
- Ctrl+F - Find
- Ctrl+H - Find & Replace
- Ctrl+` - Toggle terminal
- Ctrl+B - Toggle sidebar
- F5 - Start debugging

### Browser DevTools
- F12 - Open DevTools
- Ctrl+Shift+I - Open DevTools
- Ctrl+Shift+K - Console tab
- Ctrl+Shift+E - Network tab
- Ctrl+Shift+C - Inspect element

---

## Getting Help

### Documentation Files
- **COMPLETE_GUIDE.md** - Getting started
- **USER_GUIDE.md** - How to file accounts
- **ARCHITECTURE.md** - System design
- **DEVELOPER_GUIDE.md** - How to extend
- **DEPLOYMENT_GUIDE.md** - How to deploy
- **TESTING_GUIDE.md** - How to test
- **ENHANCEMENT_ROADMAP.md** - Future features

### Online Resources
- [Express.js Docs](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Node.js Docs](https://nodejs.org/docs/)
- [MDN Web Docs](https://developer.mozilla.org/)

### API Documentation
```bash
# Generate API docs
npm install apidoc -g
apidoc -i src/routes -o docs/

# View at: file://docs/index.html
```

---

## Cheat Sheet Commands

### Quick Restart
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Check Logs
```bash
npm run dev > logs.txt 2>&1
tail -f logs.txt
```

### Database Status
```bash
psql -U postgres -d uk_accounts_db -c "SELECT VERSION();"
```

### Backup Everything
```bash
pg_dump -U postgres uk_accounts_db > backup-$(date +%Y%m%d).sql
```

### Reset Database
```bash
dropdb -U postgres uk_accounts_db
node setup-database.js
```

---

## Quick Deployment

### To Production
```bash
# 1. Push to git
git add .
git commit -m "Deployment"
git push origin main

# 2. On production server
git pull origin main
npm install
node setup-database.js
npm run start
```

### Using PM2
```bash
pm2 start src/server.js --name "uk-accounts"
pm2 save
pm2 startup
```

---

*Last updated: March 22, 2026*
