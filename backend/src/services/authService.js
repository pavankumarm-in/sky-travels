const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ApiError, isValidEmail } = require("../utils");
const { jwtSecret, jwtExpiresIn } = require("../config/env");
const userRepository = require("../repositories/userRepository");

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  defaultPaymentMethod: user.defaultPaymentMethod || null,
  defaultPaymentLabel: user.defaultPaymentLabel || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const signup = async ({ name, email, password }) => {
  if (!name || name.trim().length < 3) {
    throw new ApiError(400, "Name is required with minimum length 3");
  }
  if (!email || !isValidEmail(email)) {
    throw new ApiError(400, "Valid email is required");
  }
  if (!password || password.length < 8) {
    throw new ApiError(400, "Password is required with minimum length 8");
  }

  const existingUser = await userRepository.findByEmailWithPassword(email);
  if (existingUser) {
    throw new ApiError(409, "Email already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepository.createUser({
    name: name.trim(),
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  return sanitizeUser(user);
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await userRepository.findByEmailWithPassword(email);
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
};

module.exports = { signup, login };
