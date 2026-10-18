// ============================================
// db.config.js - MongoDB Connection
// ============================================
// Connects to MongoDB Atlas using Mongoose.
// Reference: mongoose.connect() - reference-mongodb.md
// ============================================

import dns from 'dns';
import mongoose from 'mongoose';

// Ensure SRV records for MongoDB Atlas resolve reliably across all networks
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-mock-interview';

  try {
    const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 4000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB Connection failed: ${error.message}. Connecting to local MongoDB...`);
    try {
      const conn = await mongoose.connect('mongodb://127.0.0.1:27017/ai-mock-interview', { serverSelectionTimeoutMS: 4000 });
      console.log(`Local MongoDB Connected: ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`MongoDB Connection Error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
