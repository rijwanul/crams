const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('./models/User');

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@crams.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists: admin@crams.com');
    } else {
      // Create admin user
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = new User({
        name: 'CRAMS Administrator',
        email: 'admin@crams.com',
        password: hashedPassword,
        role: 'Admin'
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@crams.com');
      console.log('🔑 Password: admin123');
    }
    
    // Also fix users with undefined names
    console.log('\n🔧 Fixing users with undefined names...');
    
    const usersWithoutNames = await User.find({ 
      $or: [
        { name: { $exists: false } },
        { name: null },
        { name: undefined },
        { name: '' }
      ]
    });
    
    for (const user of usersWithoutNames) {
      let defaultName;
      if (user.role === 'Student') {
        defaultName = `Student User (${user.email})`;
      } else if (user.role === 'Advisor') {
        defaultName = `Advisor User (${user.email})`;
      } else if (user.role === 'Admin') {
        defaultName = `Admin User (${user.email})`;
      }
      
      await User.findByIdAndUpdate(user._id, { name: defaultName });
      console.log(`Fixed name for ${user.email}: ${defaultName}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

createAdminUser();
