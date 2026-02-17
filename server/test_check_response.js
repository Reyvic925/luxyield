const axios = require('axios');

const BASE_URL = 'https://api.luxyield.com';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2VhOTU5ZTM2YWRhZDE1NjEzNTVhOSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzcxMzI1MDYxLCJleHAiOjE3NzE5Mjk4NjF9.79flAN6prvY_a2lpTq9cLW-cLKDU8PwMjkhMnAIRs34';

async function checkResponse() {
  try {
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const res = await api.get('/api/portfolio');
    const inv = res.data.investments[0];
    
    console.log('Full investment object keys:', Object.keys(inv));
    console.log('\nFull investment object:');
    console.log(JSON.stringify(inv, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkResponse();
