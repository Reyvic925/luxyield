require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrateMissingBalances() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    // Find users with missing availableBalance
    const users = await User.find({
      $or: [
        { availableBalance: { $exists: false } },
        { availableBalance: null }
      ]
    });

    console.log(`Found ${users.length} users with missing availableBalance`);

    // Update each user
    for (const user of users) {
      // Set availableBalance to 0 if not present
      if (!user.availableBalance) {
        user.availableBalance = 0;
      }
      
      // Ensure balance field is also set
      if (!user.balance) {
        user.balance = 0;
      }

      await user.save();
      console.log(`Updated user ${user.email} with availableBalance: ${user.availableBalance}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateMissingBalances();