# UK Annual Accounts Filing System - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Team Management](#team-management)
3. [Managing Budgets](#managing-budgets)
4. [Bank Reconciliation](#bank-reconciliation)
5. [Approval Workflows](#approval-workflows)
6. [Document Versioning](#document-versioning)
7. [Audit Logs](#audit-logs)
8. [Notifications](#notifications)
9. [Tax Settings](#tax-settings)
10. [FAQ](#faq)

---

## Getting Started

### Account Setup

1. **Create an Account**
   - Visit https://uk-accounts-api.onrender.com
   - Click "Sign Up"
   - Enter your email and password
   - Verify your email address

2. **Create Your Company**
   - Log in to your account
   - Click "New Company"
   - Enter company details:
     - Company name
     - Registration number
     - Address
     - Tax year end date

3. **Invite Team Members**
   - Go to Team Management
   - Click "Invite Team Member"
   - Enter their email address
   - Select their role (Admin, Accountant, Viewer, Approver)
   - They'll receive an email invitation

### Roles and Permissions

| Role | Can Create | Can Approve | Can View | Can Edit |
|------|-----------|-----------|----------|----------|
| **Admin** | Everything | Everything | Everything | Everything |
| **Accountant** | Entries, Documents | Only own work | All | Own entries |
| **Approver** | Nothing | Assigned items | All | Via workflow |
| **Viewer** | Nothing | Nothing | All | Nothing |

---

## Team Management

### Adding Team Members

**Step-by-Step:**

1. Click **"Team"** in the admin dashboard
2. Click **"+ Add Team Member"**
3. Enter the team member's email address
4. Select their role
5. Click **"Add Member"**
6. They'll receive an invitation email

**Email Invitation:**
- Valid for 7 days
- Click the link to accept
- Create their password
- Access granted immediately

### Removing Team Members

1. Go to **Team Management**
2. Find the member you want to remove
3. Click the **"Remove"** button
4. Confirm removal
5. They lose access immediately

### Changing Roles

1. Go to **Team Management**
2. Click the member's **Role dropdown**
3. Select new role
4. Changes take effect immediately

**Note:** You can't remove your own admin access. Have another admin do it if needed.

---

## Managing Budgets

### Creating a Budget

**Purpose:** Control spending and monitor budget vs. actual expenses

**Steps:**

1. Click **"Budgets"** in admin dashboard
2. Click **"+ Create Budget"**
3. Fill in details:
   - **Budget Name:** e.g., "2024 Marketing Budget"
   - **Fiscal Year:** 2024
   - **Total Budget:** £500,000

4. Click **"Create Budget"**

### Adding Budget Items

Budget items break down your budget into categories:

1. Go to the budget you created
2. Click **"Add Budget Item"**
3. Enter:
   - **Category:** e.g., "Salaries", "Marketing", "IT"
   - **Amount:** £100,000
   - **Assignment:** Assign to team member (optional)

4. Click **"Add Item"**

### Monitoring Budget vs. Actual

The dashboard shows:
- **Total Budget:** What you allocated
- **Spent:** Actual expenses recorded
- **Variance:** Difference (positive = under budget)
- **% Used:** Spending percentage

**Color indicators:**
- 🟢 Green: Under 70%
- 🟡 Yellow: 70-90%
- 🔴 Red: Over 90%

### Budget Alerts

**Automatic Notifications:**
- 70% spent → Warning notification
- 90% spent → Urgent email alert
- 100% spent → Critical alert

You can adjust these thresholds in Settings.

---

## Bank Reconciliation

### What is Bank Reconciliation?

Matching your records with your bank statement to ensure accuracy and catch discrepancies.

### Setting Up Bank Accounts

1. Click **"Bank Accounts"** in admin dashboard
2. Click **"+ Add Bank Account"**
3. Enter:
   - **Account Name:** e.g., "Main Operating Account"
   - **Account Number:** 12345678
   - **Sort Code:** 201530
   - **Bank Name:** Example Bank

4. Click **"Add Account"**

### Recording Bank Transactions

1. Open a bank account
2. Click **"+ New Transaction"**
3. Enter:
   - **Date:** When transaction occurred
   - **Description:** What the transaction is for
   - **Amount:** How much (positive for deposits, negative for withdrawals)
   - **Type:** Deposit or Withdrawal
   - **Reference:** Bank reference if available

4. Click **"Record Transaction"**

### Reconciling Your Bank

**Monthly Reconciliation Process:**

1. Get your bank statement
2. Click **"Reconcile Account"**
3. For each statement transaction:
   - Check the box when it matches your records
   - Note any discrepancies

4. Bottom section shows:
   - **Uncleared transactions:** Not matched yet
   - **Variance:** Difference between records and bank

5. When variance = £0, reconciliation is complete ✓

**Tips:**
- Reconcile monthly, don't wait
- Check for duplicate entries
- Note timing differences (payments in transit)
- Keep screenshots of bank statements

### Viewing Transaction History

1. Open a bank account
2. Scroll down to **"Transaction History"**
3. Filter by:
   - Date range
   - Type (Deposit/Withdrawal)
   - Status (Cleared/Pending)

---

## Approval Workflows

### What are Approval Workflows?

Formal approval processes for important documents. Ensures proper oversight and compliance.

### Setting Up Approval Requirements

1. Click **"Settings"** → **"Approval Rules"**
2. Click **"+ New Rule"**
3. Set:
   - **Document Type:** Annual Accounts, Tax Return, etc.
   - **Amount Threshold:** Only apply to amounts over £X
   - **Required Approvers:** 1, 2, or 3 levels
   - **Who Can Approve:** Specify roles or people

4. Click **"Save Rule"**

### Requesting Approval

**Before submitting a document:**

1. Complete the document (e.g., Annual Accounts)
2. Click **"Request Approval"**
3. Select reviewers needed
4. Add optional comment: "Please review ASAP"
5. Click **"Submit for Approval"**

**Impact:**
- Document is locked for editing
- Reviewers get notification
- Can't be submitted to Companies House until approved

### Reviewing Approvals

**As an Approver:**

1. Go to **"Approvals"** dashboard
2. Find your pending item
3. Click **"Review"**
4. Read the document
5. Choose:
   - **Approve:** Document is approved
   - **Request Changes:** Specify what needs fixing
   - **Reject:** Send back with comments

**Timeline:**
- Requests stay open 7 days by default
- Escalate if no response after 3 days
- Can revert approval once (within 24 hours)

### Multi-Step Approvals

Some items need multiple approvals in sequence:

1. **Step 1:** Accountant reviews
2. **Step 2:** Manager approves
3. **Step 3:** Director signs off

Each step waits for the previous to complete.

---

## Document Versioning

### Auto-Save Feature

Every time you save a document, a version is automatically created:
- Timestamp
- Who made changes
- What changed
- Change summary

### Viewing Document History

1. Open any document (e.g., Annual Accounts)
2. Click **"Version History"**
3. See all versions with:
   - Date created
   - Author
   - Changes summary
   - Status (Draft/Approved/Submitted)

### Comparing Versions

1. In Version History
2. Select two versions to compare
3. Click **"Compare"**
4. See side-by-side:
   - What was added (green)
   - What was removed (red)
   - What changed (yellow)

### Reverting to Previous Version

1. Click **"Version History"**
2. Find the version you want
3. Click **"Revert to This Version"**
4. System creates a new version from the old one
5. Current work is preserved in version history

**Note:** Revert creates a new version; it doesn't delete anything. All history is preserved.

### Naming Versions

Make versions meaningful:
- ✅ "v2.0 - Final for Companies House"
- ✅ "Draft 1 - Initial figures"
- ❌ "backup"
- ❌ "new version again"

---

## Document Comments

### Adding Comments to Documents

1. Open document
2. Find the text you want to comment on
3. Highlight it
4. Click **"Add Comment"**
5. Type your comment
6. Click **"Post"**

### Resolving Comments

1. View the comment
2. Respond if needed
3. Click **"Resolve"** when fixed
4. Resolved comments are archived but visible

### Discussion Thread

Comments can have replies:
1. Click **"Reply"** on a comment
2. Type your response
3. Other team members see discussion

---

## Audit Logs

### What Gets Logged?

Every action on important data:
- ✅ Created accounts
- ✅ Updated filing details
- ✅ Changed budget amounts
- ✅ Approved documents
- ✅ Exported reports
- ✅ Added team members

### Viewing the Audit Log

1. Click **"Audit Logs"** in admin dashboard
2. See list of all actions with:
   - **Action:** What happened
   - **User:** Who did it
   - **Date/Time:** When
   - **Table:** What was changed
   - **Details:** Exactly what changed

### Filtering Audit Logs

1. Click **"Filters"**
2. Filter by:
   - Date range
   - User
   - Action type
   - Table/entity

3. Results update automatically

### Exporting Audit Logs

1. Select date range
2. Click **"Export as CSV"**
3. File downloads for analysis or compliance

**Use cases:**
- Compliance audits
- Investigation of changes
- Year-end review
- Sharing with external auditors

---

## Notifications

### Notification Types

1. **Team Invitations:** You've been added to a company
2. **Approval Needed:** Someone needs your approval
3. **Document Updated:** Your attention needed
4. **Budget Alert:** Budget is running out
5. **Bank Reconciliation Reminder:** Time to reconcile
6. **Filing Reminder:** Deadline coming up
7. **System Messages:** Updates, maintenance, etc.

### Notification Methods

- **In-App:** See in Notifications tab
- **Email:** Get sent to your email
- **Dashboard:** Quick stats on home screen

### Managing Notifications

1. Go to **Notifications**
2. Click notification to view
3. Options:
   - **Archive:** Remove from inbox
   - **Mark as Read:** Remove unread indicator
   - **Snooze:** Show again later (tomorrow, next week)

### Notification Preferences

1. Click **"Settings"** → **"Notifications"**
2. Choose what you want to be notified about:
   - [ ] Team changes
   - [ ] Approval requests
   - [ ] Budget alerts
   - [ ] Filing reminders
   - [ ] Document updates

3. Choose delivery method:
   - Email only
   - In-app only
   - Both

---

## Tax Settings

### Configuring Tax Rates

1. Click **"Settings"** → **"Tax Settings"**
2. Set values for your jurisdiction:
   - **VAT Rate:** Usually 20%
   - **Corporation Tax Rate:** Usually 19%
   - **Payroll Tax Rate:** Employer NI usually 8%
   - **Tax Year End:** e.g., 31 March

3. Click **"Save Settings"**

### Using Tax Settings

Tax settings are used to:
- Pre-calculate tax in financial reports
- Generate tax filing summaries
- Create audit trail for tax calculations
- Compare year-over-year tax impact

### Updating Mid-Year

If rates change (tax year change, rate announcement):

1. Update the rate
2. System flags affected documents
3. Recalculate affected amounts
4. Create audit log entry

---

## Reports

### Available Reports

**Financial Reports:**
- Profit & Loss Statement
- Balance Sheet
- Cash Flow Statement
- Budget vs. Actual
- Tax Summary

**Management Reports:**
- Team Activity Report
- Approval Status Report
- Document Lifecycle Report
- Audit Trail Report

### Generating a Report

1. Click **"Reports"** in navigation
2. Select report type
3. Choose parameters:
   - Date range
   - Department/Unit
   - Format (PDF/Excel/CSV)

4. Click **"Generate"**
5. View on-screen or download

### Exporting Reports

All reports can be exported:
- **PDF:** Professional format, ideal for printing
- **Excel:** Edit numbers, create charts
- **CSV:** Import to other systems

### Scheduled Reports

1. Go to **"Reports Settings"**
2. Click **"+ Schedule Report"**
3. Set:
   - Which report
   - Frequency (daily, weekly, monthly)
   - Recipients
   - Delivery method (email, download link)

4. Click **"Schedule"**

---

## FAQ

### Q: I forgot my password. What do I do?
**A:** Click "Forgot Password" on login page. Enter your email. You'll get a password reset link. Link expires in 24 hours.

### Q: Can I have more than one company in my account?
**A:** Yes! Each company is separate. Click "Switch Company" to change. You need admin access to add/remove companies.

### Q: What happens if I remove a team member?
**A:** They immediately lose access. Their documents stay in the system. Audit log shows removal date/time.

### Q: How far back does audit log go?
**A:** All history. Never deleted. Full audit trail from account creation to today.

### Q: Can I export my data?
**A:** Yes! Go to Settings → Export. Choose date range and format. Get all your data in CSV/Excel.

### Q: What if I make a mistake in a submitted filing?
**A:** Create a new version with corrections. Submit amended version to Companies House. Original stays in history marked as superseded.

### Q: Can I undo a rejected approval?
**A:** No, but you can request approval again. The new request starts fresh workflow.

### Q: Who can see deleted documents?
**A:** Only Admins in Audit Log. Deleted documents are marked "deleted" but never actually removed from records (compliance requirement).

### Q: What's the maximum file size for uploads?
**A:** 50MB per file. 100MB total per document.

### Q: If my company has no transactions, can I still file?
**A:** Yes. You still need to file even with zero revenue. Use the "Micro-entity exemption" if applicable.

### Q: How do I contact support?
**A:** Email support@accounts-filing.com or click "Help" in the app. Response typically within 24 hours.

### Q: Is my data encrypted?
**A:** Yes. All data encrypted in transit (HTTPS) and at rest in the database. Passwords use bcrypt with salt.

### Q: Can I batch import transactions?
**A:** Yes! Go to Import → Transaction CSV. Upload file with columns: Date, Description, Amount, Type. Maximum 10,000 per file.

### Q: What happens on 29 Feb? (Leap year)
**A:** The system handles leap years automatically. No action needed.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save document |
| `Ctrl + P` | Print/Export as PDF |
| `Ctrl + F` | Find/Search |
| `Ctrl + Z` | Undo (if editing) |
| `Ctrl + Y` | Redo |
| `/` | Open command search |
| `?` | Show all shortcuts |

---

## Best Practices

### Security
1. ✅ Use strong passwords (12+ characters)
2. ✅ Change password every 90 days
3. ✅ Never share login credentials
4. ✅ Log out on shared computers
5. ✅ Report suspicious activity immediately

### Accuracy
1. ✅ Reconcile bank accounts monthly
2. ✅ Review budget variances weekly
3. ✅ Document all unusual transactions
4. ✅ Use approval workflows for important documents
5. ✅ Keep version history clear with descriptions

### Compliance
1. ✅ Maintain complete audit trail
2. ✅ Submit filings before deadline
3. ✅ Keep approvals signed and dated
4. ✅ Archive old documents properly
5. ✅ Save external documents in system

### Collaboration
1. ✅ Use meaningful names for documents
2. ✅ Add comments instead of changing silently
3. ✅ Assign approvals clearly
4. ✅ Notify team of changes via comments
5. ✅ Use approval workflows for important changes

---

## Getting Help

- **In-app help:** Click ? or Help icon
- **Email support:** support@accounts-filing.com
- **Knowledge base:** https://accounts-filing.com/help
- **Video tutorials:** Available in Help section
- **Contact us:** Phone during business hours 9-5 GMT

---

**Last Updated:** January 2024
**Version:** 2.0
**For support, email: support@accounts-filing.com**

