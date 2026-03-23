require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { setupDatabase } = require('./database/config');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter, loginLimiter, registerLimiter } = require('./middleware/rateLimiter');
const tokenController = require('./controllers/tokenController');

const app = express();

// Security headers with Helmet
app.use(helmet());

// Disable x-powered-by header
app.disable('x-powered-by');

// Enhanced CORS configuration for production
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests from the same origin (no origin header) and from production URLs
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      /\.onrender\.com$/,
      /\.linode\.com$/,
      /localhost/
    ];
    
    // If no origin (same-origin request), allow it
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(ao => {
      if (ao instanceof RegExp) return ao.test(origin);
      return origin === ao;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Request logging - to console for dev, to file for prod
if (process.env.NODE_ENV === 'production') {
  const logStream = fs.createWriteStream(path.join(__dirname, '../logs/access.log'), { flags: 'a' });
  app.use(morgan('combined', { stream: logStream }));
} else {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply API rate limiter to all /api routes
app.use('/api/', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    body: req.body,
    origin: req.get('origin')
  });
  next();
});

// Test endpoint to diagnose connectivity
app.get('/api/test', (req, res) => {
  console.log('[SERVER] Test endpoint called');
  res.json({ 
    success: true, 
    message: 'API is responding',
    timestamp: new Date().toISOString(),
    origin: req.get('origin')
  });
});

// Database initialization
setupDatabase();

// Serve landing page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/landing.html'));
});

// Serve static files from public directory
app.use(express.static('public'));

// Token refresh endpoint (before auth routes)
app.post('/api/auth/refresh', tokenController.refreshToken);

// Routes
app.use('/api/companies', require('./routes/companies'));
app.use('/api/statements', require('./routes/statements'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/filings', require('./routes/filings'));
app.use('/api/auth', loginLimiter, registerLimiter, require('./routes/auth'));
app.use('/api/export', require('./routes/export'));
app.use('/api/management', require('./routes/management'));
app.use('/api/financial', require('./routes/financial'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`UK Accounts API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS enabled for onrender.com and localhost domains`);
});

module.exports = app;
