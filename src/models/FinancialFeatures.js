// Financial Features Model
const { query } = require('../database/config');

class FinancialFeatures {
  // BUDGETS
  static async createBudget(companyId, name, fiscalYear, totalBudget, createdBy) {
    const result = await query(
      `INSERT INTO budgets (company_id, name, fiscal_year, total_budget, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [companyId, name, fiscalYear, totalBudget, createdBy]
    );
    return result.rows[0];
  }

  static async getBudgets(companyId, fiscalYear = null) {
    let sql = `SELECT * FROM budgets WHERE company_id = $1`;
    const params = [companyId];
    
    if (fiscalYear) {
      sql += ` AND fiscal_year = $2`;
      params.push(fiscalYear);
    }
    
    sql += ` ORDER BY fiscal_year DESC`;
    const result = await query(sql, params);
    return result.rows;
  }

  static async addBudgetItem(budgetId, category, budgetedAmount) {
    const result = await query(
      `INSERT INTO budget_items (budget_id, category, budgeted_amount)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [budgetId, category, budgetedAmount]
    );
    return result.rows[0];
  }

  static async getBudgetItems(budgetId) {
    const result = await query(
      `SELECT * FROM budget_items WHERE budget_id = $1`,
      [budgetId]
    );
    return result.rows;
  }

  // BANK RECONCILIATION
  static async createBankAccount(companyId, accountName, accountNumber, sortCode, bankName, currencyId) {
    const result = await query(
      `INSERT INTO bank_accounts (company_id, account_name, account_number, sort_code, bank_name, currency_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [companyId, accountName, accountNumber, sortCode, bankName, currencyId]
    );
    return result.rows[0];
  }

  static async getBankAccounts(companyId) {
    const result = await query(
      `SELECT ba.*, c.code as currency_code FROM bank_accounts ba
       LEFT JOIN currencies c ON ba.currency_id = c.id
       WHERE ba.company_id = $1`,
      [companyId]
    );
    return result.rows;
  }

  static async importBankTransaction(bankAccountId, transactionDate, reference, description, amount, type) {
    const result = await query(
      `INSERT INTO bank_transactions (bank_account_id, transaction_date, reference, description, amount, type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [bankAccountId, transactionDate, reference, description, amount, type]
    );
    return result.rows[0];
  }

  static async getBankTransactions(bankAccountId, reconciled = null) {
    let sql = `SELECT * FROM bank_transactions WHERE bank_account_id = $1`;
    const params = [bankAccountId];
    
    if (reconciled !== null) {
      sql += ` AND reconciled = $2`;
      params.push(reconciled);
    }
    
    sql += ` ORDER BY transaction_date DESC`;
    const result = await query(sql, params);
    return result.rows;
  }

  static async reconcileTransaction(transactionId) {
    const result = await query(
      `UPDATE bank_transactions SET reconciled = TRUE
       WHERE id = $1
       RETURNING *`,
      [transactionId]
    );
    return result.rows[0];
  }

  // RECURRING ENTRIES
  static async createRecurringEntry(companyId, description, amount, category, frequency, startDate, endDate, createdBy) {
    const nextDate = this._calculateNextDate(startDate, frequency);
    const result = await query(
      `INSERT INTO recurring_entries (company_id, description, amount, category, frequency, start_date, end_date, next_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [companyId, description, amount, category, frequency, startDate, endDate, nextDate, createdBy]
    );
    return result.rows[0];
  }

  static async getRecurringEntries(companyId) {
    const result = await query(
      `SELECT * FROM recurring_entries WHERE company_id = $1 AND (end_date IS NULL OR end_date > NOW())`,
      [companyId]
    );
    return result.rows;
  }

  // TAX SETTINGS
  static async setTaxSettings(companyId, taxYearEnd, vatRate, corporationTaxRate, payrollTaxRate, nextTaxReturn) {
    const result = await query(
      `INSERT INTO tax_settings (company_id, tax_year_end, vat_rate, corporation_tax_rate, payroll_tax_rate, next_tax_return)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (company_id) DO UPDATE SET
         tax_year_end = $2, vat_rate = $3, corporation_tax_rate = $4, payroll_tax_rate = $5, next_tax_return = $6, updated_at = NOW()
       RETURNING *`,
      [companyId, taxYearEnd, vatRate, corporationTaxRate, payrollTaxRate, nextTaxReturn]
    );
    return result.rows[0];
  }

  static async getTaxSettings(companyId) {
    const result = await query(
      `SELECT * FROM tax_settings WHERE company_id = $1`,
      [companyId]
    );
    return result.rows[0];
  }

  static _calculateNextDate(startDate, frequency) {
    const date = new Date(startDate);
    switch (frequency) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'annually':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date.toISOString().split('T')[0];
  }
}

module.exports = FinancialFeatures;
