# Deployment & Security Implementation Guide

## Step 1: Install Security Dependencies

```bash
npm install express-rate-limit helmet cors validator
```

## Step 2: Update package.json

Add these scripts to your package.json:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "prod": "NODE_ENV=production node src/server.js"
  }
}
```

## Step 3: Update src/server.js

Replace your current server.js with the one below, OR follow these key additions:

### Add requires at top:
```javascript
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { apiLimiter, loginLimiter, registerLimiter } = require('./middleware/rateLimiter');
```

### Add these middlewares BEFORE routes:

```javascript
// Security headers
app.use(helmet());
app.disable('x-powered-by');

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
}));

// Logging
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev')); // Also log to console in dev

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
```

### Route mounting (add before routes):
```javascript
const tokenCtrl = require('./controllers/tokenController');

// Token refresh endpoint
app.post('/api/auth/refresh', tokenCtrl.refreshToken);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
```

## Step 4: Update src/controllers/authController.js

Update JWT token generation to include expiry:

FIND THIS:
```javascript
const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
```

REPLACE WITH:
```javascript
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }  // Token expires after 1 hour
);

// Also issue refresh token (valid for 30 days)
const refreshToken = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  { expiresIn: '30d' }
);
```

ALSO RETURN:
```javascript
res.status(201).json({
  data: {
    user: { id: user.id, email: user.email, first_name: user.first_name },
    token: token,
    refreshToken: refreshToken  // Add this
  }
});
```

## Step 5: Update Input Validation in Controllers

Add to src/controllers/authController.js (at top of register/login functions):

```javascript
const { validateEmail, validatePassword } = require('../middleware/validation');

// In register function:
const email = validateEmail(req.body.email);
const password = validatePassword(req.body.password);

// In login function:
const email = validateEmail(req.body.email);
```

## Step 6: Update Frontend (index.html)

Add refresh token logic. Find this in your `apiCall` function:

ADD THIS FUNCTION:
```javascript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('uk_accounts_refresh');
  if (!refreshToken) return null;
  
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!res.ok) {
      localStorage.removeItem('uk_accounts_token');
      localStorage.removeItem('uk_accounts_refresh');
      return null;
    }
    
    const data = await res.json();
    authToken = data.data.token;
    localStorage.setItem('uk_accounts_token', authToken);
    return authToken;
  } catch (e) {
    console.error('[REFRESH] Failed:', e);
    return null;
  }
}
```

UPDATE YOUR `apiCall` function to handle 401:

CHANGE THIS:
```javascript
if (!res.ok) {
  if (res.status === 401) { logout(); throw new Error('Session expired. Please login again.'); }
```

TO THIS:
```javascript
if (!res.ok) {
  if (res.status === 401) {
    // Try to refresh token
    const newToken = await refreshAccessToken();
    if (newToken && attempt === 1) {
      // Retry with new token
      console.log('[API] Retrying with refreshed token');
      return apiCall(method, endpoint, data, retries - 1);
    }
    logout();
    throw new Error('Session expired. Please login again.');
  }
```

UPDATE login/register storage (find where you do localStorage.setItem):

CHANGE FROM:
```javascript
localStorage.setItem('uk_accounts_token', authToken);
```

TO:
```javascript
localStorage.setItem('uk_accounts_token', res.data.token);
localStorage.setItem('uk_accounts_refresh', res.data.refreshToken);
```

## Step 7: PostgreSQL Setup (on VPS)

```bash
# SSH to your Linode server
ssh root@YOUR_IP

# Generate secure password
PASSWORD=$(openssl rand -base64 16)
echo "Database password: $PASSWORD" > /tmp/db_pass.txt

# Connect to PostgreSQL
sudo -u postgres psql << EOF
CREATE USER uk_user WITH PASSWORD '$PASSWORD';
CREATE DATABASE uk_accounts OWNER uk_user;
GRANT CONNECT ON DATABASE uk_accounts TO uk_user;
GRANT USAGE ON SCHEMA public TO uk_user;
GRANT CREATE ON SCHEMA public TO uk_user;
\c uk_accounts
CREATE EXTENSION IF NOT EXISTS pgcrypto;
\q
EOF

# Display password
cat /tmp/db_pass.txt
```

## Step 8: Create .env on Server

```bash
ssh root@YOUR_IP
cd /opt/uk-accounts-api

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH=$(openssl rand -base64 32)

# Create .env (replace with your actual values)
cat > .env << EOF
PORT=3000
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH
DATABASE_URL=postgresql://uk_user:PASSWORD_FROM_ABOVE@localhost:5432/uk_accounts
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uk_accounts
DB_USER=uk_user
DB_PASSWORD=PASSWORD_FROM_ABOVE
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
EOF

# Secure permissions
chmod 600 .env

# Verify
cat .env
```

## Step 9: Install PM2 & Start App

```bash
npm install -g pm2

# Start app
pm2 start src/server.js --name "uk-accounts-api" --env NODE_ENV=production

# Make it restart on reboot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs
```

## Step 10: Setup Nginx (see SECURITY_HARDENING.md section 10)

## Step 11: Setup Firewall

```bash
apt-get install -y ufw

# Default deny
ufw default deny incoming
ufw default allow outgoing

# Allow only SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable
ufw enable
ufw status
```

## Step 12: Setup SSL Certificate

```bash
apt-get install -y certbot python3-certbot-nginx

# Request certificate (replace with your domain)
certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer
```

## Step 13: Setup fail2ban

```bash
apt-get install -y fail2ban

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
EOF

systemctl restart fail2ban
systemctl enable fail2ban
```

## Testing Your Security

```bash
# Test rate limiting (should block after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -s | head -c 100
  echo ""
done

# Test HTTPS
curl https://yourdomain.com

# Check SSL grade
# Go to https://www.ssllabs.com/ssltest/analyze.html

# Test headers
curl -I https://yourdomain.com
# Should see security headers
```

## Monitoring

```bash
# Watch logs
pm2 logs

# Monitor process
pm2 monit

# Check failed logins
grep "Too many login" /opt/uk-accounts-api/logs/access.log

# Check system resources
top
df -h
```

---

All set! Your app is now hardened with:
✅ Rate limiting
✅ Input validation
✅ Security headers
✅ Token expiry & refresh
✅ HTTPS/SSL
✅ Firewall
✅ Fail2ban brute force protection
