const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cleannect-waste-management';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`👉 Please ensure MongoDB service is running (e.g. 'sudo systemctl start mongod' or 'mongod --dbpath /var/lib/mongodb') or verify MONGODB_URI in backend/.env`);
  }
};

module.exports = connectDB;
