const http = require('http');

function apiCall(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function apiCallWithAuth(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 UK Accounts API Test Suite\n');
  console.log('═'.repeat(50));

  try {
    // Test 1: Register
    console.log('\n1️⃣ Testing User Registration...');
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPassword123';
    const regRes = await apiCall('POST', '/auth/register', {
      email: testEmail,
      password: testPassword,
      first_name: 'Test',
      last_name: 'User'
    });
    console.log(`   Status: ${regRes.status}`);
    if (regRes.body.data?.id) {
      console.log(`   ✓ Registration successful - User ID: ${regRes.body.data.id}`);
    } else {
      console.log(`   ✗ Registration failed`);
    }

    // Test 2: Login
    console.log('\n2️⃣ Testing User Login...');
    const loginRes = await apiCall('POST', '/auth/login', {
      email: testEmail,
      password: testPassword
    });
    console.log(`   Status: ${loginRes.status}`);
    const token = loginRes.body.data?.token;
    if (token) {
      console.log(`   ✓ Login successful - Token obtained`);
    } else {
      console.log(`   ✗ Login failed - ${loginRes.body.error || 'No token'}`);
    }

    if (!token) {
      console.log('\n❌ Cannot proceed without token');
      return;
    }

    // Test 3: Create Company
    console.log('\n3️⃣ Testing Company Creation...');
    const coRes = await apiCallWithAuth('POST', '/companies', {
      company_name: 'Test Company Ltd',
      company_number: '12345678',
      business_address: '123 Test Street, London',
      incorporation_date: '2020-01-01'
    }, token);
    console.log(`   Status: ${coRes.status}`);
    const companyId = coRes.body.data?.id;
    if (companyId) {
      console.log(`   ✓ Company created - ID: ${companyId}`);
    } else {
      console.log(`   ✗ Company creation failed`);
    }

    // Test 4: Get Companies
    console.log('\n4️⃣ Testing Get Companies...');
    const listRes = await apiCallWithAuth('GET', '/companies', null, token);
    console.log(`   Status: ${listRes.status}`);
    if (listRes.body.data?.length >= 0) {
      console.log(`   ✓ Companies retrieved - Count: ${listRes.body.data.length}`);
    }

    // Test 5: Create Financial Statement
    if (companyId) {
      console.log('\n5️⃣ Testing Financial Statement Creation...');
      const fsRes = await apiCallWithAuth('POST', '/statements', {
        company_id: companyId,
        statement_type: 'Balance Sheet',
        financial_year: '2025',
        statement_data: {
          assets: 100000,
          liabilities: 50000,
          equity: 50000
        }
      }, token);
      console.log(`   Status: ${fsRes.status}`);
      if (fsRes.body.success) {
        console.log(`   ✓ Financial statement created`);
      } else {
        console.log(`   ✗ Statement creation failed`);
      }
    }

    // Test 6: Create Filing
    if (companyId) {
      console.log('\n6️⃣ Testing Filing Creation...');
      const filingRes = await apiCallWithAuth('POST', '/filings', {
        company_id: companyId,
        filing_type: 'Annual Accounts',
        filing_date: new Date().toISOString().split('T')[0],
        filing_reference: 'TEST-' + Math.random().toString(36).substr(2, 8)
      }, token);
      console.log(`   Status: ${filingRes.status}`);
      if (filingRes.body.success) {
        console.log(`   ✓ Filing created - Ref: ${filingRes.body.data?.filing_reference}`);
      } else {
        console.log(`   ✗ Filing creation failed`);
      }
    }

    console.log('\n' + '═'.repeat(50));
    console.log('\n✅ Test suite completed!\n');

  } catch (err) {
    console.error('Test error:', err.message);
  }

  process.exit(0);
}

runTests();
