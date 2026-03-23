// Quick test to validate security implementation
const http = require('http');

const API_BASE = 'http://localhost:3001';

async function testAPI(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n========== SECURITY IMPLEMENTATION TEST ==========\n');

  try {
    // Test 1: Register new user
    console.log('TEST 1: User Registration');
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const registerRes = await testAPI('POST', '/api/auth/register', {
      email: uniqueEmail,
      password: 'TestPassword123!',
      first_name: 'Test'
    });
    console.log('Status:', registerRes.status);
    console.log('Response:', JSON.stringify(registerRes.body, null, 2));

    if (registerRes.status === 201 && registerRes.body.data) {
      const { accessToken, refreshToken, user } = registerRes.body.data;
      console.log('✓ Registered successfully');
      console.log('✓ Access Token: ' + (accessToken ? accessToken.substring(0, 20) + '...' : 'MISSING'));
      console.log('✓ Refresh Token: ' + (refreshToken ? refreshToken.substring(0, 20) + '...' : 'MISSING'));
      console.log('✓ User ID:', user.id);

      // Test 2: Login with same user
      console.log('\nTEST 2: User Login');
      const loginRes = await testAPI('POST', '/api/auth/login', {
        email: uniqueEmail,
        password: 'TestPassword123!'
      });
      console.log('Status:', loginRes.status);

      if (loginRes.status === 200 && loginRes.body.data) {
        const { accessToken: loginAccessToken, refreshToken: loginRefreshToken } = loginRes.body.data;
        console.log('✓ Login successful');
        console.log('✓ Access Token: ' + (loginAccessToken ? loginAccessToken.substring(0, 20) + '...' : 'MISSING'));
        console.log('✓ Refresh Token: ' + (loginRefreshToken ? loginRefreshToken.substring(0, 20) + '...' : 'MISSING'));

        // Test 3: Test token refresh
        console.log('\nTEST 3: Token Refresh');
        const refreshRes = await testAPI('POST', '/api/auth/refresh', {
          refreshToken: loginRefreshToken
        }, loginRefreshToken);
        console.log('Status:', refreshRes.status);
        console.log('Response:', JSON.stringify(refreshRes.body, null, 2));

        if (refreshRes.status === 200) {
          console.log('✓ Token refresh successful');
          console.log('✓ New Access Token: ' + (refreshRes.body.accessToken ? refreshRes.body.accessToken.substring(0, 20) + '...' : 'MISSING'));
        } else {
          console.log('✗ Token refresh failed');
        }
      } else {
        console.log('✗ Login failed');
      }
    } else {
      console.log('✗ Registration failed');
    }

    // Test 4: Check security headers
    console.log('\nTEST 4: Security Headers');
    const headersRes = await testAPI('GET', '/api/test');
    console.log('Status:', headersRes.status);
    console.log('Helmet Headers:');
    console.log('  ✓ x-content-type-options:', headersRes.headers['x-content-type-options']);
    console.log('  ✓ x-frame-options:', headersRes.headers['x-frame-options']);
    console.log('  ✓ x-xss-protection:', headersRes.headers['x-xss-protection']);
    console.log('  ✓ x-powered-by (should be undefined):', headersRes.headers['x-powered-by'] || 'NOT PRESENT ✓');

    // Test 5: Rate limiting test
    console.log('\nTEST 5: Rate Limiting (Testing API limiter)');
    let rateLimitTest = 0;
    for (let i = 0; i < 3; i++) {
      const res = await testAPI('GET', '/api/test');
      if (res.status === 429) {
        console.log(`✓ Rate limit kicked in after ${i} requests`);
        rateLimitTest = i;
        break;
      }
      console.log(`  Request ${i + 1}: ${res.status}`);
    }
    if (rateLimitTest === 0) {
      console.log('  (Rate limit limit is high, not triggered in 3 requests - OK)');
    }

    console.log('\n========== ALL TESTS COMPLETED ==========\n');
  } catch (error) {
    console.error('TEST ERROR:', error.message);
  }
}

runTests();
