const mongoose = require("mongoose");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

module.exports = { isValidEmail, isValidObjectId };
