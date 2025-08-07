const { spawn } = require('child_process');
const http = require('http');

console.log("🚀 Starting CRAMS server test...");

// Start the server
const serverProcess = spawn('node', ['server.js'], {
  stdio: 'pipe'
});

let serverOutput = '';

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('SERVER:', output.trim());
  
  // Check if server is ready
  if (output.includes('Server running on port 5000')) {
    console.log('\n✅ Server started! Testing endpoints in 2 seconds...');
    setTimeout(testEndpoints, 2000);
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error('ERROR:', data.toString());
});

function testEndpoints() {
  console.log('\n🧪 Testing endpoints...');
  
  // Test 1: Health check
  testEndpoint('GET', '/', 'Health Check')
    .then(() => testEndpoint('GET', '/api/users/test', 'User Routes Test'))
    .then(() => testRegistration())
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    })
    .finally(() => {
      serverProcess.kill();
    });
}

function testEndpoint(method, path, testName) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`${testName}: ${res.statusCode} - ${data.substring(0, 100)}...`);
        
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`${testName} failed with status ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error(`${testName} timeout`));
    });
    
    req.end();
  });
}

function testRegistration() {
  return new Promise((resolve, reject) => {
    const testData = JSON.stringify({
      name: "Test User",
      email: "test@example.com",
      studentId: "TEST123",
      password: "password123"
    });

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/register-student',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Registration Test: ${res.statusCode} - ${data.substring(0, 200)}...`);
        
        if (res.statusCode === 201 || res.statusCode === 400) { // 400 might be "user exists"
          resolve();
        } else {
          reject(new Error(`Registration failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(testData);
    req.end();
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping server...');
  serverProcess.kill();
  process.exit(0);
});

setTimeout(() => {
  if (!serverOutput.includes('Server running on port 5000')) {
    console.error('\n❌ Server failed to start within 10 seconds');
    serverProcess.kill();
    process.exit(1);
  }
}, 10000);
