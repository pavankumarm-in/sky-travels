const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";

  console.error("[ERROR]", {
    method: req.method,
    path: req.originalUrl,
    message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || null,
  });
};

module.exports = errorHandler;
