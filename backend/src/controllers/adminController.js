const adminService = require("../services/adminService");
const auditLogService = require("../services/auditLogService");
const asyncHandler = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/apiResponse");

const getUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const data = await adminService.getUsers({ page, limit });
  return sendResponse(res, 200, "Users fetched", data);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const data = await adminService.updateUserRole({
    targetUserId: req.params.userId,
    role: req.body.role,
    performedBy: `ADMIN:${req.user.userId}`,
  });
  return sendResponse(res, 200, "User role updated", data);
});

const deleteUser = asyncHandler(async (req, res) => {
  const data = await adminService.deleteUser({
    targetUserId: req.params.userId,
    adminUserId: req.user.userId,
  });
  return sendResponse(res, 200, "User deleted", data);
});

const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const data = await auditLogService.getAuditLogs({ page, limit });
  return sendResponse(res, 200, "Audit logs fetched", data);
});

const getAnalytics = asyncHandler(async (req, res) => {
  const data = await adminService.getAnalytics();
  return sendResponse(res, 200, "Analytics fetched", data);
});

const uploadPackageImages = asyncHandler(async (req, res) => {
  const files = req.files || [];
  const data = files.map((file) => {
    const contentType = file.mimetype || "image/jpeg";
    const base64 = file.buffer.toString("base64");
    return `data:${contentType};base64,${base64}`;
  });
  return sendResponse(res, 201, "Images uploaded", data);
});

const getBookings = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const bookingStatus = req.query.bookingStatus || undefined;
  const data = await adminService.getBookings({ page, limit, bookingStatus });
  return sendResponse(res, 200, "Bookings fetched", data);
});

const getBookingById = asyncHandler(async (req, res) => {
  const data = await adminService.getBookingById({ bookingId: req.params.bookingId });
  return sendResponse(res, 200, "Booking fetched", data);
});

const confirmBooking = asyncHandler(async (req, res) => {
  const data = await adminService.confirmBooking({
    bookingId: req.params.bookingId,
    adminUserId: req.user.userId,
  });
  return sendResponse(res, 200, "Booking confirmed", data);
});

module.exports = {
  getUsers,
  updateUserRole,
  deleteUser,
  getAuditLogs,
  getAnalytics,
  getBookings,
  getBookingById,
  confirmBooking,
  uploadPackageImages,
};
