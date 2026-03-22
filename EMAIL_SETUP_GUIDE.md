# Email Notifications Setup Guide

## Overview

The UK Accounts Filing System includes email notification capabilities. This guide will help you set up email sending for notifications like:
- New user invitations
- Approval workflow notifications
- Budget alerts
- Bank reconciliation reminders
- Account updates

---

## Step 1: Choose Your Email Service

### Option A: SendGrid (Recommended - Free Tier Available)

**Pros:**
- Free tier: 100 emails/day
- Easy setup
- High deliverability
- Excellent documentation

**Cons:**
- Free tier limited to 100 emails/day
- Paid tier starts at $19.95/month for more

**Setup:**
1. Go to https://sendgrid.com
2. Create a free account
3. Verify your sender email or domain
4. Create an API key in Settings > API Keys

### Option B: AWS SES (Cost-Effective)

**Pros:**
- Very low cost ($0.10 per 1,000 emails)
- No daily limits after production access
- Scalable

**Cons:**
- Requires AWS account setup
- More complex configuration
- Starts in sandbox mode

**Setup:**
1. Create AWS account
2. Navigate to Simple Email Service (SES)
3. Verify sender email address
4. Request production access
5. Create AWS Access Key ID and Secret Access Key

### Option C: Gmail/Office 365 (Not Recommended for Production)

**Pros:**
- Free
- Easy setup

**Cons:**
- Low daily limits
- Breaking ToS if used for app notifications
- Not reliable for business use

**Setup:**
1. Enable "Less secure app access" (Gmail)
2. Generate app-specific password (Gmail with 2FA)

---

## Step 2: Configure Environment Variables

Create or update your `.env` file with your chosen service:

### For SendGrid:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@accounts-filing.com
EMAIL_FROM_NAME=UK Accounts Filing System
```

### For AWS SES:
```env
EMAIL_PROVIDER=awses
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
AWS_SES_REGION=eu-west-1
EMAIL_FROM=noreply@accounts-filing.com
EMAIL_FROM_NAME=UK Accounts Filing System
```

### For Gmail:
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=UK Accounts Filing System
```

---

## Step 3: Install Email Package

The system includes a notification model, but you'll need to install an email package:

```bash
npm install nodemailer
npm install @sendgrid/mail  # For SendGrid
npm install aws-sdk         # For AWS SES
```

---

## Step 4: Update Notification Model

Create `src/services/emailService.js`:

```javascript
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'smtp';
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (this.provider === 'sendgrid') {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    } else if (this.provider === 'aws-ses') {
      // AWS SES via nodemailer
      this.transporter = nodemailer.createTransport({
        SES: new (require('aws-sdk')).SES({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_SES_REGION
        })
      });
    } else {
      // SMTP (Gmail, Office 365, etc.)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      if (this.provider === 'sendgrid') {
        await sgMail.send({
          to: to,
          from: process.env.EMAIL_FROM,
          subject: subject,
          html: htmlContent,
          text: textContent || htmlContent.replace(/<[^>]*>/g, '')
        });
      } else {
        await this.transporter.sendMail({
          from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
          to: to,
          subject: subject,
          html: htmlContent,
          text: textContent || htmlContent.replace(/<[^>]*>/g, '')
        });
      }
      console.log(`Email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendTeamInvitation(email, companyName, inviterName, inviteLink) {
    const subject = `You've been invited to join ${companyName}`;
    const html = `
      <h2>Team Invitation</h2>
      <p>Hi there,</p>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on the UK Accounts Filing System.</p>
      <p><a href="${inviteLink}" style="background: #c9a84c; color: #0b1829; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a></p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      <hr>
      <p><small>UK Accounts Filing System</small></p>
    `;
    return this.sendEmail(email, subject, html);
  }

  async sendApprovalNotification(email, documentName, requiredAction) {
    const subject = `Action Required: Approval needed for ${documentName}`;
    const html = `
      <h2>Approval Required</h2>
      <p>Hi there,</p>
      <p>Your approval is needed for: <strong>${documentName}</strong></p>
      <p>${requiredAction}</p>
      <p><a href="${process.env.APP_URL}" style="background: #c9a84c; color: #0b1829; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Review Now</a></p>
      <hr>
      <p><small>UK Accounts Filing System</small></p>
    `;
    return this.sendEmail(email, subject, html);
  }

  async sendBudgetAlert(email, budgetName, percentageUsed) {
    const subject = `Budget Alert: ${budgetName} is ${percentageUsed}% spent`;
    const html = `
      <h2>Budget Alert</h2>
      <p>Hi there,</p>
      <p><strong>${budgetName}</strong> is now <strong>${percentageUsed}%</strong> of the allocated budget.</p>
      <p>Please review your spending and make any necessary adjustments.</p>
      <p><a href="${process.env.APP_URL}" style="background: #c9a84c; color: #0b1829; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Budget</a></p>
      <hr>
      <p><small>UK Accounts Filing System</small></p>
    `;
    return this.sendEmail(email, subject, html);
  }

  async sendBankReconciliationReminder(email, bankName) {
    const subject = `Reminder: Bank reconciliation needed for ${bankName}`;
    const html = `
      <h2>Reconciliation Reminder</h2>
      <p>Hi there,</p>
      <p>It's time to reconcile your <strong>${bankName}</strong> account.</p>
      <p>Regular reconciliation helps ensure your accounts are accurate.</p>
      <p><a href="${process.env.APP_URL}" style="background: #c9a84c; color: #0b1829; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reconcile Now</a></p>
      <hr>
      <p><small>UK Accounts Filing System</small></p>
    `;
    return this.sendEmail(email, subject, html);
  }

  async sendFilingReminder(email, filingType, dueDate) {
    const subject = `${filingType} filing reminder - Due ${dueDate}`;
    const html = `
      <h2>Upcoming Filing Deadline</h2>
      <p>Hi there,</p>
      <p>Your <strong>${filingType}</strong> filing is due on <strong>${dueDate}</strong>.</p>
      <p>Please prepare your documents and submit before the deadline to avoid penalties.</p>
      <p><a href="${process.env.APP_URL}" style="background: #c9a84c; color: #0b1829; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Prepare Filing</a></p>
      <hr>
      <p><small>UK Accounts Filing System</small></p>
    `;
    return this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();
```

---

## Step 5: Integrate Email with Notifications

Update `src/models/Notification.js` to send emails:

```javascript
// Add at the top of the file
const emailService = require('../services/emailService');

// In the create method, after creating notification:
async create(companyId, userId, type, title, message, data = {}) {
  // ... existing code ...

  // Send email notification
  try {
    switch (type) {
      case 'team_invitation':
        await emailService.sendTeamInvitation(
          data.email,
          data.companyName,
          data.inviterName,
          data.inviteLink
        );
        break;
      case 'approval_needed':
        await emailService.sendApprovalNotification(
          data.email,
          data.documentName,
          data.requiredAction
        );
        break;
      case 'budget_alert':
        await emailService.sendBudgetAlert(
          data.email,
          data.budgetName,
          data.percentageUsed
        );
        break;
      case 'reconciliation_needed':
        await emailService.sendBankReconciliationReminder(
          data.email,
          data.bankName
        );
        break;
      case 'filing_reminder':
        await emailService.sendFilingReminder(
          data.email,
          data.filingType,
          data.dueDate
        );
        break;
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Don't fail notification creation if email fails
  }

  return notification;
}
```

---

## Step 6: Test Email Sending

Create a test endpoint `src/routes/email-test.js`:

```javascript
const express = require('express');
const emailService = require('../services/emailService');

const router = express.Router();

router.post('/test', async (req, res) => {
  try {
    const { email, type } = req.body;

    if (type === 'invitation') {
      await emailService.sendTeamInvitation(
        email,
        'Test Company',
        'Admin User',
        'https://accounts-filing.com/invite/abc123'
      );
    } else if (type === 'approval') {
      await emailService.sendApprovalNotification(
        email,
        'Annual Accounts 2024',
        'Please review and approve the annual accounts filing'
      );
    } else if (type === 'budget') {
      await emailService.sendBudgetAlert(email, 'Operating Budget 2024', 75);
    } else if (type === 'reconciliation') {
      await emailService.sendBankReconciliationReminder(email, 'Main Operating Account');
    } else if (type === 'filing') {
      await emailService.sendFilingReminder(email, 'Annual Accounts', '31 Mar 2024');
    }

    res.json({ success: true, message: `${type} email sent to ${email}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

---

## Step 7: Test Your Setup

```bash
# Test with curl
curl -X POST http://localhost:3000/email/test \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"invitation"}'

# Or use the UI endpoint if available
```

---

## Troubleshooting

### SendGrid Issues
- API key not working: Verify key in SendGrid dashboard
- Emails not sending: Check sender email is verified
- Spam folder: Set up DKIM and SPF records

### AWS SES Issues
- Sandbox mode: Request production access (can take 24 hours)
- Deliverability issues: Verify email addresses first
- Rate limits: AWS SES has sending limits that increase over time

### Gmail Issues
- "Invalid credentials": Use app-specific password, not regular password
- "Less secure app" blocked: Enable in security settings
- Rate limit: 500 emails/day (not suitable for production)

---

## Email Template Best Practices

1. **Always include plain text alternative** for accessibility
2. **Use branded logo** in header
3. **Clear call-to-action button** in main color
4. **Include company footer** with contact info
5. **Test across email clients** (Gmail, Outlook, Apple Mail)

---

## Production Checklist

- [ ] Choose and set up email service
- [ ] Test email sending in development
- [ ] Add ENV variables to production (Render)
- [ ] Implement rate limiting to prevent spam
- [ ] Set up bounce/complaint handling
- [ ] Monitor email delivery metrics
- [ ] Create email unsubscribe mechanism
- [ ] Comply with CAN-SPAM or GDPR regulations

---

## Next Steps

Once email is configured:
1. Test all notification types
2. Monitor delivery and bounce rates
3. Adjust email frequency based on user feedback
4. Consider adding email preference center
5. Implement scheduled notifications (daily/weekly digests)

