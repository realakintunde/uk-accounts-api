# UK Annual Accounts API

A comprehensive Node.js/Express backend API for managing UK company annual accounts filings, financial statements, and regulatory documents.

## Features

- Company registration and profile management
- Financial statement data management
- Document upload and storage
- Regulatory filing tracking
- User authentication and authorization
- RESTful API endpoints
- PostgreSQL database
- Input validation
- Error handling

## Project Structure

```
uk-accounts-api/
├── src/
│   ├── models/              # Database models and schemas
│   ├── routes/              # API route definitions
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Custom middleware
│   ├── database/            # Database configuration and migrations
│   ├── utils/               # Utility functions
│   └── server.js            # Main application entry point
├── tests/                   # Test files
├── .github/                 # GitHub workflow configurations
├── .vscode/                 # VS Code settings
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Project dependencies
├── README.md                # This file
└── LICENSE                  # MIT License
```

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd uk-accounts-api
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb uk_accounts_db

# Run migrations
npm run migrate
```

### 3. Environment Configuration

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your database credentials and other settings
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get company details
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Financial Statements
- `GET /api/statements` - List all statements
- `GET /api/statements/:id` - Get statement details
- `POST /api/statements` - Create new statement
- `PUT /api/statements/:id` - Update statement

### Documents
- `GET /api/documents` - List all documents
- `POST /api/documents` - Upload document
- `DELETE /api/documents/:id` - Delete document

### Filings
- `GET /api/filings` - List all filings
- `GET /api/filings/:id` - Get filing details
- `POST /api/filings` - Create new filing
- `PUT /api/filings/:id` - Update filing

## Testing

```bash
npm test
```

## Environment Variables

See `.env.example` for all available options:
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `PORT` - Server port
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT tokens

## Database Schema

The database includes tables for:
- `users` - User accounts and authentication
- `companies` - Company information
- `financial_statements` - Financial data
- `documents` - File storage and metadata
- `filings` - Regulatory filing records
- `audit_logs` - Activity tracking

## Development

### Code Style

ESLint configuration is included. Run:
```bash
npm run lint
```

### Database Migrations

To create a new migration:
```bash
npm run migrate
```

## Error Handling

The API uses standard HTTP status codes and returns errors in JSON format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## License

MIT

## Support

For issues and questions, please create an issue in the repository.
