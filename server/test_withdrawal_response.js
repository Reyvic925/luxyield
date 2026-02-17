#!/usr/bin/env node

/**
 * Direct test of the withdrawal endpoint to diagnose empty response issue
 * Tests with a real token from a user with completed investments
 */

const http = require('http');
const https = require('https');

// Test configuration
const API_URL = 'https://api.luxyield.com';
const TOKEN = process.env.TEST_TOKEN || 'YOUR_TOKEN_HERE';
const INVESTMENT_ID = process.env.TEST_INVESTMENT_ID || '507f1f77bcf86cd799439013';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        ...options.headers,
      },
      timeout: 10000,
    };

    console.log('[REQUEST] URL:', url);
    console.log('[REQUEST] Headers:', requestOptions.headers);

    const req = client.request(requestOptions, (res) => {
      console.log('[RESPONSE] Status:', res.statusCode);
      console.log('[RESPONSE] Headers:', JSON.stringify(res.headers, null, 2));

      let data = '';
      let dataLength = 0;

      res.on('data', (chunk) => {
        dataLength += chunk.length;
        data += chunk;
        console.log('[RESPONSE] Received chunk:', chunk.length, 'bytes, total:', dataLength);
      });

      res.on('end', () => {
        console.log('[RESPONSE] End of stream. Total bytes:', dataLength);
        console.log('[RESPONSE] Raw data:', data ? data.substring(0, 500) : '(EMPTY)');

        try {
          if (data) {
            const parsed = JSON.parse(data);
            console.log('[RESPONSE] Parsed JSON:', JSON.stringify(parsed, null, 2));
            resolve({ status: res.statusCode, body: parsed, raw: data });
          } else {
            console.log('[RESPONSE] Empty body received!');
            resolve({ status: res.statusCode, body: null, raw: '' });
          }
        } catch (e) {
          console.error('[RESPONSE] JSON parse error:', e.message);
          console.log('[RESPONSE] Raw text:', data);
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('[ERROR] Request error:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('[ERROR] Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('Withdrawal Endpoint Response Diagnostic');
  console.log('========================================');
  console.log('API URL:', API_URL);
  console.log('Token:', TOKEN.substring(0, 20) + '...');
  console.log('Investment ID:', INVESTMENT_ID);
  console.log('');

  try {
    // First test portfolio endpoint to verify auth works
    console.log('TEST 1: Verify authentication with portfolio endpoint');
    console.log('-'.repeat(50));
    const portfolioRes = await makeRequest(`${API_URL}/api/portfolio`, {
      method: 'GET',
    });
    console.log('Portfolio test result:', portfolioRes.status === 200 ? 'PASS' : 'FAIL');
    console.log('');

    // Test investment/health-check
    console.log('TEST 2: Check investment route health');
    console.log('-'.repeat(50));
    const healthRes = await makeRequest(`${API_URL}/api/investment/health-check`, {
      method: 'GET',
    });
    console.log('Health check result:', healthRes.status === 200 ? 'PASS' : 'FAIL');
    console.log('');

    // Test withdrawal endpoint
    console.log('TEST 3: Test withdrawal endpoint');
    console.log('-'.repeat(50));
    console.log('Making POST request to /api/investment/withdraw-roi/' + INVESTMENT_ID);
    const withdrawRes = await makeRequest(
      `${API_URL}/api/investment/withdraw-roi/${INVESTMENT_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Length': '0', // POST with no body
        },
      }
    );
    console.log('Withdrawal test result:', withdrawRes.status === 200 ? 'PASS' : 'Check status');
    console.log('');

    // Summary
    console.log('SUMMARY');
    console.log('='.repeat(50));
    if (portfolioRes.status === 200) {
      console.log('✓ Authentication is working');
    } else {
      console.log('✗ Authentication failed');
    }

    if (healthRes.status === 200) {
      console.log('✓ Investment routes are accessible');
    } else {
      console.log('✗ Investment routes not found');
    }

    if (withdrawRes.status === 200 && withdrawRes.body) {
      console.log('✓ Withdrawal endpoint returned valid response');
    } else if (withdrawRes.status === 200 && !withdrawRes.body) {
      console.log('✗ ISSUE FOUND: Withdrawal endpoint returned status 200 but empty body');
      console.log('  This is the "Empty server response" error');
    } else {
      console.log('✗ Withdrawal endpoint returned error:', withdrawRes.status);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
