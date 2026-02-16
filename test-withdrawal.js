// test-withdrawal.js
// HTTP-based smoke test for ROI withdrawal
// Usage: node test-withdrawal.js <API_URL> <TOKEN> <INVESTMENT_ID>
// Example: node test-withdrawal.js https://api.luxyield.com eyJhbG... 69862ea51048bba1f4ecfe00

const http = require('http');
const https = require('https');

const API_URL = process.argv[2] || 'http://localhost:5000';
const TOKEN = process.argv[3];
const INVESTMENT_ID = process.argv[4];

if (!TOKEN || !INVESTMENT_ID) {
  console.error('Usage: node test-withdrawal.js <API_URL> <TOKEN> <INVESTMENT_ID>');
  console.error('Example: node test-withdrawal.js http://localhost:5000 eyJhbG... 69862ea51048bba1f4ecfe00');
  process.exit(1);
}

console.log('\n========== ROI WITHDRAWAL HTTP SMOKE TEST ==========\n');
console.log(`API URL: ${API_URL}`);
console.log(`Investment ID: ${INVESTMENT_ID}`);
console.log(`Token: ${TOKEN.substring(0, 20)}...`);

// Test 1: Health check
console.log('\n[TEST 1] Health check...');
makeRequest(`${API_URL}/api/investment/health-check`, 'GET', null, null)
  .then(result => {
    console.log('✓ Health check passed:', result);
    
    // Test 2: Withdraw ROI
    console.log('\n[TEST 2] Withdraw ROI...');
    return makeRequest(
      `${API_URL}/api/investment/withdraw-roi/${INVESTMENT_ID}`,
      'POST',
      TOKEN,
      {}
    );
  })
  .then(result => {
    console.log('✓ Withdrawal response:', JSON.stringify(result, null, 2));
    if (result.success) {
      console.log('\n✓✓✓ WITHDRAWAL SUCCESSFUL ✓✓✓');
      console.log(`  - Withdrawal ID: ${result.withdrawalId}`);
      console.log(`  - ROI: $${result.roi}`);
      console.log(`  - Locked Balance: $${result.lockedBalance}`);
    } else {
      console.log('\n✗✗✗ WITHDRAWAL FAILED ✗✗✗');
      console.log(`  - Error: ${result.error || result.message}`);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('✗ ERROR:', err.message);
    process.exit(1);
  });

function makeRequest(url, method, token, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, ...parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}
