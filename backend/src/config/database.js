const mongoose = require("mongoose");
const { mongoUri } = require("./env");

const connectDatabase = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log(`[DB] Connected to MongoDB: ${mongoUri}`);
  } catch (error) {
    console.error("[DB] Connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { connectDatabase };
