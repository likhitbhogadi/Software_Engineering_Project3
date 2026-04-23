const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the MONGO_URI from .env
 * @param {string} serviceName - for logging
 */
const connectDB = async (serviceName = 'Service') => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`${serviceName}: Connected to MongoDB at ${process.env.MONGO_URI}`);
  } catch (err) {
    console.error(`${serviceName}: MongoDB connection failed:`, err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
