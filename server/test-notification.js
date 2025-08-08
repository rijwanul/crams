const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testNotification() {
  try {
    // First, login as admin to get token
    console.log("🔐 Logging in as admin...");
    const loginResponse = await makeRequest('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@crams.com',
        password: 'admin123'
      }),
    });

    if (!loginResponse.ok) {
      console.error("❌ Login failed:", await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log("✅ Login successful, token received");

    // Get list of users to send notification to
    console.log("👥 Getting user list...");
    const usersResponse = await makeRequest('http://localhost:5000/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!usersResponse.ok) {
      console.error("❌ Failed to get users:", await usersResponse.text());
      return;
    }

    const users = await usersResponse.json();
    console.log(`✅ Found ${users.length} users`);

    if (users.length === 0) {
      console.log("⚠️ No users found to send notification to");
      return;
    }

    // Send notification to first user
    const recipients = [users[0]._id];
    console.log("📧 Sending test notification...");
    
    const notificationData = {
      recipients: recipients,
      title: 'Test Notification',
      message: 'This is a test notification from the admin panel.'
    };

    console.log("📧 Notification data:", notificationData);

    const notificationResponse = await makeRequest('http://localhost:5000/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(notificationData),
    });

    console.log("📡 Response status:", notificationResponse.status);
    
    if (notificationResponse.ok) {
      const result = await notificationResponse.json();
      console.log("✅ Notification sent successfully:", result);
    } else {
      const errorText = await notificationResponse.text();
      console.error("❌ Notification failed:", errorText);
    }

  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

testNotification();
