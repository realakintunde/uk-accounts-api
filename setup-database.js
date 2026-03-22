#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

/**
 * PostgreSQL Database Setup Script
 * This script creates the database and all required tables
 * 
 * Usage: node setup-database.js
 * 
 * Prerequisites:
 * 1. PostgreSQL installed and running
 * 2. psql command accessible from terminal
 * 3. Create a .env file with database credentials (or use defaults)
 */

require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'uk_accounts_db'
};

async function setupDatabase() {
  console.log('🗄️  UK Accounts Database Setup\n');
  console.log('═'.repeat(50));

  try {
    // Step 1: Connect to postgres (default DB) to create new database
    console.log('\n1️⃣  Connecting to PostgreSQL...');
    const adminPool = new Pool({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      database: 'postgres' // Default database
    });

    // Check if database exists
    console.log('   Checking if database exists...');
    const existsResult = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_CONFIG.database]
    );

    if (existsResult.rows.length === 0) {
      console.log(`   Database "${DB_CONFIG.database}" not found. Creating...`);
      await adminPool.query(`CREATE DATABASE ${DB_CONFIG.database}`);
      console.log(`   ✅ Database created: ${DB_CONFIG.database}`);
    } else {
      console.log(`   ✅ Database exists: ${DB_CONFIG.database}`);
    }

    await adminPool.end();

    // Step 2: Connect to new database and create tables
    console.log('\n2️⃣  Creating tables...');
    const appPool = new Pool({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      database: DB_CONFIG.database
    });

    const migrations = [
      {
        name: 'users',
        sql: `
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
          )
        `
      },
      {
        name: 'companies',
        sql: `
          CREATE TABLE IF NOT EXISTS companies (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            company_number VARCHAR(8) UNIQUE NOT NULL,
            company_name VARCHAR(255) NOT NULL,
            business_address VARCHAR(500),
            registered_office VARCHAR(500),
            industry_classification VARCHAR(100),
            incorporation_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'financial_statements',
        sql: `
          CREATE TABLE IF NOT EXISTS financial_statements (
            id SERIAL PRIMARY KEY,
            company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            statement_type VARCHAR(50) NOT NULL,
            period_start_date DATE,
            period_end_date DATE,
            revenue DECIMAL(15,2),
            cost_of_goods_sold DECIMAL(15,2),
            gross_profit DECIMAL(15,2),
            operating_expenses DECIMAL(15,2),
            operating_profit DECIMAL(15,2),
            total_assets DECIMAL(15,2),
            total_liabilities DECIMAL(15,2),
            shareholders_equity DECIMAL(15,2),
            statement_data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'filings',
        sql: `
          CREATE TABLE IF NOT EXISTS filings (
            id SERIAL PRIMARY KEY,
            company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            filing_type VARCHAR(50) NOT NULL,
            filing_date DATE,
            filing_reference VARCHAR(50) UNIQUE,
            submitted_by INTEGER REFERENCES users(id),
            filing_status VARCHAR(50) DEFAULT 'draft',
            filing_data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'documents',
        sql: `
          CREATE TABLE IF NOT EXISTS documents (
            id SERIAL PRIMARY KEY,
            company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            document_type VARCHAR(50),
            file_name VARCHAR(255),
            file_path VARCHAR(500),
            file_size INTEGER,
            mime_type VARCHAR(100),
            uploaded_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'audit_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            action VARCHAR(100),
            resource_type VARCHAR(50),
            resource_id INTEGER,
            changes JSONB,
            ip_address VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
    ];

    for (const migration of migrations) {
      try {
        await appPool.query(migration.sql);
        console.log(`   ✅ Table created: ${migration.name}`);
      } catch (err) {
        if (err.code === '42P07') {
          console.log(`   ℹ️  Table exists: ${migration.name}`);
        } else {
          throw err;
        }
      }
    }

    // Step 3: Create indexes
    console.log('\n3️⃣  Creating indexes...');
    const indexes = [
      { name: 'idx_users_email', sql: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)' },
      { name: 'idx_companies_user_id', sql: 'CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id)' },
      { name: 'idx_statements_company_id', sql: 'CREATE INDEX IF NOT EXISTS idx_statements_company_id ON financial_statements(company_id)' },
      { name: 'idx_filings_company_id', sql: 'CREATE INDEX IF NOT EXISTS idx_filings_company_id ON filings(company_id)' },
      { name: 'idx_documents_company_id', sql: 'CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id)' }
    ];

    for (const index of indexes) {
      await appPool.query(index.sql);
      console.log(`   ✅ Index created: ${index.name}`);
    }

    // Step 4: Database is ready for user registration
    console.log('\n4️⃣  Database ready for user registration...');
    console.log('   ℹ️  No demo users loaded. Users must register to create accounts.');

    await appPool.end();

    console.log('\n' + '═'.repeat(50));
    console.log('\n✅ Database setup complete!\n');
    console.log('📊 Connection Details:');
    console.log(`   Host: ${DB_CONFIG.host}`);
    console.log(`   Port: ${DB_CONFIG.port}`);
    console.log(`   Database: ${DB_CONFIG.database}`);
    console.log(`   User: ${DB_CONFIG.user}`);
    console.log('\n🚀 Ready to use! Start the server with: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  PostgreSQL is not running!');
      console.error('\nTo fix:');
      console.error('1. Install PostgreSQL from: https://www.postgresql.org/download/');
      console.error('2. Start the PostgreSQL service');
      console.error('3. Run this script again');
    } else if (error.code === '28P01') {
      console.error('\n⚠️  Authentication failed!');
      console.error('\nTo fix:');
      console.error('1. Check your database password in .env or environment variables');
      console.error('2. Default password: "postgres"');
      console.error('3. Try: npm run setup-db');
    }
    
    process.exit(1);
  }
}

// Run setup
setupDatabase();
