const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/skytravels",
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};
