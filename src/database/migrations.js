const db = require('../database/config');

const initDatabase = async () => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'user',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        company_number VARCHAR(8) UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        business_address TEXT,
        registered_office TEXT,
        industry_classification VARCHAR(100),
        incorporation_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        accounts_filing_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Financial Statements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_statements (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id),
        statement_type VARCHAR(50) NOT NULL,
        period_start_date DATE NOT NULL,
        period_end_date DATE NOT NULL,
        revenue DECIMAL(15, 2),
        cost_of_goods_sold DECIMAL(15, 2),
        gross_profit DECIMAL(15, 2),
        operating_expenses DECIMAL(15, 2),
        operating_profit DECIMAL(15, 2),
        total_assets DECIMAL(15, 2),
        total_liabilities DECIMAL(15, 2),
        shareholders_equity DECIMAL(15, 2),
        filed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id),
        document_type VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500),
        file_size INTEGER,
        mime_type VARCHAR(100),
        uploaded_by INTEGER REFERENCES users(id),
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Filings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS filings (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id),
        filing_type VARCHAR(100) NOT NULL,
        filing_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        filing_reference VARCHAR(255),
        submitted_by INTEGER REFERENCES users(id),
        submitted_date TIMESTAMP,
        filing_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Audit Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        changes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_company_number ON companies(company_number);
      CREATE INDEX IF NOT EXISTS idx_financial_statements_company_id ON financial_statements(company_id);
      CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
      CREATE INDEX IF NOT EXISTS idx_filings_company_id ON filings(company_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    `);

    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { initDatabase };
