const http = require('http');

// Test data
const testRegistration = {
  name: "Test Student",
  email: "test@example.com",
  studentId: "TEST123",
  password: "password123"
};

const postData = JSON.stringify(testRegistration);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/users/register-student',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing registration endpoint...');
console.log('URL: http://localhost:5000/api/users/register-student');
console.log('Data:', testRegistration);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
    
    if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed JSON:', jsonData);
      } catch (e) {
        console.log('Could not parse as JSON');
      }
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();

// Also test the test endpoint
setTimeout(() => {
  console.log('\n--- Testing /api/users/test endpoint ---');
  
  const testOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/test',
    method: 'GET'
  };
  
  const testReq = http.request(testOptions, (res) => {
    console.log(`Test endpoint status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Test endpoint response:', data);
    });
  });
  
  testReq.on('error', (e) => {
    console.error(`Test request error: ${e.message}`);
  });
  
  testReq.end();
}, 1000);
