# 🚀 Deployment & Production Setup Guide

## Introduction

This guide covers deploying the UK Annual Accounts Filing System to production environments. Covers cloud platforms, Docker, security, and monitoring.

---

## Part 1: Pre-Deployment Checklist

### Security
- [ ] Change JWT_SECRET to a strong random value
- [ ] Remove all demo/test data
- [ ] Disable debug logging in production
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS settings
- [ ] Set up firewall rules

### Performance
- [ ] Test API response times
- [ ] Configure database connection pooling
- [ ] Enable response compression
- [ ] Set up caching headers
- [ ] Test with load testing

### Database
- [ ] Backup strategy in place
- [ ] Connection pooling configured
- [ ] Database password changed
- [ ] Indexes created
- [ ] Replication configured (if needed)

### Code
- [ ] All tests passing (npm test)
- [ ] No console.log in production code
- [ ] Error handling comprehensive
- [ ] Dependencies updated and audited
- [ ] Environment variables documented

---

## Part 2: Environment Variables Setup

### Create .env File

**File:** `.env` (in project root)

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=uk_accounts_db
DB_USER=postgres
DB_PASSWORD=your-very-secure-password-here
DB_POOL_MIN=2
DB_POOL_MAX=10

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=24h

# API Configuration
API_BASE_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/uk-accounts-api.log

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/uploads
```

### Generate Secure JWT Secret

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((Get-Random -Maximum 256 -Count 32))
```

---

## Part 3: Database Setup for Production

### PostgreSQL Installation

#### Windows
```bash
# Download from postgresql.org
# Run installer with:
# - Username: postgres
# - Password: [Your secure password]
# - Port: 5432 (default)
# - Locale: [Your locale]

# Verify installation
psql -U postgres --version
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
sudo -u postgres psql --version
```

#### macOS
```bash
# Using Homebrew
brew install postgresql

# Start service
brew services start postgresql

# Verify
postgres --version
```

### Run Database Setup Script

```bash
# Create database and tables
node setup-database.js

# Output should show:
# ✓ Database created
# ✓ Tables created
# ✓ Indexes created
# ✓ Ready for user registration (no demo users)
```

### Backup Database

```bash
# Full backup
pg_dump -U postgres uk_accounts_db > backup.sql

# Restore from backup
psql -U postgres uk_accounts_db < backup.sql

# Set up automated backups (Linux cron)
0 2 * * * pg_dump -U postgres uk_accounts_db | gzip > /backups/db-$(date +\%Y\%m\%d-\%H\%M).sql.gz
```

---

## Part 4: Deploy to Heroku

### Prerequisites
- Heroku CLI installed
- Heroku account created
- Git repository

### Deployment Steps

```bash
# 1. Create Heroku app
heroku create uk-accounts-app

# 2. Add PostgreSQL add-on
heroku addons:create heroku-postgresql:hobby-dev

# 3. Set environment variables
heroku config:set JWT_SECRET="your-generated-secret"
heroku config:set NODE_ENV=production

# 4. Deploy
git push heroku main

# 5. Run database setup
heroku run "node setup-database.js"

# 6. Check logs
heroku logs --tail
```

### Procfile Setup

**File:** `Procfile`

```
web: node src/server.js
```

### Database URL

Heroku automatically provides `DATABASE_URL`. Update database config:

```javascript
// src/database/config.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://...',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

---

## Part 5: Deploy to AWS

### Using Elastic Beanstalk

```bash
# 1. Install EB CLI
pip install awsebcli --upgrade --user

# 2. Initialize EB application
eb init -p node.js-16 uk-accounts-api

# 3. Create environment
eb create uk-accounts-prod --instance-type t3.micro

# 4. Configure environment variables in AWS Console
# Dashboard → Configuration → Software → Environment Properties

# 5. Deploy
git add .
git commit -m "Deploy to production"
eb deploy

# 6. Monitor
eb status
eb logs
```

### Using RDS for Database

```bash
# AWS Console:
# 1. Create RDS PostgreSQL instance
#    - Credentials: postgres / [secure password]
#    - Storage: 20 GB (configurable)
#    - Multi-AZ: Yes (for high availability)

# 2. Create security group allowing port 5432 from EB security group

# 3. Set Database URL in EB environment:
# DATABASE_URL=postgres://user:pass@rds-instance.amazonaws.com:5432/uk_accounts_db
```

### S3 for File Storage

```javascript
// Install AWS SDK
npm install aws-sdk

// src/utils/s3Upload.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function uploadFile(file, bucket) {
  const params = {
    Bucket: bucket,
    Key: file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  
  return s3.upload(params).promise();
}

module.exports = { uploadFile };
```

---

## Part 6: Deploy to DigitalOcean App Platform

```bash
# 1. Connect GitHub repository
# DigitalOcean Dashboard → Apps → Create App → GitHub

# 2. Configure app.yaml
# File: app.yaml

name: uk-accounts-api
services:
  - name: api
    github:
      repo: yourusername/uk-accounts-api
      branch: main
    build_command: npm install
    run_command: npm start
    envs:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        scope: RUN_AND_BUILD_TIME
        value: ${JWT_SECRET}
    http_port: 3000
    
databases:
  - name: postgres
    engine: PG
    version: "13"

# 3. Deploy through console or push to GitHub
# Auto-deploys on git push
```

---

## Part 7: Docker Deployment

### Create Dockerfile

**File:** `Dockerfile`

```dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "src/server.js"]
```

### Create docker-compose.yml

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: uk_accounts_db
      DB_USER: postgres
      DB_PASSWORD: postgres123
      JWT_SECRET: your-secret-key
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:13-alpine
    environment:
      POSTGRES_DB: uk_accounts_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Build and Run

```bash
# Build image
docker build -t uk-accounts-api:1.0 .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop containers
docker-compose down
```

---

## Part 8: HTTPS & SSL Configuration

### Using Certbot (Let's Encrypt)

```bash
# 1. Install Certbot
sudo apt install certbot python3-certbot-nginx

# 2. Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 3. Update Node config
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
};

https.createServer(options, app).listen(443);

# 4. Auto-renew (cron)
0 12 * * * certbot renew --quiet
```

### Using Nginx Reverse Proxy

**File:** `/etc/nginx/sites-available/default`

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Part 9: Monitoring & Logging

### Application Logging

**File:** `src/utils/logger.js`

```javascript
const fs = require('fs');
const path = require('path');

function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({
    timestamp,
    level,
    message,
    ...data
  });

  console.log(`[${timestamp}] ${level}: ${message}`);

  // Write to file in production
  if (process.env.NODE_ENV === 'production') {
    const logFile = process.env.LOG_FILE || '/var/log/uk-accounts-api.log';
    fs.appendFileSync(logFile, logEntry + '\n');
  }
}

module.exports = {
  info: (msg, data) => log('INFO', msg, data),
  error: (msg, data) => log('ERROR', msg, data),
  warn: (msg, data) => log('WARN', msg, data),
  debug: (msg, data) => log('DEBUG', msg, data)
};
```

### Use in Code

```javascript
const logger = require('./utils/logger');

app.get('/api/companies', async (req, res) => {
  try {
    logger.info('Fetching companies', { userId: req.user.id });
    const companies = await Company.all();
    res.json({ success: true, data: companies });
  } catch (error) {
    logger.error('Failed to fetch companies', { userId: req.user.id, error: error.message });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
```

### Monitoring Tools

#### PM2 (Process Manager)

```bash
# Install
npm install pm2 -g

# Start application
pm2 start src/server.js --name "uk-accounts-api"

# Monitor
pm2 monit

# View logs
pm2 logs uk-accounts-api

# Set auto-restart
pm2 startup
pm2 save
```

#### New Relic

```bash
# Install
npm install newrelic

# Create newrelic.js and update to include monitoring
# Monitor at: https://one.newrelic.com/
```

#### Datadog

```bash
# Install agent
npm install dd-trace

// At top of src/server.js
const tracer = require('dd-trace').init();

// Set tags
tracer.setUser({ id: userId, email: userEmail });
```

---

## Part 10: Performance Optimization

### Enable Compression

```javascript
const compression = require('compression');
app.use(compression());
```

### Caching Headers

```javascript
app.use((req, res, next) => {
  // Cache static files for 1 year
  if (req.url.match(/\.(js|css|png|jpg|gif)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  } else {
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
});
```

### Database Connection Pooling

```javascript
// src/database/config.js
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Load Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Load test
ab -n 1000 -c 100 http://localhost:3000/api/companies

# Results show:
# - Requests per second
# - Response time statistics
# - Connection performance
```

---

## Part 11: Scaling Strategies

### Horizontal Scaling (Multiple Instances)

```bash
# Using PM2 Cluster Mode
pm2 start src/server.js -i max --name "uk-accounts-api"

# Automatically uses all CPU cores
# PM2 handles load balancing
```

### Load Balancer (HAProxy)

**File:** `/etc/haproxy/haproxy.cfg`

```
global
    log stdout local0
    log stdout local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

    # Default SSL options
    tune.ssl.default-dh-param 2048

frontend http_in
    bind *:80
    redirect scheme https
    
frontend https_in
    bind *:443 ssl crt /path/to/cert.pem
    default_backend web_servers

backend web_servers
    balance roundrobin
    server server1 localhost:3001 check
    server server2 localhost:3002 check
    server server3 localhost:3003 check
```

### Redis Caching

```bash
# Install Redis
sudo apt install redis-server

npm install redis
```

```javascript
// src/middleware/cache.js
const redis = require('redis');
const client = redis.createClient();

async function cacheMiddleware(req, res, next) {
  const cacheKey = req.originalUrl;
  
  const cachedData = await client.get(cacheKey);
  if (cachedData) {
    return res.json(JSON.parse(cachedData));
  }
  
  // Store original json method
  const originalJson = res.json;
  
  // Override json method
  res.json = function(data) {
    client.setex(cacheKey, 3600, JSON.stringify(data)); // Cache for 1 hour
    return originalJson.call(this, data);
  };
  
  next();
}

module.exports = cacheMiddleware;
```

---

## Part 12: Backup & Disaster Recovery

### Automated Database Backups

```bash
# Create backup script
# /usr/local/bin/backup-db.sh

#!/bin/bash
BACKUP_DIR="/backups/uk-accounts"
DB_NAME="uk_accounts_db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create directory if needed
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_$TIMESTAMP.sql.gz"
```

### Setup Cron Job

```bash
# Run every hour
0 * * * * /usr/local/bin/backup-db.sh

# Run daily at 2 AM
0 2 * * * /usr/local/bin/backup-db.sh
```

### Restore from Backup

```bash
# List available backups
ls -lah /backups/uk-accounts/

# Restore from specific backup
gunzip < /backups/uk-accounts/db_20260322_020000.sql.gz | psql -U postgres uk_accounts_db

# Verify restoration
psql -U postgres -d uk_accounts_db -c "SELECT COUNT(*) FROM users;"
```

---

## Part 13: Security Hardening

### Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use(limiter);

// Stricter limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

app.post('/api/auth/login', authLimiter, authController.login);
app.post('/api/auth/register', authLimiter, authController.register);
```

### Input Validation

```bash
npm install joi
```

```javascript
const Joi = require('joi');

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().max(50),
  lastName: Joi.string().max(50)
});

app.post('/api/auth/register', (req, res) => {
  const { error, value } = userSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  // Process validated data
});
```

### CORS Configuration

```javascript
const cors = require('cors');

const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

---

## Part 14: Maintenance Tasks

### Weekly
- [ ] Review error logs
- [ ] Check server resource usage
- [ ] Verify backups are running
- [ ] Review API performance metrics

### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Security audit: `npm audit`
- [ ] Database optimization
- [ ] Review capacity planning

### Quarterly
- [ ] Major version updates
- [ ] Database migration testing
- [ ] Security penetration testing
- [ ] Disaster recovery drill

---

## Part 15: Troubleshooting Production Issues

### High CPU Usage
```bash
# Check process
top -p $(pgrep -f "node src/server.js")

# Check database connections
psql -U postgres -d uk_accounts_db -c "SELECT * FROM pg_stat_activity;"

# Increase pool timeout
```

### Database Connection Failures
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U postgres -h localhost -d uk_accounts_db

# Monitor connections
watch -n 1 'pg_stat_activity'
```

### Slow Queries
```bash
# Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log slow queries > 1 second
SELECT pg_reload_conf();

# Check query stats
SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC;
```

---

## Checklist: Pre-Launch

### Security ✓
- [ ] JWT_SECRET changed to strong random value
- [ ] Database passwords changed
- [ ] SSL/HTTPS configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation implemented

### Performance ✓
- [ ] Load tested (1000+ concurrent users)
- [ ] Compression enabled
- [ ] Caching configured
- [ ] Database indexes created
- [ ] Connection pooling configured

### Monitoring ✓
- [ ] Logging configured
- [ ] Monitoring tool installed
- [ ] Alerts configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active

### Operations ✓
- [ ] Backup strategy configured
- [ ] Disaster recovery plan tested
- [ ] Deployment process documented
- [ ] Runbooks created
- [ ] On-call rotation established

---

## Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PostgreSQL Administration](https://www.postgresql.org/docs/current/admin.html)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Security Checklist](https://owasp.org/www-project-deployment-best-practices/)

---

*Last updated: March 22, 2026*
