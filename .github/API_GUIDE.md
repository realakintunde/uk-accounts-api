### Installation & Setup

#### Prerequisites
- Node.js v16+ 
- PostgreSQL v12+

#### Steps
1. Install dependencies: `npm install`
2. Configure `.env` file with database credentials
3. Run migrations: `npm run migrate`
4. Start the server: `npm run dev`

### API Endpoints Reference

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires token)

#### Companies
- `GET /api/companies` - List all companies
- `POST /api/companies` - Create company (requires auth)
- `GET /api/companies/:id` - Get company details
- `PUT /api/companies/:id` - Update company (requires auth)
- `DELETE /api/companies/:id` - Delete company (requires auth)
- `GET /api/companies/:id/statements` - Get company's financial statements

#### Financial Statements
- `GET /api/statements?companyId=X` - List statements
- `POST /api/statements` - Create statement (requires auth)
- `GET /api/statements/:id` - Get statement details
- `PUT /api/statements/:id` - Update statement (requires auth)
- `DELETE /api/statements/:id` - Delete statement (requires auth)

#### Documents
- `GET /api/documents?companyId=X` - List documents
- `POST /api/documents` - Upload document (requires auth)
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document (requires auth)

#### Filings
- `GET /api/filings?companyId=X` - List filings
- `POST /api/filings` - Create filing (requires auth)
- `GET /api/filings/:id` - Get filing details
- `PUT /api/filings/:id` - Update filing (requires auth)
- `DELETE /api/filings/:id` - Delete filing (requires auth)

### Authentication

To use protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Development

- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests
- `npm run migrate` - Run database migrations
