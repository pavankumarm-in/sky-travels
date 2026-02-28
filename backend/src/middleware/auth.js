const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils");
const { jwtSecret } = require("../config/env");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authorization token is required"));
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, "Access denied"));
  }
  return next();
};

module.exports = { authenticate, authorize };
