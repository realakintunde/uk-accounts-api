// REFERENCE: src/server.js - Complete secure version
// Use this as a reference for updating your server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Import middleware
const { apiLimiter, loginLimiter, registerLimiter } = require('./middleware/rateLimiter');
const { authenticateToken } = require('./middleware/auth');

// Import controllers
const authCtrl = require('./controllers/authController');
const tokenCtrl = require('./controllers/tokenController');
const companiesCtrl = require('./controllers/companiesController');
const documentsCtrl = require('./controllers/documentsController');
const managementCtrl = require('./controllers/managementController');
const financialCtrl = require('./controllers/financialController');

const app = express();
const PORT = process.env.PORT || 3000;

//═══════════════════════════════════════════════════════════════════════════
// SECURITY: Helmet - Security Headers
//═══════════════════════════════════════════════════════════════════════════
app.use(helmet());
app.disable('x-powered-by'); // Remove Express signature

//═══════════════════════════════════════════════════════════════════════════
// SECURITY: CORS - Cross-Origin Resource Sharing
//═══════════════════════════════════════════════════════════════════════════
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(o => o.trim());
console.log('[CORS] Allowed origins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
}));

//═══════════════════════════════════════════════════════════════════════════
// SECURITY: Logging - Morgan
//═══════════════════════════════════════════════════════════════════════════
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

// Log all requests to file
app.use(morgan('combined', { stream: accessLogStream }));
// Log to console in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

//═══════════════════════════════════════════════════════════════════════════
// Body Parser
//═══════════════════════════════════════════════════════════════════════════
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

//═══════════════════════════════════════════════════════════════════════════
// SECURITY: Rate Limiting
//═══════════════════════════════════════════════════════════════════════════
// Apply general rate limit to all /api routes
app.use('/api/', apiLimiter);

// Stricter limits for auth endpoints
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);

//═══════════════════════════════════════════════════════════════════════════
// Health Check
//═══════════════════════════════════════════════════════════════════════════
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

//═══════════════════════════════════════════════════════════════════════════
// API Routes
//═══════════════════════════════════════════════════════════════════════════

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('[API] POST /api/auth/register', {
      email: req.body.email,
      origin: req.get('origin')
    });
    await authCtrl.register(req, res);
  } catch (e) {
    console.error('[API] Error in register:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('[API] POST /api/auth/login', { email: req.body.email });
    await authCtrl.login(req, res);
  } catch (e) {
    console.error('[API] Error in login:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/refresh', tokenCtrl.refreshToken);

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    await authCtrl.updateProfile(req, res);
  } catch (e) {
    console.error('[API] Error in updateProfile:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Companies endpoints
app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    await companiesCtrl.getCompanies(req, res);
  } catch (e) {
    console.error('[API] Error in getCompanies:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/companies', authenticateToken, async (req, res) => {
  try {
    await companiesCtrl.createCompany(req, res);
  } catch (e) {
    console.error('[API] Error in createCompany:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    await companiesCtrl.getCompanyById(req, res);
  } catch (e) {
    console.error('[API] Error in getCompanyById:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    await companiesCtrl.updateCompany(req, res);
  } catch (e) {
    console.error('[API] Error in updateCompany:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    await companiesCtrl.deleteCompany(req, res);
  } catch (e) {
    console.error('[API] Error in deleteCompany:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Documents endpoints (all protected)
app.get('/api/documents/:companyId', authenticateToken, async (req, res) => {
  try {
    await documentsCtrl.getDocuments(req, res);
  } catch (e) {
    console.error('[API] Error in getDocuments:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/documents', authenticateToken, async (req, res) => {
  try {
    await documentsCtrl.createDocument(req, res);
  } catch (e) {
    console.error('[API] Error in createDocument:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Management endpoints (all protected)
app.get('/api/members/:companyId', authenticateToken, async (req, res) => {
  try {
    await managementCtrl.getMembers(req, res);
  } catch (e) {
    console.error('[API] Error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/members', authenticateToken, async (req, res) => {
  try {
    await managementCtrl.addMember(req, res);
  } catch (e) {
    console.error('[API] Error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Financial endpoints (all protected)
app.get('/api/budgets/:companyId', authenticateToken, async (req, res) => {
  try {
    await financialCtrl.getBudget(req, res);
  } catch (e) {
    console.error('[API] Error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/budgets', authenticateToken, async (req, res) => {
  try {
    await financialCtrl.createBudget(req, res);
  } catch (e) {
    console.error('[API] Error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Static files
app.use(express.static('public'));

// SPA fallback - serve index.html for all unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

//═══════════════════════════════════════════════════════════════════════════
// Error Handling
//═══════════════════════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

//═══════════════════════════════════════════════════════════════════════════
// Start Server
//═══════════════════════════════════════════════════════════════════════════
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         UK Annual Accounts API - SECURE MODE              ║
╠═══════════════════════════════════════════════════════════╣
║ Environment: ${(process.env.NODE_ENV || 'development').padEnd(44)} ║
║ Port:        ${PORT.toString().padEnd(45)} ║
║ Security:    Helmet + CORS + Rate Limit + Auth ✓         ║
╠═══════════════════════════════════════════════════════════╣
║ Health:      http://localhost:${PORT}/health                  ║
║ API Base:    http://localhost:${PORT}/api                     ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[SERVER] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('[SERVER] Server closed');
    process.exit(0);
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
