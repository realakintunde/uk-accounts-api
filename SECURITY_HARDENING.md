# Security Hardening Guide - UK Accounts API

Complete security setup for self-hosted deployment on Linode VPS.

---

## 1. Network Security (Firewall)

### Block all ports except 22, 80, 443

```bash
# SSH into your Linode VPS
ssh root@YOUR_IP

# Install UFW (firewall)
apt-get update
apt-get install -y ufw

# Default deny all incoming
ufw default deny incoming
ufw default allow outgoing

# Allow only SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Verify rules
ufw status
```

---

## 2. Database Security

### Use parameterized queries (Already correct in code)

Your codebase uses parameterized queries via `pg` library - this prevents SQL injection.

✅ Example from your code:
```javascript
const result = await client.query(
  'SELECT * FROM users WHERE email = $1',
  [email]  // Parameters are separated from query
);
```

### Password hashing

Your code already uses bcrypt - verify in `src/controllers/authController.js`:

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

✅ This is secure (10 salt rounds = good balance of security/speed).

### Database credentials

Create `.env` file on server (NEVER commit to git):

```bash
# On your Linode server
ssh root@YOUR_IP
cd /opt/uk-accounts-api

# Create .env
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_URL=postgresql://uk_user:YOUR_STRONG_PASSWORD@localhost:5432/uk_accounts
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uk_accounts
DB_USER=uk_user
DB_PASSWORD=YOUR_STRONG_PASSWORD
EOF

# Secure permissions (only root and owner can read)
chmod 600 .env
```

### Create PostgreSQL user with limited permissions

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create limited user (NOT root)
CREATE USER uk_user WITH PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE uk_accounts OWNER uk_user;
GRANT CONNECT ON DATABASE uk_accounts TO uk_user;
GRANT USAGE ON SCHEMA public TO uk_user;
GRANT CREATE ON SCHEMA public TO uk_user;

# Exit psql
\q
```

---

## 3. SSL/HTTPS (Let's Encrypt)

### Install Certbot

```bash
apt-get install -y certbot python3-certbot-nginx
```

### Create Nginx Config (see section below)

Then request certificate:

```bash
certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

This creates:
- `/etc/letsencrypt/live/yourdomain.com/fullchain.pem` (certificate)
- `/etc/letsencrypt/live/yourdomain.com/privkey.pem` (private key)

### Auto-renew certificates

```bash
# Check if timer exists
systemctl list-timers | grep certbot

# If not, enable
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## 4. API Authentication Hardening

### Current JWT implementation review

✅ Your code already has:
- JWT token generation
- Bearer token validation
- Protected routes with `authenticateToken` middleware

### Improvements needed:

#### A. Add Token Expiry (Add to src/controllers/authController.js)

```javascript
// In register/login endpoints:
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }  // ADD THIS - token expires after 1 hour
);
```

#### B. Add Refresh Token System (Create src/controllers/tokenController.js)

```javascript
const jwt = require('jsonwebtoken');

async function refreshToken(req, res) {
  const refreshToken = req.body.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }
  
  try {
    // Verify refresh token (use different secret for extra security)
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );
    
    // Issue new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    return res.json({ 
      data: { 
        token: newAccessToken 
      } 
    });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

module.exports = { refreshToken };
```

#### C. Add to routes (src/routes/auth.js)

```javascript
const tokenCtrl = require('../controllers/tokenController');
router.post('/auth/refresh', tokenCtrl.refreshToken);
```

#### D. Update .env with refresh secret

```bash
JWT_SECRET=<your-main-secret>
JWT_REFRESH_SECRET=<different-secret>
```

---

## 5. Rate Limiting & Brute Force Protection

### Install rate-limiter

```bash
npm install express-rate-limit
```

### Add to src/server.js

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limit: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limit for login: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Strict limit for registration: 3 per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many accounts created from this IP, try again later'
});

// Apply to app
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
```

### Install fail2ban (on VPS)

```bash
apt-get install -y fail2ban

# Create jail config
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
EOF

# Restart fail2ban
systemctl restart fail2ban
systemctl enable fail2ban
```

---

## 6. Data at Rest (Database Encryption)

### For PostgreSQL on VPS

#### Option A: Use LUKS disk encryption (during VPS setup)
- Linode doesn't offer built-in disk encryption
- You can enable after setup but requires downtime

#### Option B: Application-level encryption

Create `src/utils/encryption.js`:

```javascript
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
```

Use for sensitive data:
```javascript
const { encrypt, decrypt } = require('../utils/encryption');

// When saving
const encryptedData = encrypt(sensitiveField);

// When reading
const decryptedData = decrypt(encryptedField);
```

---

## 7. Input Validation & Sanitization

### Install validator

```bash
npm install validator
```

### Add to src/middleware/validation.js

```javascript
const validator = require('validator');

function validateEmail(email) {
  if (!validator.isEmail(email)) {
    throw new Error('Invalid email format');
  }
  return email.toLowerCase();
}

function validatePassword(password) {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain number');
  }
  return password;
}

function sanitizeString(str) {
  return validator.trim(validator.escape(str));
}

module.exports = { validateEmail, validatePassword, sanitizeString };
```

Use in controllers:
```javascript
const { validateEmail, validatePassword } = require('../middleware/validation');

async function register(req, res) {
  try {
    const email = validateEmail(req.body.email);
    const password = validatePassword(req.body.password);
    // ... rest of logic
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
```

---

## 8. CORS Security

### Update src/server.js

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};

app.use(cors(corsOptions));

// Disable X-Powered-By header
app.disable('x-powered-by');
```

Add to .env:
```
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 9. Security Headers with Helmet

### Install helmet

```bash
npm install helmet
```

### Add to src/server.js

```javascript
const helmet = require('helmet');

// Apply helmet for security headers
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https:"]
  }
}));
```

---

## 10. Nginx Reverse Proxy Configuration

### Create /etc/nginx/sites-available/uk-accounts

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
    
    location ~* ^/api/auth/login {
        limit_req zone=login_limit burst=2 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
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

Enable:
```bash
ln -s /etc/nginx/sites-available/uk-accounts /etc/nginx/sites-enabled/
nginx -t  # Test config
systemctl restart nginx
```

---

## 11. Logging & Monitoring

### Enable request logging

Add to src/server.js:

```javascript
const morgan = require('morgan');
const fs = require('fs');

// Create logs directory
const logDir = './logs';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Log to file
const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

app.use(morgan('combined', { stream: accessLogStream }));
```

### Monitor logs

```bash
# SSH to server
ssh root@YOUR_IP

# Watch logs in real-time
tail -f /opt/uk-accounts-api/logs/access.log

# Look for suspicious activity
grep "401\|403\|400" /opt/uk-accounts-api/logs/access.log
```

---

## 12. Deployment Checklist

Before going live:

- [ ] Firewall rules configured (22, 80, 443 only)
- [ ] PostgreSQL user created with limited permissions
- [ ] .env file created with strong secrets (NOT in git)
- [ ] SSL certificate from Let's Encrypt installed
- [ ] Nginx configured with security headers
- [ ] rate-limit middleware installed
- [ ] fail2ban configured
- [ ] input validation implemented
- [ ] helmet.js installed and configured
- [ ] JWT token expiry set (1 hour)
- [ ] PostgreSQL backups scheduled
- [ ] Log rotation configured
- [ ] Domain DNS points to Linode IP
- [ ] Test login/register works over HTTPS
- [ ] Test rate limiting (try 10 logins quickly)

---

## 13. Ongoing Maintenance

### Daily/Weekly

```bash
# Check fail2ban status
fail2ban-client status

# Monitor disk space
df -h

# Check running processes
ps aux | grep node
```

### Monthly

```bash
# Update packages
apt-get update && apt-get upgrade -y

# Renew SSL certs (automatic, but verify)
certbot renew --dry-run

# Review logs for suspicious activity
grep "WARN\|ERROR" /var/log/syslog
```

### Quarterly

- Review PostgreSQL credentials
- Rotate JWT_SECRET (requires client logout)
- Backup database

---

## Security Summary

Your deployment stack will have:

✅ Network: Firewall (UFW) + Rate limiting (Nginx + fail2ban)
✅ Database: Parameterized queries + bcrypt hashing + limited user permissions
✅ Transport: HTTPS with Let's Encrypt + security headers
✅ Auth: JWT + token expiry + rate limiting on login
✅ Input: Validation + sanitization + escaped output
✅ Data: Optional app-level encryption + secure .env

This is **enterprise-grade security** for a self-hosted app.

---

## Questions?

Need help implementing any of these? Let me know.
