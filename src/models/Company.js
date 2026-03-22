const db = require('../database/config');

// In-memory storage for demo mode
const inMemoryCompanies = new Map();
let nextCompanyId = 1;

class Company {
  static async findAll(limit = 10, offset = 0) {
    if (!db.isConnected()) {
      const companies = Array.from(inMemoryCompanies.values())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(offset, offset + limit);
      return companies;
    }
    const query = `
      SELECT * FROM companies 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  static async findById(id) {
    if (!db.isConnected()) {
      const company = inMemoryCompanies.get(id);
      return company ? { ...company } : null;
    }
    const query = 'SELECT * FROM companies WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByCompanyNumber(companyNumber) {
    if (!db.isConnected()) {
      const company = Array.from(inMemoryCompanies.values()).find(c => c.company_number === companyNumber);
      return company ? { ...company } : null;
    }
    const query = 'SELECT * FROM companies WHERE company_number = $1';
    const result = await db.query(query, [companyNumber]);
    return result.rows[0];
  }

  static async create(data) {
    const {
      company_number,
      company_name,
      business_address,
      registered_office,
      industry_classification,
      incorporation_date,
    } = data;

    if (!db.isConnected()) {
      const id = nextCompanyId++;
      const newCompany = {
        id,
        company_number,
        company_name,
        business_address,
        registered_office,
        industry_classification,
        incorporation_date,
        created_at: new Date(),
        updated_at: new Date()
      };
      inMemoryCompanies.set(id, newCompany);
      return newCompany;
    }

    const query = `
      INSERT INTO companies (
        company_number, company_name, business_address, 
        registered_office, industry_classification, incorporation_date
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await db.query(query, [
      company_number,
      company_name,
      business_address,
      registered_office,
      industry_classification,
      incorporation_date,
    ]);
    return result.rows[0];
  }

  static async update(id, data) {
    if (!db.isConnected()) {
      const company = inMemoryCompanies.get(id);
      if (!company) return null;
      Object.assign(company, data, { updated_at: new Date() });
      return company;
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
      UPDATE companies 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    if (!db.isConnected()) {
      inMemoryCompanies.delete(id);
      return;
    }
    const query = 'DELETE FROM companies WHERE id = $1';
    await db.query(query, [id]);
  }
}

module.exports = Company;
