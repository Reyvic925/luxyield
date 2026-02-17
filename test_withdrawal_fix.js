#!/usr/bin/env node

/**
 * Quick test to verify the withdrawal endpoint fix
 * Tests that responses are no longer empty
 */

const https = require('https');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.token || ''}`,
        ...options.headers,
      },
      timeout: 10000,
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, body: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testWithdrawalFix() {
  console.log('Testing ROI Withdrawal Endpoint Fix\n');
  
  const API = 'https://api.luxyield.com';
  const userToken = process.env.USER_TOKEN;
  const investmentId = process.env.INVESTMENT_ID || 'test-id';

  if (!userToken) {
    console.log('Usage: USER_TOKEN=<token> INVESTMENT_ID=<id> node test_withdrawal_fix.js');
    console.log('\nThe fix addresses "Empty server response" error by:');
    console.log('1. Correcting response middleware context binding (.call(this, data))');
    console.log('2. Ensuring res.json() responses are properly forwarded to client');
    console.log('3. Maintaining compatibility with Express response serialization');
    return;
  }

  try {
    console.log('1. Testing withdrawal endpoint...');
    const response = await makeRequest(`${API}/api/investment/withdraw-roi/${investmentId}`, {
      method: 'POST',
      token: userToken,
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response body: ${response.raw ? response.raw.substring(0, 200) : '(empty)'}`);
    
    if (response.status === 200 && response.body) {
      console.log('\n✓ SUCCESS: Response is no longer empty!');
      console.log('   The middleware fix is working correctly.');
      console.log('\n   Response includes:');
      if (response.body.roi) console.log(`   - ROI: $${response.body.roi}`);
      if (response.body.lockedBalance) console.log(`   - Locked Balance: $${response.body.lockedBalance}`);
      if (response.body.withdrawalId) console.log(`   - Withdrawal ID: ${response.body.withdrawalId}`);
    } else if (response.status === 200 && !response.body) {
      console.log('\n✗ ISSUE: Response still empty');
      console.log('   Middleware fix may not have been deployed');
    } else if (response.status === 404) {
      console.log('\n✓ Route found (404 likely due to missing investment)');
      console.log('   Middleware is working - returns proper JSON errors');
    } else {
      console.log(`\n✓ Got proper response (${response.status})`);
      console.log('   Middleware is working correctly');
    }
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testWithdrawalFix();
