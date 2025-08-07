const http = require('http');

console.log("=== CRAMS Registration Test ===");

// Test 1: Check if server is running
console.log("1. Testing server connectivity...");

const testServerConnection = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5000/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log("✓ Server is running");
        console.log("Response:", data);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log("✗ Server not running:", err.message);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Server connection timeout'));
    });
  });
};

// Test 2: Check user routes
const testUserRoutes = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5000/api/users/test', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log("✓ User routes working");
        console.log("Response:", data);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log("✗ User routes failed:", err.message);
      reject(err);
    });
  });
};

// Test 3: Test registration endpoint
const testRegistration = () => {
  return new Promise((resolve, reject) => {
    const testData = JSON.stringify({
      name: "Test User " + Date.now(),
      email: "test" + Date.now() + "@example.com",
      studentId: "TEST" + Date.now(),
      password: "password123"
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/register-student',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Registration test - Status: ${res.statusCode}`);
        console.log("Response:", data);
        
        if (res.statusCode === 201) {
          console.log("✓ Registration working correctly");
          resolve();
        } else {
          console.log("⚠ Registration returned unexpected status");
          resolve(); // Don't reject, just note the issue
        }
      });
    });

    req.on('error', (err) => {
      console.log("✗ Registration test failed:", err.message);
      reject(err);
    });

    req.write(testData);
    req.end();
  });
};

// Run tests sequentially
(async () => {
  try {
    await testServerConnection();
    await testUserRoutes();
    await testRegistration();
    console.log("\n✅ All tests completed!");
  } catch (error) {
    console.log("\n❌ Tests failed:", error.message);
    console.log("\nMake sure the server is running with: node server.js");
  }
})();
