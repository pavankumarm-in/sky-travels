const authService = require("../services/authService");
const { asyncHandler, sendResponse } = require("../utils");

const signup = asyncHandler(async (req, res) => {
  const user = await authService.signup(req.body);
  return sendResponse(res, 201, "Signup successful", user);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return sendResponse(res, 200, "Login successful", result);
});

module.exports = { signup, login };
