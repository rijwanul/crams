const http = require('http');

// Test the users API endpoint
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/users/test',
  method: 'GET'
};

console.log('Testing API endpoint:', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
