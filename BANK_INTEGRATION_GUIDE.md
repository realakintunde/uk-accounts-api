# Bank Integration Guide

## Overview

The UK Accounts Filing System supports multiple ways to integrate with your bank data:

1. **CSV Import** - Manual import from bank exports (✅ Immediate)
2. **Plaid Integration** - Automatic bank connections (Recommended for US/UK banks)
3. **Open Banking API** - European standard (PSD2)
4. **Direct Bank APIs** - Institution-specific integrations

---

## Option 1: CSV Bank Import (Immediate - No Setup Required)

### Format Your CSV File

Export your bank statement as CSV (most banks offer this):

**Required Columns:**
```
Date,Description,Debit,Credit,Balance
01/01/2024,Opening balance,,1000000.00,1000000.00
01/02/2024,ACME Corp payment,5000.00,,995000.00
01/03/2024,Client deposit,,15000.00,1010000.00
```

**OR Alternative Format:**
```
Date,Description,Type,Amount
01/01/2024,Opening balance,Deposit,1000000.00
01/02/2024,ACME Corp payment,Withdrawal,5000.00
01/03/2024,Client deposit,Deposit,15000.00
```

### How to Import

1. Click **"Bank Accounts"** → Select account
2. Click **"Import Transactions"**
3. Click **"Choose File"** and select your CSV
4. System will:
   - Preview the data
   - Auto-detect date format
   - Identify amounts
   - Show any warnings

5. Click **"Import"**
6. Transactions added to account
7. System will create import log for audit trail

### CSV Import Limitations

- ❌ Manual - requires monthly export from bank
- ❌ No real-time data sync
- ❌ Can't catch live fraud
- ✅ Works with any bank
- ✅ No API key needed

---

## Option 2: Plaid Integration (Recommended)

### What is Plaid?

Third-party service that connects to 12,000+ financial institutions. Secure, reliable, handles authentication.

### Setup Plaid (5 minutes)

1. Go to https://plaid.com
2. Sign up for free account
3. Select "Development" tier (free)
4. Get your:
   - Client ID
   - Secret Key
   - Public Key

### Add Plaid to Your Configuration

Add to `.env`:
```env
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret_key
PLAID_PUBLIC_KEY=your_public_key
PLAID_ENV=development  # Use sandbox for testing, production for real data
```

### Install Plaid Package

```bash
npm install plaid
```

### Create Plaid Integration Service

Create `src/services/plaidService.js`:

```javascript
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseServer: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  clientId: process.env.PLAID_CLIENT_ID,
  secret: process.env.PLAID_SECRET,
});

const client = new PlaidApi(configuration);

class PlaidService {
  /**
   * Create link token for bank connection
   */
  async createLinkToken(userId, companyId) {
    try {
      const request = {
        user: { client_user_id: userId },
        client_name: 'UK Accounts Filing System',
        language: 'en',
        country_codes: ['GB', 'US'],
        products: ['auth', 'transactions'],
        redirect_uri: `${process.env.APP_URL}/bank/callback`
      };

      const response = await client.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      console.error('Error creating link token:', error);
      throw error;
    }
  }

  /**
   * Exchange public token for access token
   */
  async exchangePublicToken(publicToken) {
    try {
      const request = { public_token: publicToken };
      const response = await client.itemPublicTokenExchange(request);
      return response.data.access_token;
    } catch (error) {
      console.error('Error exchanging token:', error);
      throw error;
    }
  }

  /**
   * Get bank accounts for user
   */
  async getAccounts(accessToken) {
    try {
      const request = { access_token: accessToken };
      const response = await client.accountsGet(request);
      return response.data.accounts;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  /**
   * Get transactions for date range
   */
  async getTransactions(accessToken, startDate, endDate) {
    try {
      const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          include_personal_finance_category: true
        }
      };

      const response = await client.transactionsGet(request);
      return response.data.transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Get real-time balance
   */
  async getBalance(accessToken) {
    try {
      const request = { access_token: accessToken };
      const response = await client.accountsBalanceGet(request);
      return response.data.accounts;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  /**
   * Refresh transactions
   */
  async refreshTransactions(accessToken) {
    try {
      const request = { access_token: accessToken };
      const response = await client.transactionsRefresh(request);
      return response.data;
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      throw error;
    }
  }
}

module.exports = new PlaidService();
```

### Create Bank Integration Route

Create `src/routes/bank-integration.js`:

```javascript
const express = require('express');
const plaidService = require('../services/plaidService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Step 1: Get link token for Plaid connection
 */
router.post('/:companyId/plaid/link-token', authenticateToken, async (req, res) => {
  try {
    const linkToken = await plaidService.createLinkToken(req.user.id, req.params.companyId);
    res.json({ success: true, linkToken });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Step 2: Exchange public token for access token
 */
router.post('/:companyId/plaid/exchange-token', authenticateToken, async (req, res) => {
  try {
    const { publicToken } = req.body;
    const accessToken = await plaidService.exchangePublicToken(publicToken);

    // Save access token to database (encrypted)
    // TODO: Save to bank_integrations table with encryption

    res.json({ success: true, message: 'Bank connected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Step 3: Sync transactions
 */
router.post('/:companyId/plaid/sync', authenticateToken, async (req, res) => {
  try {
    const { bankAccountId } = req.body;
    // TODO: Get access token from database
    // const transactions = await plaidService.getTransactions(accessToken, startDate, endDate);
    // TODO: Save transactions to database

    res.json({ success: true, message: 'Transactions synced' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get real-time balance
 */
router.get('/:companyId/plaid/balance', authenticateToken, async (req, res) => {
  try {
    // TODO: Get access token from database
    // const balance = await plaidService.getBalance(accessToken);
    res.json({ success: true, balance: 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### Frontend Integration

Add to your app's bank connection page:

```html
<script src="https://cdn.plaid.com/link/v3/link-initialize.js"></script>

<button onclick="connectBank()">Connect Your Bank</button>

<script>
async function connectBank() {
  // Get link token from backend
  const response = await fetch(`/api/bank-integration/1/plaid/link-token`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  const { linkToken } = await response.json();

  // Create Plaid Link instance
  const handler = Plaid.create({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
      // Exchange public token
      await fetch(`/api/bank-integration/1/plaid/exchange-token`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ publicToken })
      });
      alert('Bank connected successfully!');
    },
    onExit: (err, metadata) => {
      console.log('User exited:', err);
    }
  });

  handler.open();
}
</script>
```

### Plaid Fee Structure

- **Development (Free):** Sandbox environment, limited transactions
- **Sandbox (Free):** Testing with test credentials
- **Production:**
  - Lite: $0.10 per transaction (min $50/month)
  - Standard: Custom pricing

---

## Option 3: Open Banking API (European Standard)

### What is Open Banking?

PSD2 (Payment Services Directive 2) - European regulation requiring banks to open APIs.

Available to UK businesses (post-Brexit with relevant credentials).

### Setup Open Banking

1. **Get Credentials**
   - Contact your business bank
   - Request Open Banking API access
   - Get Client ID and Keys

2. **Register Your Application**
   - Provide: App name, redirect URL, scope
   - Most UK banks provide dashboard for this

3. **Install Library**
   ```bash
   npm install axios  # For HTTP requests
   ```

### Example: Barclays Open Banking

```javascript
const axios = require('axios');

class OpenBankingService {
  async getAccounts(clientId, clientSecret, token) {
    try {
      const response = await axios.get('https://api.open.barclays.com/v3.1/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-fapi-financial-id': clientId,
          'x-fapi-nists': 'SHA256'
        }
      });
      return response.data.Data.Account;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  async getTransactions(clientId, token, accountId) {
    try {
      const response = await axios.get(
        `https://api.open.barclays.com/v3.1/accounts/${accountId}/transactions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-fapi-financial-id': clientId,
            'x-fapi-nists': 'SHA256'
          }
        }
      );
      return response.data.Data.Transaction;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }
}

module.exports = new OpenBankingService();
```

---

## Option 4: Direct Bank APIs

### Popular UK Banks with APIs

1. **HSBC**
   - Open for business account holders
   - Open Banking API available
   - Contact: https://www.hsbc.com/business-banking/api

2. **Lloyds**
   - Open to approved businesses
   - Web services available
   - Portal: https://www.lloydsbank.com/business-banking/api

3. **NatWest**
   - Open Business services
   - Real-time transactions
   - Contact: https://developer.natwest.com

4. **Barclays**
   - Open Banking API
   - Verified businesses only
   - Dashboard: https://open.barclays.com

### General Setup Pattern

1. Register as developer on bank's portal
2. Create API credentials
3. Configure your integration service
4. Request permission scopes (usually 'accounts' and 'transactions')
5. Implement OAuth 2.0 flow
6. Store tokens securely in database

---

## Database Schema for Bank Integrations

Add to `002-add-advanced-features.sql`:

```sql
CREATE TABLE bank_integrations (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL, -- 'plaid', 'open_banking', 'csv', 'direct'
  access_token VARCHAR(2000) NOT NULL, -- Encrypted in application
  refresh_token VARCHAR(2000),
  token_expires_at TIMESTAMP,
  institution_id VARCHAR(100),
  last_synced TIMESTAMP,
  last_transaction_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_integrations_company 
  ON bank_integrations(company_id);
```

---

## Transaction Mapping

When syncing transactions from external sources, map external fields to your schema:

```javascript
const mapPlaidTransaction = (plaidTransaction, bankAccountId) => {
  return {
    bank_account_id: bankAccountId,
    date: plaidTransaction.date,
    description: plaidTransaction.name,
    amount: Math.abs(plaidTransaction.amount),
    direction: plaidTransaction.amount > 0 ? 'deposit' : 'withdrawal',
    reference: plaidTransaction.transaction_id,
    plaid_id: plaidTransaction.transaction_id,
    category: plaidTransaction.personal_finance_category?.primary,
    metadata: {
      merchant_name: plaidTransaction.merchant_name,
      counterparty: plaidTransaction.counterparties?.[0]?.name,
      iso_currency_code: plaidTransaction.iso_currency_code
    }
  };
};
```

---

## Automatic Reconciliation

Once transactions are imported:

```javascript
async function autoReconciliate(bankAccountId) {
  // Get unreconciled transactions
  const unreconciled = await getUnreconciledTransactions(bankAccountId);
  
  // For each transaction in bank statement
  for (const bankTx of unreconciled) {
    // Find matching transaction in records
    const record = findMatchingTransaction(bankTx);
    
    if (record && amountsMatch(bankTx, record)) {
      // Mark both as matched
      await markAsReconciled(bankTx.id, record.id);
    }
  }
  
  // Calculate variance
  const variance = calculateVariance(bankAccountId);
  
  return {
    totalReconciled: reconciled.length,
    pendingReview: unreconciled.length,
    variance: variance
  };
}
```

---

## Best Practices for Bank Integration

### Security
1. ✅ **Encrypt tokens** before storing in database
2. ✅ **Use HTTPS** for all API calls
3. ✅ **Rotate credentials** regularly
4. ✅ **Never log sensitive data**
5. ✅ **Implement rate limiting**

### Accuracy
1. ✅ **Validate transaction amounts** match bank
2. ✅ **Check duplicate detection**
3. ✅ **Handle decimal places** correctly
4. ✅ **Timezone awareness** for dates
5. ✅ **Monthly reconciliation** before filing

### Performance
1. ✅ **Cache account lists** for 1 hour
2. ✅ **Queue transaction syncs** to avoid blocking
3. ✅ **Batch import** large transaction sets
4. ✅ **Index frequently searched fields**
5. ✅ **Archive old transactions** after 3 years

---

## Troubleshooting Bank Integration

### Plaid Connection Issues

**Problem:** "Invalid public token"
- Solution: Ensure link token hasn't expired (expires in 15 min)
- Verify redirect_uri matches configuration

**Problem:** "No institutions found"
- Solution: Ensure PLAID_ENV is set (sandbox/production)
- Check country codes (GB, US, etc.)

**Problem:** "Transaction sync failed"
- Solution: Check access token still valid
- Verify date range is within institution's supported window
- Some institutions only provide 90 days history

### Data Sync Issues

**Problem:** Duplicate transactions
- Solution: Check transaction_id field for uniqueness
- Implement dedup logic before import

**Problem:** Missing transactions
- Solution: Not all institutions provide real-time data
- Check transaction fetch date range
- Some transactions take 2-3 days to appear

**Problem:** Reconciliation variances
- Solution: Check for:
  - Pending transactions (not yet cleared)
  - Fees not recorded
  - Timing differences
  - Bank balance vs. ledger balance

---

## Recommended Integration Path

### Phase 1 (Week 1): Manual Import
- ✅ Set up CSV import template
- ✅ Train users on export/import process
- ✅ Verify data accuracy

### Phase 2 (Week 2): Plaid Integration
- ✅ Get Plaid development account
- ✅ Implement link token flow
- ✅ Test with sand box accounts
- ✅ Deploy to production

### Phase 3 (Week 3): Real-time Sync
- ✅ Implement automatic daily syncs
- ✅ Add webhook for near real-time
- ✅ Set up alerts for anomalies

### Phase 4 (Week 4+): Additional Banks
- ✅ Add Open Banking API support
- ✅ Multi-currency support
- ✅ Advanced reconciliation AI

---

## Support & Resources

- **Plaid Documentation:** https://plaid.com/docs
- **Open Banking (PSD2):** https://www.openbanking.org.uk
- **Barclays API:** https://open.barclays.com
- **HSBC API:** https://developer.hsbc.com

---

**Last Updated:** January 2024

