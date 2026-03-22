const db = require('./config');
const { initDatabase } = require('./migrations');

const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    await initDatabase();
    console.log('Migrations completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
