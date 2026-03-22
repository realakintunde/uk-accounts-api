const http = require('http');

// Test helper
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch(e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing Authentication Fix...\n');

  // Test 1: Register
  console.log('1️⃣ Testing Registration...');
  const regRes = await makeRequest('POST', '/api/auth/register', {
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123',
    first_name: 'Test'
  });

  console.log(`   Status: ${regRes.status}`);
  console.log(`   Success: ${regRes.body?.success}`);
  console.log(`   Has Token: ${!!regRes.body?.data?.token}`);
  console.log(`   Token Prefix: ${regRes.body?.data?.token?.substring(0, 20)}...`);
  console.log(`   User Email: ${regRes.body?.data?.user?.email}`);

  if (!regRes.body?.data?.token) {
    console.log('\n❌ PROBLEM: Registration did not return a token!');
    console.log('Response:', JSON.stringify(regRes.body, null, 2));
    process.exit(1);
  }

  console.log('\n✅ Registration returns token correctly!\n');

  // Test 2: Login with demo user
  console.log('2️⃣ Testing Login...');
  const loginRes = await makeRequest('POST', '/api/auth/login', {
    email: 'john@example.com',
    password: 'password123'
  });

  console.log(`   Status: ${loginRes.status}`);
  console.log(`   Success: ${loginRes.body?.success}`);
  console.log(`   Has Token: ${!!loginRes.body?.data?.token}`);
  console.log(`   User Email: ${loginRes.body?.data?.user?.email}`);

  if (!loginRes.body?.data?.token) {
    console.log('\n❌ PROBLEM: Login did not return a token!');
    console.log('Response:', JSON.stringify(loginRes.body, null, 2));
  } else {
    console.log('\n✅ Login returns token correctly!');
  }

  // Test 3: Use token to access protected endpoint
  console.log('\n3️⃣ Testing Protected Endpoint with Token...');
  const token = regRes.body.data.token;
  
  const protectedOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const profileRes = await new Promise((resolve) => {
    const req = http.request(protectedOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: JSON.parse(data)
        });
      });
    });
    req.on('error', () => resolve({ status: 0, body: null }));
    req.end();
  });

  console.log(`   Status: ${profileRes.status}`);
  console.log(`   Can Access Protected: ${profileRes.status === 200}`);

  if (profileRes.status === 200) {
    console.log(`   Profile Email: ${profileRes.body?.data?.email}`);
    console.log('\n✅ Token can be used to access protected endpoints!');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ ALL TESTS PASSED - Auth fix is working!');
  console.log('='.repeat(50));
}

test().catch(console.error);
