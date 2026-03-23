const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const FinancialFeatures = require('../models/FinancialFeatures');
const AuditLog = require('../models/AuditLog');

// BUDGET ROUTES

// Create budget
router.post('/:companyId/budgets', authenticateToken, async (req, res) => {
  try {
    const { name, fiscalYear, totalBudget, items } = req.body;
    const budget = await FinancialFeatures.createBudget(
      req.params.companyId,
      name,
      fiscalYear,
      totalBudget,
      req.user.id
    );

    // Add budget items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await FinancialFeatures.addBudgetItem(budget.id, item.category, item.amount);
      }
    }

    await AuditLog.log(
      req.params.companyId,
      req.user.id,
      'budget_created',
      'budgets',
      budget.id,
      null,
      budget,
      req.ip,
      req.get('user-agent')
    );

    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get budgets
router.get('/:companyId/budgets', authenticateToken, async (req, res) => {
  try {
    const { fiscalYear } = req.query;
    const budgets = await FinancialFeatures.getBudgets(req.params.companyId, fiscalYear);
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get budget items
router.get('/:companyId/budgets/:budgetId/items', authenticateToken, async (req, res) => {
  try {
    const items = await FinancialFeatures.getBudgetItems(req.params.budgetId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BANK RECONCILIATION ROUTES

// Create bank account
router.post('/:companyId/bank-accounts', authenticateToken, async (req, res) => {
  try {
    const { accountName, accountNumber, sortCode, bankName, currencyId } = req.body;
    const account = await FinancialFeatures.createBankAccount(
      req.params.companyId,
      accountName,
      accountNumber,
      sortCode,
      bankName,
      currencyId
    );

    await AuditLog.log(
      req.params.companyId,
      req.user.id,
      'bank_account_created',
      'bank_accounts',
      account.id,
      null,
      account,
      req.ip,
      req.get('user-agent')
    );

    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bank accounts
router.get('/:companyId/bank-accounts', authenticateToken, async (req, res) => {
  try {
    const accounts = await FinancialFeatures.getBankAccounts(req.params.companyId);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import bank transaction
router.post('/:companyId/bank-transactions', authenticateToken, async (req, res) => {
  try {
    const { bankAccountId, transactionDate, reference, description, amount, type } = req.body;
    const transaction = await FinancialFeatures.importBankTransaction(
      bankAccountId,
      transactionDate,
      reference,
      description,
      amount,
      type
    );

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bank transactions
router.get('/:companyId/bank-accounts/:accountId/transactions', authenticateToken, async (req, res) => {
  try {
    const { reconciled } = req.query;
    const reconciledFilter = reconciled ? reconciled === 'true' : null;
    const transactions = await FinancialFeatures.getBankTransactions(req.params.accountId, reconciledFilter);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reconcile transaction
router.put('/:companyId/bank-transactions/:transactionId/reconcile', authenticateToken, async (req, res) => {
  try {
    const transaction = await FinancialFeatures.reconcileTransaction(req.params.transactionId);

    await AuditLog.log(
      req.params.companyId,
      req.user.id,
      'transaction_reconciled',
      'bank_transactions',
      transaction.id,
      { reconciled: false },
      transaction,
      req.ip,
      req.get('user-agent')
    );

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RECURRING ENTRIES

// Create recurring entry
router.post('/:companyId/recurring-entries', authenticateToken, async (req, res) => {
  try {
    const { description, amount, category, frequency, startDate, endDate } = req.body;
    const entry = await FinancialFeatures.createRecurringEntry(
      req.params.companyId,
      description,
      amount,
      category,
      frequency,
      startDate,
      endDate,
      req.user.id
    );

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recurring entries
router.get('/:companyId/recurring-entries', authenticateToken, async (req, res) => {
  try {
    const entries = await FinancialFeatures.getRecurringEntries(req.params.companyId);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TAX SETTINGS

// Set tax settings
router.post('/:companyId/tax-settings', authenticateToken, async (req, res) => {
  try {
    const { taxYearEnd, vatRate, corporationTaxRate, payrollTaxRate, nextTaxReturn } = req.body;
    const settings = await FinancialFeatures.setTaxSettings(
      req.params.companyId,
      taxYearEnd,
      vatRate,
      corporationTaxRate,
      payrollTaxRate,
      nextTaxReturn
    );

    await AuditLog.log(
      req.params.companyId,
      req.user.id,
      'tax_settings_updated',
      'tax_settings',
      settings.id,
      null,
      settings,
      req.ip,
      req.get('user-agent')
    );

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tax settings
router.get('/:companyId/tax-settings', authenticateToken, async (req, res) => {
  try {
    const settings = await FinancialFeatures.getTaxSettings(req.params.companyId);
    res.json(settings || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
