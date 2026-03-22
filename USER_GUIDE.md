# 📘 User Guide - UK Annual Accounts Filing System

## ✨ Quick Start (5 minutes)

### Step 1: Open the App
```
http://localhost:3000
```

### Step 2: Create Account
1. Click **"Create Account"** tab
2. Enter your name, email, password
3. Click **"Create Account →"**

### Step 3: Log In
1. Enter your email and password
2. Click **"Sign In →"**

### Step 4: Add a Company
1. Click **"Companies"** in the sidebar
2. Click **"+ Add Company"** button
3. Fill in the form:
   - **Company Name**: Legal registered name
   - **CRN**: 8-digit Companies House number
   - **FYE**: Financial Year End date
   - **Address**: Registered office address
4. Click **"Add"**

### Step 5: Start Filing
1. Click the company you just created from the list
2. Click **"Company Details"** in the sidebar
3. Follow each section to completion

---

## 📋 Complete Step-by-Step Guide

### Section 1: Company Details

**What to enter:**
- Company Name (must match Companies House register)
- CRN (8-digit number from Companies House)
- Registered Address (exact address from CH register)
- Company Type (dropdown selection)
- Financial Year End (date your accounts year ends)
- Director Name and Date of Birth

**Tips:**
- Use exact legal name (including Ltd, PLC, etc)
- Check Companies House website for accurate CRN
- Make sure address matches the registered office
- Keep director details up to date

**Next:** Click "Continue →" to proceed

---

### Section 2: Balance Sheet

**What is it?**
Statement showing what the company owns and owes at year-end

**Fields to complete:**

**ASSETS** (Things the company owns):
- Cash at Bank
- Trade Debtors (customers who owe you money)
- Stock (goods inventory)
- Plant & Equipment (machinery, vehicles, etc)

**LIABILITIES & EQUITY** (Money owed + owner's funds):
- Trade Creditors (suppliers you owe money to)
- Bank Loans (borrowing from banks)
- Share Capital (money invested by shareholders)
- Retained Earnings (profits kept in the business)

**Formula to balance:**
```
Total Assets = Total Liabilities + Total Equity
```

**System automatically calculates:**
- ✓ Total Assets
- ✓ Total Liabilities & Equity
- ✓ Balance check (will warn if they don't match)

**Example:**
```
Assets: £100,000
- Cash: £30,000
- Stock: £50,000
- Equipment: £20,000 ✓ = £100,000

Liabilities & Equity: £100,000
- Bank Loan: £40,000
- Share Capital: £50,000
- Retained Earnings: £10,000 ✓ = £100,000

Balance: ✓ CORRECT
```

**Tips:**
- Be accurate with amounts (even small errors prevent filing)
- Round to nearest £1
- Include all assets and liabilities
- Ensure balance sheet balances before moving on

**Next:** Click "Continue →" to P&L Account

---

### Section 3: Profit & Loss Account

**What is it?**
Statement showing the company's income and expenses during the year

**Fields to complete:**

**REVENUE:**
- Turnover (total sales/income for the year)

**COSTS:**
- Cost of Sales (direct costs to make products/services)

**PROFIT CALCULATIONS** (Automatic):
- Gross Profit = Turnover - Cost of Sales

**EXPENSES:**
- Operating Expenses (staff, rent, utilities, etc)

**MORE CALCULATIONS** (Automatic):
- Operating Profit = Gross Profit - Operating Expenses
- Tax = Corporation tax for the year
- Net Profit = Operating Profit - Tax

**Example:**
```
Turnover:                    £500,000
Cost of Sales:              -£200,000
─────────────────────────────────────
Gross Profit:               £300,000

Operating Expenses:         -£150,000
─────────────────────────────────────
Operating Profit:           £150,000

Tax:                        -£22,500
─────────────────────────────────────
Net Profit (Bottom Line):   £127,500
```

**Tips:**
- Match figures to your accounting records
- Include ALL operating expenses
- Turnover should match sales records
- Tax should match tax return calculation

**Next:** Click "Continue →" to Cash Flow

---

### Section 4: Cash Flow Statement

**What is it?**
Shows actual cash movement - different from profit (e.g., if you invoice customers, you record a sale but don't get cash immediately)

**Fields to complete:**

**OPERATING ACTIVITIES:**
- Profit from Operations (from P&L)

**INVESTING ACTIVITIES:**
- Capital Expenditure (buying assets like equipment)

**FINANCING ACTIVITIES:**
- New Borrowing (additional loans taken)

**SYSTEM CALCULATES:**
- Net Cash Movement (total change in cash balance)

**Example:**
```
Profit from Operations:      £150,000
Capital Expenditure:        -£50,000
New Borrowing:             +£30,000
─────────────────────────────────────
Net Cash Movement:          £130,000
```

**Tips:**
- Use actual cash figures, not accruals
- Include all investments in fixed assets
- Include loan repayments as negative
- Match opening and closing cash positions

**Next:** Click "Continue →" to Notes

---

### Section 5: Notes to Accounts

**What is it?**
Detailed explanations and policies that support the financial statements

**Fields to complete:**

1. **Basis of Preparation**
   - Explain accounting framework used (FRS 102)
   - Note any significant accounting policies
   - Example: "These accounts prepared under FRS 102, the small companies regime..."

2. **Going Concern**
   - Confirm the company will continue operating
   - Note any risks or issues
   - Example: "The directors are confident the company is a going concern..."

3. **Revenue Recognition**
   - Explain how you recognize sales
   - Mention invoice timing
   - Example: "Revenue recognized when invoice issued..."

**Common Notes** (often required):
- Depreciation policies (how quickly assets written off)
- Staff costs (salaries, pensions, PAYE)
- Related party transactions (if any)
- Post-balance sheet events (major changes after year-end)

**Tips:**
- Be clear and concise
- Explain any unusual items in the statements
- Disclose related party transactions
- Note any pending legal cases
- Mention significant contracts

**Next:** Click "Continue →" to Directors

---

### Section 6: Directors' Report

**What is it?**
Management report confirming the accounts are true and fair

**Fields to complete:**

1. **Principal Activities**
   - What does the company do?
   - Main products/services
   - Key markets
   - Example: "The company manufactures office furniture..."

2. **Review of Year**
   - Key performance and results
   - Market conditions
   - Challenges and opportunities
   - Plans for future
   - Example: "Sales increased 15% despite market challenges. We expanded into Europe..."

3. **Approval Checkbox**
   - Confirm accounts are true and fair
   - ✓ Must tick this

4. **Signature Details**
   - Director name (who is signing off)
   - Date signed

**Tips:**
- Be factual and realistic
- Mention any major changes
- Note market challenges
- Highlight achievements
- Forward-looking but realistic

**Legal requirement**: Must be signed by at least one director

**Next:** Click "Continue →" to Export

---

### Section 7: Export & Generate

**What this does:**
Generate documents for submission and backup

**Available options:**

1. **📄 PDF Report**
   - Full accounts in PDF format
   - Ready to print and archive
   - Professional formatting
   - Use for: Records, sharing, printing

2. **⚙️ JSON Export**
   - Data in structured format
   - Use for: Backup, data analysis, importing elsewhere

**How to use:**
- Click the format you want
- File automatically downloads
- Save to your computer
- Keep copies for your records

**Tips:**
- Generate PDF for records
- Keep JSON backup
- Save with filename: `Company Name_FY2025_Export.pdf`
- Store in secure location

**Next:** Click "Continue →" to Submit

---

### Section 8: Review & Submit

**What this does:**
Final checks before filing with Companies House

**Pre-filing checklist:**
✓ Company details entered
✓ Balance Sheet balanced
✓ P&L completed
✓ Cash Flow filled
✓ Notes added
✓ Directors approved
✓ Exports generated

**To submit:**

1. **Enter Auth Code**
   - 6-character code from Companies House
   - Sent when company registered
   - Used to authorize filing

2. **Confirm & Submit**
   - Check the confirmation box
   - Click "🚀 Submit to Companies House"

3. **Confirmation**
   - You'll see filing reference
   - Accounts submitted successfully
   - Keep reference number for records

**What happens next:**
- Accounts sent to Companies House
- You'll receive confirmation email
- Processing takes 2-4 weeks
- Accounts become public record

**Tips:**
- Keep filing reference safe
- Request confirmation receipts
- Double-check all data before submitting
- Don't edit data after submission (create amended filing if needed)

---

## ⚙️ Account Settings

### Update Your Profile
1. Click your avatar (top-right corner)
2. Click "Account Settings"
3. Update your details
4. Click "Save Changes"

### Sign Out
- Click "Sign Out" button
- You'll be logged out and returned to login screen
- Your data is safe

---

## 💾 Data & Backup

### Where is my data saved?
- **During session:** In-memory (local)
- **With database:** PostgreSQL server

### How to backup?
1. Go to "Export" section
2. Click "JSON Export"
3. Save file to your computer
4. Keep in safe location

### Data loss prevention
- ✓ Save periodically using "Save Draft" button
- ✓ Export as JSON backup
- ✓ Don't rely only on in-memory storage
- ✓ Set up database for production use

---

## 🆘 Troubleshooting

### "Balance sheet doesn't balance"
**Solution:** 
- Check Total Assets = Total Liabilities + Equity
- Add/subtract amounts until they match
- Most common issue: Missing a liability or asset

### "Can't log in"
**Solution:**
- Check email spelling
- Reset password or create new account
- Clear browser cache (Ctrl+Shift+Delete)

### "The server isn't responding"
**Solution:**
```bash
# Restart the server
cd C:\Users\reala\uk-accounts-api
npm run dev
```

### "My data disappeared"
**Prevention:**
- Use "Save Draft" button in each section
- Export to JSON as backup
- Set up PostgreSQL for persistent storage

### "PDF export isn't working"
**Solution:**
- Currently exports as text file
- Full PDF export coming soon
- Use JSON export for backup
- Print from browser (Ctrl+P)

---

## 📊 Example Filings

### Small Company (Turnover £2m, 5 staff)
```
Balance Sheet:
- Cash: £50,000
- Debtors: £200,000
- Stock: £150,000
- Equipment: £100,000
Total Assets: £500,000

- Creditors: £150,000
- Bank Loan: £100,000
- Share Capital: £200,000
- Retained Earnings: £50,000
Total Liabilities & Equity: £500,000

P&L:
- Revenue: £2,000,000
- Cost of Sales: £1,000,000
- Gross Profit: £1,000,000
- Operating Expenses: £800,000
- Operating Profit: £200,000
- Tax: £30,000
- Net Profit: £170,000
```

### Medium Company (Turnover £10m, 50 staff)
```
[Similar structure but larger amounts]

Key notes:
- Staff costs: ~£2m (salary, pension, insurance)
- Depreciation: ~£50,000 (office, equipment)
- Related party: None
- Going concern: Confirmed
- Post-balance events: None
```

---

## 📞 When to File

**Small Companies:**
- 9 months from year-end

**Medium Companies:**
- 9 months from year-end

**Large Companies/PLCs:**
- 4-6 months from year-end

**Late Filing Penalties:**
- 1-3 months late: £150
- 3-6 months late: £375
- 6+ months late: £1,500+

---

## 🔒 Data Privacy

### Your Information is:
✓ Securely stored
✓ Protected by passwords
✓ Never shared without consent
✓ Kept confidential

### Public Information:
✗ Your accounts will be filed with Companies House
✗ They become public record
✗ Anyone can view them online
✗ This is a legal requirement

---

## 💡 Tips & Tricks

### Keyboard Shortcuts
- `Tab` - Move to next field
- `Shift+Tab` - Move to previous field
- `Enter` - Submit form

### Data Entry
- Round to nearest £1
- No thousand separators needed
- Fields calculate automatically
- Check calculations as you go

### Common Mistakes to Avoid
- ✗ Balance sheet not balancing
- ✗ Wrong company number
- ✗ Missing director details
- ✗ Inconsistent figures between statements
- ✗ Filing after deadline
- ✗ Typos in company name

### Best Practices
- ✓ Complete sections in order
- ✓ Save frequently
- ✓ Review before submitting
- ✓ Keep backup exports
- ✓ File early, not at deadline
- ✓ Check all amounts match your records

---

## 📞 Support & Help

### Report Issues
- Check troubleshooting above
- Restart browser and server
- Clear browser cache
- Contact support with error messages

### Learn More
- See COMPLETE_GUIDE.md for technical details
- See ENHANCEMENT_ROADMAP.md for coming features
- Read code comments in /src folder

### Companies House Help
- Website: gov.uk/companies-house
- Filing guidance: gov.uk/guidance/file-your-accounts
- Phone: (029) 2034 3600

---

## ✅ Checklist for Filing

Before clicking Submit:

- [ ] Company name matches Companies House register
- [ ] CRN is correct (8 digits)
- [ ] Financial year end is accurate
- [ ] All director details entered
- [ ] Balance sheet balances
- [ ] P&L completed with all figures
- [ ] Cash flow completed
- [ ] Accounting notes included
- [ ] Directors report completed
- [ ] All sections marked complete (green checkmarks)
- [ ] PDF exported and saved
- [ ] JSON backup exported
- [ ] Auth code available
- [ ] Confirmation checked
- [ ] Director ready to approve

---

## 🎉 After Filing

**What to do next:**
1. Save filing reference number
2. Print/save confirmation
3. Export accounts as records
4. Notify auditors/accountants
5. Update company records
6. Plan for next year filing

**Timeline:**
- Submitted: Today
- Processing: 2-4 weeks
- Online: Available on Companies House website
- Public record: Permanently available

---

*Last updated: March 22, 2026*
*System Status: ✅ OPERATIONAL*

Questions? See the technical guides or contact support.
