# Priority #3: Activate Freemium Pricing Implementation Guide

## Overview - HIGHEST PRIORITY ⚡

This is the MOST IMPORTANT step. Without this, everything else (marketing website, branding) drives users but you make $0.

**Goal:** Customers can pay, recurring revenue flows, business sustainable.

**Time to implement:** 1 day  
**Cost:** 2.9% + 30¢ per transaction (Stripe takes cut)  
**Revenue potential:** £1,000+/month by month 9

---

## PART A: SET UP STRIPE ACCOUNT

### Step 1: Create Stripe Account (5 mins)

**Go to:** https://stripe.com  
**Click:** "Start now"  
**Enter:**
- Email address
- Country: United Kingdom
- Account type: **Business**

**Verify email:** Click link in email

---

### Step 2: Complete Business Profile (10 mins)

**Stripe asks:**

1. **Business details**
   - Business name: Ledger Plus Ltd
   - Website: ledgerplus.co.uk
   - Business type: Software/SaaS
   - Country: UK
   - Address: Your business address

2. **Personal details**
   - Your full name
   - Your DOB
   - Your address

3. **Tax information**
   - VAT number (optional for now, add later)
   - Company registration: Your Companies House number

**Status after:** Usually "Pending" for 1-3 days while Stripe verifies

---

### Step 3: Get Stripe Keys

Once verified (usually same day):

1. **Go to:** Stripe Dashboard
2. **Navigate:** Developers → API keys
3. **Copy these keys:**
   - **Publishable key:** (starts with "pk_")
   - **Secret key:** (starts with "sk_")

**IMPORTANT:** Secret key = password. NEVER share it or commit to Git!

---

## PART B: INTEGRATE STRIPE INTO YOUR APP

### Step 1: Install Stripe Package

In your Express.js backend:

```bash
cd C:\Users\reala\uk-accounts-api
npm install stripe
```

---

### Step 2: Create Pricing/Subscription Model

Create file: `src/models/Subscription.js`

```javascript
// Subscription model for managing user subscriptions

const subscriptionTiers = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    stripePriceId: null,
    companies: 1,
    teamMembers: 3,
    features: ['basic_filing', 'manual_entry']
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 2900, // £29.00 in pence
    stripePriceId: 'price_XXX', // Get from Stripe
    billingCycle: 'month',
    companies: 3,
    teamMembers: 999, // unlimited
    features: ['all_templates', 'approvals', 'email_support']
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 9900, // £99.00 in pence
    stripePriceId: 'price_YYY', // Get from Stripe
    billingCycle: 'month',
    companies: 999, // unlimited
    teamMembers: 999, // unlimited
    features: ['everything', 'api_access', 'bank_integrations']
  }
};

class Subscription {
  /**
   * Get tier details
   */
  static getTier(tierId) {
    return subscriptionTiers[tierId];
  }

  /**
   * Get all tiers
   */
  static getAllTiers() {
    return Object.values(subscriptionTiers);
  }

  /**
   * Check if user has feature access
   */
  static hasFeature(userTier, featureName) {
    const tier = subscriptionTiers[userTier];
    return tier && tier.features.includes(featureName);
  }

  /**
   * Can user create more companies?
   */
  static canCreateCompany(userTier, currentCompanies) {
    const tier = subscriptionTiers[userTier];
    return currentCompanies < tier.companies;
  }
}

module.exports = Subscription;
```

---

### Step 3: Create Stripe Checkout Route

Create file: `src/routes/stripe.js`

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require('../middleware/auth');
const { db } = require('../database/config');

const router = express.Router();

/**
 * Step 1: Create checkout session
 * User clicks "Upgrade to Professional"
 */
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { tierId } = req.body; // 'professional' or 'business'
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Get pricing from Stripe
    const prices = {
      professional: 'price_1QlNzaA5Bn9h7y8K9L0M11N2', // Add your Stripe price IDs
      business: 'price_1QlNzaA5Bn9h7y8K9L0M11N3'
    };

    if (!prices[tierId]) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: prices[tierId],
          quantity: 1
        }
      ],
      mode: 'subscription', // Recurring payments
      customer_email: userEmail,
      metadata: {
        userId: userId,
        tierId: tierId
      },
      success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/pricing`,
    });

    // Save pending subscription to DB
    await db.query(
      `INSERT INTO pending_subscriptions (user_id, tier_id, session_id, created_at) 
       VALUES ($1, $2, $3, NOW())`,
      [userId, tierId, session.id]
    );

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Step 2: Confirm subscription after payment
 */
router.get('/confirm-subscription', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user.id;

    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const tierId = session.metadata.tierId;
      const subscriptionId = session.subscription;

      // Update user subscription in DB
      await db.query(
        `UPDATE users SET 
          subscription_tier = $1,
          stripe_subscription_id = $2,
          subscription_activated_at = NOW()
         WHERE id = $3`,
        [tierId, subscriptionId, userId]
      );

      res.json({ success: true, tier: tierId });
    } else {
      res.json({ success: false, message: 'Payment not completed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Step 3: Webhook for subscription updates
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    // Handle subscription events
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;
      const status = subscription.status;

      await db.query(
        `UPDATE users SET subscription_status = $1 WHERE id = $2`,
        [status, userId]
      );
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;

      // Downgrade to free
      await db.query(
        `UPDATE users SET subscription_tier = 'free' WHERE id = $1`,
        [userId]
      );
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;
```

---

### Step 4: Add Route to Server

Edit `src/server.js`:

```javascript
// Add this line with other routes:
app.use('/api/stripe', require('./routes/stripe'));

// Also add webhook before other middleware:
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), 
  require('./routes/stripe').post);
```

---

### Step 5: Create Database Table for Subscriptions

Add to your database migrations:

```sql
-- Create subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  tier VARCHAR(50) DEFAULT 'free',
  stripe_subscription_id VARCHAR(500),
  stripe_customer_id VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
```

---

## PART C: FRONTEND PRICING PAGE

### Step 1: Create Pricing Page

Add to `public/app.html` (or create separate pricing.html):

```html
<!DOCTYPE html>
<html>
<head>
  <title>Pricing - AccountsHub</title>
  <style>
    :root {
      --navy: #0b1829;
      --gold: #c9a84c;
      --cream: #f2ede3;
    }
    
    body {
      background: var(--navy);
      color: var(--cream);
      font-family: 'IBM Plex Sans', sans-serif;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      text-align: center;
      margin-bottom: 50px;
      color: var(--gold);
      font-size: 32px;
    }
    
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin-bottom: 50px;
    }
    
    .pricing-card {
      border: 2px solid rgba(201, 168, 76, 0.2);
      border-radius: 8px;
      padding: 30px;
      background: rgba(26, 47, 74, 0.5);
      transition: all 0.3s;
    }
    
    .pricing-card:hover {
      border-color: var(--gold);
      transform: translateY(-10px);
    }
    
    .pricing-card.featured {
      border-color: var(--gold);
      background: rgba(201, 168, 76, 0.1);
      transform: scale(1.05);
    }
    
    .pricing-card h3 {
      color: var(--gold);
      margin-bottom: 10px;
      font-size: 24px;
    }
    
    .price {
      font-size: 36px;
      color: var(--cream);
      margin: 20px 0;
      font-weight: bold;
    }
    
    .price-period {
      color: rgba(242, 237, 227, 0.7);
      font-size: 14px;
    }
    
    .features {
      list-style: none;
      padding: 20px 0;
      border-top: 1px solid rgba(201, 168, 76, 0.2);
      border-bottom: 1px solid rgba(201, 168, 76, 0.2);
      margin: 20px 0;
    }
    
    .features li {
      padding: 8px 0;
      display: flex;
      align-items: center;
    }
    
    .features li:before {
      content: "✓ ";
      color: var(--gold);
      margin-right: 10px;
      font-weight: bold;
    }
    
    .btn-upgrade {
      width: 100%;
      padding: 12px 20px;
      background: var(--gold);
      color: var(--navy);
      border: none;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 16px;
    }
    
    .btn-upgrade:hover {
      background: #e2c97e;
    }
    
    .btn-upgrade:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .toggle-billing {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .toggle-billing label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
    }
    
    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }
    
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.4s;
      border-radius: 24px;
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }
    
    input:checked + .slider {
      background-color: var(--gold);
    }
    
    input:checked + .slider:before {
      transform: translateX(26px);
    }
    
    .save-badge {
      display: inline-block;
      background: var(--gold);
      color: var(--navy);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-left: 10px;
    }
    
    .free-badge {
      display: inline-block;
      background: rgba(201, 168, 76, 0.2);
      color: var(--gold);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Simple, Transparent Pricing</h1>
    
    <!-- Billing Toggle -->
    <div class="toggle-billing">
      <label>
        <span>Pay monthly</span>
        <div class="switch">
          <input type="checkbox" id="billingToggle">
          <span class="slider"></span>
        </div>
        <span>Pay annually <span class="save-badge">Save 20%</span></span>
      </label>
    </div>
    
    <!-- Pricing Grid -->
    <div class="pricing-grid">
      <!-- FREE -->
      <div class="pricing-card">
        <h3>Free <span class="free-badge">Forever</span></h3>
        <div class="price">£0<span class="price-period">/forever</span></div>
        <p>Perfect for getting started</p>
        <ul class="features">
          <li>1 company</li>
          <li>Up to 3 team members</li>
          <li>Basic filing templates</li>
          <li>Manual entry</li>
          <li>Community support</li>
        </ul>
        <button class="btn-upgrade" onclick="location.href='/app.html'">
          Get Started
        </button>
      </div>
      
      <!-- PROFESSIONAL -->
      <div class="pricing-card">
        <h3>Professional</h3>
        <div class="price">
          <span id="prof-price">£29</span>
          <span class="price-period">/<span id="prof-period">month</span></span>
        </div>
        <p>For growing businesses</p>
        <ul class="features">
          <li>3 companies</li>
          <li>Unlimited team members</li>
          <li>All filing templates</li>
          <li>Approval workflows</li>
          <li>Email support (24h)</li>
          <li>Monthly reports</li>
        </ul>
        <button class="btn-upgrade" onclick="upgradeTier('professional')">
          Choose Plan
        </button>
      </div>
      
      <!-- BUSINESS (Featured) -->
      <div class="pricing-card featured">
        <h3>Business</h3>
        <div class="price">
          <span id="bus-price">£99</span>
          <span class="price-period">/<span id="bus-period">month</span></span>
        </div>
        <p>Everything you need to scale</p>
        <ul class="features">
          <li>Unlimited companies</li>
          <li>Unlimited team members</li>
          <li>All features</li>
          <li>Bank integrations (Plaid)</li>
          <li>API access</li>
          <li>Advanced analytics</li>
          <li>Phone support</li>
        </ul>
        <button class="btn-upgrade" onclick="upgradeTier('business')">
          Choose Plan
        </button>
      </div>
    </div>
  </div>
  
  <script>
    const billingToggle = document.getElementById('billingToggle');
    
    // Pricing (in £, multiply by 100 for pence in Stripe)
    const monthly = {
      professional: 29,
      business: 99
    };
    
    const annual = {
      professional: 290, // 20% discount = £29 * 12 * 0.8
      business: 990     // 20% discount
    };
    
    // Toggle billing
    billingToggle.addEventListener('change', () => {
      const isAnnual = billingToggle.checked;
      
      document.getElementById('prof-period').textContent = isAnnual ? 'year' : 'month';
      document.getElementById('bus-period').textContent = isAnnual ? 'year' : 'month';
      
      document.getElementById('prof-price').textContent = 
        '£' + (isAnnual ? annual.professional : monthly.professional);
      document.getElementById('bus-price').textContent = 
        '£' + (isAnnual ? annual.business : monthly.business);
    });
    
    // Upgrade function
    async function upgradeTier(tier) {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Redirect to login
        window.location.href = '/app.html?redirect=pricing';
        return;
      }
      
      try {
        // Create checkout session
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ tierId: tier })
        });
        
        const { sessionId } = await response.json();
        
        // Redirect to Stripe Checkout
        window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
      } catch (error) {
        alert('Error starting checkout. Please try again.');
        console.error(error);
      }
    }
  </script>
</body>
</html>
```

---

## PART D: GET STRIPE PRICE IDs

This is critical! Stripe needs actual price IDs.

### Step 1: Create Products in Stripe Dashboard

1. **Go to:** https://dashboard.stripe.com
2. **Navigate:** Products → Create product

**Product 1: Professional Plan**
- Name: Professional Plan
- Price: £29.00/month
- Billing period: Monthly
- Copy the **Price ID** (starts with "price_")

**Product 2: Business Plan**
- Name: Business Plan
- Price: £99.00/month
- Billing period: Monthly
- Copy the **Price ID**

**Also create annual versions:**
- Professional: £290.00/year
- Business: £990.00/year

---

### Step 2: Add Price IDs to Code

Update `src/routes/stripe.js`:

```javascript
const prices = {
  professional_monthly: 'price_1QlNzaa7Bn9h7y8K9L0M11N2',
  professional_annual: 'price_1QlNzaa7Bn9h7y8K9L0M11N3',
  business_monthly: 'price_1QlNzaa7Bn9h7y8K9L0M11N4',
  business_annual: 'price_1QlNzaa7Bn9h7y8K9L0M11N5'
};
```

---

## PART E: SET UP WEBHOOK

### Step 1: Create Webhook Endpoint

In Stripe dashboard:

1. Navigate: Developers → Webhooks
2. Click: "Add endpoint"
3. Endpoint URL: `https://uk-accounts-api.onrender.com/api/stripe/webhook`
4. Select events:
   - customer.subscription.updated
   - customer.subscription.deleted
   - checkout.session.completed
5. Create endpoint
6. Copy **Signing secret** (starts with "whsec_")

### Step 2: Add to Environment Variables

Update `.env`:

```env
STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

---

## PART F: ACTIVATE IN YOUR APP

### Step 1: Update Registration

When new user signs up, create free subscription:

```javascript
// In authController.js after user creation:
await db.query(
  `INSERT INTO subscriptions (user_id, tier, status) 
   VALUES ($1, 'free', 'active')`,
  [newUser.id]
);
```

### Step 2: Add Subscription Check

Middleware to enforce tier limits:

```javascript
// src/middleware/checkSubscription.js
const checkSubscription = async (req, res, next) => {
  const userId = req.user.id;
  
  const result = await db.query(
    `SELECT tier FROM subscriptions WHERE user_id = $1`,
    [userId]
  );
  
  const tier = result.rows[0]?.tier || 'free';
  req.user.tier = tier;
  
  next();
};

module.exports = checkSubscription;
```

### Step 3: Use in Routes

```javascript
// Block features for free tier
router.post('/budgets', checkSubscription, async (req, res) => {
  if (req.user.tier === 'free') {
    return res.status(403).json({ 
      error: 'Upgrade to Professional to use budgets' 
    });
  }
  // ... rest of endpoint
});
```

---

## TESTING

### Test Mode (FREE - use fake card numbers)

1. Use Stripe test keys (sk_test_...)
2. Card number: **4242 4242 4242 4242**
3. Exp: Any future date
4. CVV: Any 3 digits

**Test process:**
1. Go to /pricing
2. Click "Upgrade to Professional"
3. Enter test card details
4. Confirm payment works
5. Check DB for subscription update

---

## ENVIRONMENT SETUP

Add to `.env`:

```env
# Stripe Keys
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Business info
BUSINESS_NAME=AccountsHub Ltd
BUSINESS_URL=https://accountshub.co.uk
```

---

## DEPLOYMENT TO RENDER

1. **In Render dashboard:**
   - Go to your service settings
   - Add environment variables:
     - STRIPE_PUBLIC_KEY
     - STRIPE_SECRET_KEY
     - STRIPE_WEBHOOK_SECRET

2. **Deploy code:**
   ```bash
   git add .
   git commit -m "Add Stripe integration for freemium pricing"
   git push
   ```
   Render auto-deploys ✓

3. **Update webhook URL in Stripe:**
   - From: localhost/webhook
   - To: https://uk-accounts-api.onrender.com/api/stripe/webhook

---

## COMPLETE CHECKLIST

### Setup (1 day)
- [ ] Create Stripe account (5 mins)
- [ ] Set up business profile
- [ ] Create products in Stripe (3 products x 2 periods = 6 products)
- [ ] Get price IDs
- [ ] Create webhook endpoint
- [ ] Get API keys and webhook secret

### Integration (4-6 hours)
- [ ] Install stripe package
- [ ] Create Subscription model
- [ ] Create stripe.js routes
- [ ] Add database table
- [ ] Create pricing page (HTML)
- [ ] Update server.js routes
- [ ] Test with fake card

### Testing (2 hours)
- [ ] Test upgrading to Professional
- [ ] Test upgrading to Business
- [ ] Test annual billing toggle
- [ ] Test webhook (subscription updated)
- [ ] Verify subscription in dashboard

### Deployment (1 hour)
- [ ] Add environment variables to Render
- [ ] Deploy code
- [ ] Update webhook URL in Stripe
- [ ] Switch to live keys (not test)
- [ ] Test with real payment (small amount)

### Monitoring (Ongoing)
- [ ] Monitor Stripe dashboard daily
- [ ] Check failed payments
- [ ] Review revenue weekly
- [ ] Handle billing disputes

---

## REVENUE CALCULATIONS

### Conservative Scenario (Month 6)
- 20 Professional @ £29 = £580/month
- 5 Business @ £99 = £495/month
- Monthly Revenue: £1,075
- Annual Revenue: £12,900

### Optimistic Scenario (Month 6)
- 50 Professional @ £29 = £1,450/month
- 20 Business @ £99 = £1,980/month
- Monthly Revenue: £3,430
- Annual Revenue: £41,160

**Stripe fees**: 2.9% + 30¢ per transaction
- On £1,075: ~£42 in fees
- On £3,430: ~£132 in fees

---

## TIMELINE

```
DAY 1 (Mon)
└─ Set up Stripe account (30 mins)
└─ Create products and price IDs (1 hour)
└─ Create webhook (30 mins)

DAY 1-2 (Mon-Tue)
└─ Integrate into backend (2-3 hours)
└─ Create pricing page (1-2 hours)

DAY 3 (Wed)
└─ Test with fake cards (30 mins)
└─ Debug any issues (1-2 hours)

DAY 4 (Thu)
└─ Deploy to Render (30 mins)
└─ Test in production (1 hour)
└─ Switch to live keys (30 mins)

TOTAL: 3-4 days (1 week including buffers)
```

---

## FINAL RESULT

✅ **Users can upgrade to paid plans**  
✅ **Recurring payments work automatically**  
✅ **Subscriptions tracked in database**  
✅ **Feature access controlled by tier**  
✅ **Revenue flows directly to your bank**  

**Monthly revenue starts immediately once live** 💰

---

## NEXT STEPS AFTER ACTIVATION

1. **Monitor:** Check Stripe dashboard daily
2. **Gather feedback:** Ask users why they upgrade/downgrade
3. **Optimize:** A/B test pricing if needed
4. **Add features:** Continue building features for paid tiers
5. **Marketing:** Promote paid plans via email/ads

---

**Cost: FREE (Stripe takes 2.9% + 30¢)**  
**Time: 3-4 days**  
**ROI: IMMEDIATE - Revenue starts flowing**

**This is the most important step. Do this first! ⚡**

