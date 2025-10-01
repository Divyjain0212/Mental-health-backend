const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing counsellors endpoint...');
    const response = await axios.get('http://localhost:5000/api/counsellors');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();