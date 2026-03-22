const db = require('../database/config');

// In-memory storage for demo mode
const inMemoryStatements = new Map();
let nextStatementId = 1;

class FinancialStatement {
  static async findAll(companyId, limit = 10, offset = 0) {
    if (!db.isConnected()) {
      const statements = Array.from(inMemoryStatements.values())
        .filter(s => s.company_id === companyId)
        .sort((a, b) => new Date(b.period_end_date) - new Date(a.period_end_date))
        .slice(offset, offset + limit);
      return statements;
    }
    const query = `
      SELECT * FROM financial_statements 
      WHERE company_id = $1
      ORDER BY period_end_date DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [companyId, limit, offset]);
    return result.rows;
  }

  static async findById(id) {
    if (!db.isConnected()) {
      const statement = inMemoryStatements.get(id);
      return statement ? { ...statement } : null;
    }
    const query = 'SELECT * FROM financial_statements WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const {
      company_id,
      statement_type,
      period_start_date,
      period_end_date,
      revenue,
      cost_of_goods_sold,
      gross_profit,
      operating_expenses,
      operating_profit,
      total_assets,
      total_liabilities,
      shareholders_equity,
    } = data;

    if (!db.isConnected()) {
      const id = nextStatementId++;
      const newStatement = {
        id,
        company_id,
        statement_type,
        period_start_date,
        period_end_date,
        revenue,
        cost_of_goods_sold,
        gross_profit,
        operating_expenses,
        operating_profit,
        total_assets,
        total_liabilities,
        shareholders_equity,
        created_at: new Date(),
        updated_at: new Date()
      };
      inMemoryStatements.set(id, newStatement);
      return newStatement;
    }

    const query = `
      INSERT INTO financial_statements (
        company_id, statement_type, period_start_date, period_end_date,
        revenue, cost_of_goods_sold, gross_profit, operating_expenses,
        operating_profit, total_assets, total_liabilities, shareholders_equity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const result = await db.query(query, [
      company_id,
      statement_type,
      period_start_date,
      period_end_date,
      revenue,
      cost_of_goods_sold,
      gross_profit,
      operating_expenses,
      operating_profit,
      total_assets,
      total_liabilities,
      shareholders_equity,
    ]);
    return result.rows[0];
  }

  static async update(id, data) {
    if (!db.isConnected()) {
      const statement = inMemoryStatements.get(id);
      if (!statement) return null;
      Object.assign(statement, data, { updated_at: new Date() });
      return statement;
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach((key) => {
      updates.push(`${key} = $${paramCount}`);
      values.push(data[key]);
      paramCount++;
    });

    values.push(id);
    const query = `
      UPDATE financial_statements 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    if (!db.isConnected()) {
      inMemoryStatements.delete(id);
      return;
    }
    const query = 'DELETE FROM financial_statements WHERE id = $1';
    await db.query(query, [id]);
  }
}

module.exports = FinancialStatement;
