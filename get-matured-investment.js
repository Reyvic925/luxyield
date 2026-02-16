// get-matured-investment.js
// Fetch portfolio and find a matured investment ID
// Usage: node get-matured-investment.js <API_URL> <TOKEN>

const https = require('https');

const API_URL = process.argv[2] || 'https://api.luxyield.com';
const TOKEN = process.argv[3];

if (!TOKEN) {
  console.error('Usage: node get-matured-investment.js <API_URL> <TOKEN>');
  process.exit(1);
}

console.log('\n========== FETCHING PORTFOLIO ==========\n');

makeRequest(`${API_URL}/api/portfolio`, 'GET', TOKEN, null)
  .then(result => {
    if (result.status !== 200) {
      console.error('✗ Failed to fetch portfolio. Status:', result.status);
      console.error('Error:', result.error || result.message || 'Unknown error');
      process.exit(1);
    }

    const investments = result.investments || [];
    console.log(`Found ${investments.length} total investments\n`);

    const now = new Date();
    const matured = investments.filter(inv => new Date(inv.endDate) < now);
    
    console.log(`Matured investments (endDate < now): ${matured.length}`);
    
    if (matured.length === 0) {
      console.log('\n✗ No matured investments found.');
      console.log('\nAll investments:');
      investments.forEach((inv, idx) => {
        const isPast = new Date(inv.endDate) < now;
        console.log(`  [${idx}] ID: ${inv.id}`);
        console.log(`      Status: ${inv.status}`);
        console.log(`      Amount: $${inv.initialAmount} → $${inv.currentValue}`);
        console.log(`      EndDate: ${inv.endDate} (${isPast ? 'PAST' : 'FUTURE'})`);
        console.log(`      ROI Withdrawn: ${inv.roiWithdrawn}`);
      });
      process.exit(1);
    }

    console.log('\nMatured investments:');
    matured.forEach((inv, idx) => {
      const roi = inv.currentValue - inv.initialAmount;
      console.log(`  [${idx}] ID: ${inv.id}`);
      console.log(`      Status: ${inv.status}`);
      console.log(`      Amount: $${inv.initialAmount} → $${inv.currentValue}`);
      console.log(`      ROI: $${roi.toFixed(2)}`);
      console.log(`      EndDate: ${inv.endDate}`);
      console.log(`      ROI Withdrawn: ${inv.roiWithdrawn}`);
    });

    if (matured.length > 0) {
      const first = matured[0];
      console.log(`\n✓ To test withdrawal, use:`);
      console.log(`  node test-withdrawal.js ${API_URL} ${TOKEN} ${first.id}`);
    }
  })
  .catch(err => {
    console.error('✗ ERROR:', err.message);
    process.exit(1);
  });

function makeRequest(url, method, token, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

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

    const req = https.request(options, (res) => {
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
