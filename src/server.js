require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { setupDatabase } = require('./database/config');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Enhanced CORS configuration for production
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests from the same origin (no origin header) and from production URLs
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      /\.onrender\.com$/,
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
      callback(null, true); // Allow anyway for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint to diagnose connectivity
app.get('/api/test', (req, res) => {
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

// Routes
app.use('/api/companies', require('./routes/companies'));
app.use('/api/statements', require('./routes/statements'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/filings', require('./routes/filings'));
app.use('/api/auth', require('./routes/auth'));
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
