class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

const sendResponse = (res, statusCode, message, data = null) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const isValidEmail = (email) =>
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

module.exports = {
  ApiError,
  sendResponse,
  asyncHandler,
  isValidEmail,
  isValidObjectId,
};
