const mongoose = require('mongoose');
require('dotenv').config();

// Import the User model
const User = require('./models/User');

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    console.log('\n📊 Checking database contents...');
    
    // Count all users
    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      // Get all users (without passwords)
      const users = await User.find({}).select('-password').lean();
      console.log('\n👥 All users:');
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    } else {
      console.log('No users found in database');
      
      // Create a test admin user
      console.log('\n🔧 Creating test admin user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = new User({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'Admin'
      });
      
      await adminUser.save();
      console.log('✓ Test admin user created: admin@test.com / admin123');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

checkDatabase();
