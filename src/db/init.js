import pool from './pool.js';

export async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Create extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        company_number VARCHAR(8) UNIQUE NOT NULL,
        business_address TEXT,
        incorporation_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Filings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS filings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        filing_type VARCHAR(100),
        filing_date DATE,
        filing_reference VARCHAR(50),
        status VARCHAR(50) DEFAULT 'draft',
        financial_year_end DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Company details table
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        filing_id UUID REFERENCES filings(id) ON DELETE CASCADE,
        company_type VARCHAR(100),
        registered_address TEXT,
        financial_year_end DATE,
        director_name VARCHAR(255),
        director_dob DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Balance sheet items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS balance_sheet_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filing_id UUID NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
        description VARCHAR(255),
        amount NUMERIC(15,2),
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // P&L items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS profit_loss_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filing_id UUID NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
        description VARCHAR(255),
        amount NUMERIC(15,2),
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Cash flow items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cashflow_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filing_id UUID NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
        description VARCHAR(255),
        amount NUMERIC(15,2),
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Notes to accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes_to_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filing_id UUID NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
        basis_of_preparation TEXT,
        going_concern TEXT,
        revenue_recognition TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Directors report table
    await client.query(`
      CREATE TABLE IF NOT EXISTS directors_report (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filing_id UUID NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
        principal_activities TEXT,
        review_of_year TEXT,
        approval_confirmed BOOLEAN DEFAULT FALSE,
        signed_by VARCHAR(255),
        signed_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_filings_company_id ON filings(company_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_filings_user_id ON filings(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_balance_sheet_filing ON balance_sheet_items(filing_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_profit_loss_filing ON profit_loss_items(filing_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_cashflow_filing ON cashflow_items(filing_id)');
    
    console.log('[DB] Schema initialized successfully');
  } catch (err) {
    // Table already exists errors are okay
    if (!err.message.includes('already exists')) {
      throw err;
    }
  } finally {
    client.release();
  }
}

export default pool;
