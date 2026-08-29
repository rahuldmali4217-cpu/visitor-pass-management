const mongoose = require('mongoose');
const dns = require('dns');

// set public dns fallback for mongodb atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visitor_pass_db';

  try {
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // fallback to in-memory db for local testing if installed
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const conn = await mongoose.connect(mongoServer.getUri());
      console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
      console.error('Could not connect to MongoDB:', err.message);
    }
  }
};

module.exports = connectDB;
