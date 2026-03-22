const db = require('../database/config');

// In-memory storage for demo mode
const inMemoryFilings = new Map();
let nextFilingId = 1;

class Filing {
  static async findAll(companyId, limit = 10, offset = 0) {
    if (!db.isConnected()) {
      const filings = Array.from(inMemoryFilings.values())
        .filter(f => f.company_id === companyId)
        .sort((a, b) => new Date(b.filing_date) - new Date(a.filing_date))
        .slice(offset, offset + limit);
      return filings;
    }
    const query = `
      SELECT * FROM filings 
      WHERE company_id = $1
      ORDER BY filing_date DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [companyId, limit, offset]);
    return result.rows;
  }

  static async findById(id) {
    if (!db.isConnected()) {
      const filing = inMemoryFilings.get(id);
      return filing ? { ...filing } : null;
    }
    const query = 'SELECT * FROM filings WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const {
      company_id,
      filing_type,
      filing_date,
      filing_reference,
      submitted_by,
      filing_data,
    } = data;

    if (!db.isConnected()) {
      const id = nextFilingId++;
      const newFiling = {
        id,
        company_id,
        filing_type,
        filing_date,
        filing_reference,
        submitted_by,
        filing_data,
        created_at: new Date(),
        updated_at: new Date()
      };
      inMemoryFilings.set(id, newFiling);
      return newFiling;
    }

    const query = `
      INSERT INTO filings (
        company_id, filing_type, filing_date, filing_reference,
        submitted_by, filing_data
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await db.query(query, [
      company_id,
      filing_type,
      filing_date,
      filing_reference,
      submitted_by,
      filing_data,
    ]);
    return result.rows[0];
  }

  static async update(id, data) {
    if (!db.isConnected()) {
      const filing = inMemoryFilings.get(id);
      if (!filing) return null;
      Object.assign(filing, data, { updated_at: new Date() });
      return filing;
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
      UPDATE filings 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    if (!db.isConnected()) {
      inMemoryFilings.delete(id);
      return;
    }
    const query = 'DELETE FROM filings WHERE id = $1';
    await db.query(query, [id]);
  }
}

module.exports = Filing;
