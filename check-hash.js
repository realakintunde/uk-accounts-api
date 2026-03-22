const bcrypt = require('bcryptjs');

async function test() {
  const password = 'password123';
  const storedHash = '$2a$10$F9pDMH/rQaFhg.nFRVAy.eXhNxKsVNKV8OiPOu.rsgGH/NcLKcWKu';
  
  console.log('Testing password hash...');
  const matches = await bcrypt.compare(password, storedHash);
  console.log('Password matches stored hash:', matches);
  
  if (!matches) {
    console.log('\nGenerating correct hash for password123...');
    const newHash = await bcrypt.hash(password, 10);
    console.log('Correct hash to use in User.js:');
    console.log(newHash);
  }
}

test();
