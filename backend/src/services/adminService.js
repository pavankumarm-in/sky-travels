const ApiError = require("../utils/ApiError");
const ROLES = require("../constants/roles");
const userRepository = require("../repositories/userRepository");
const bookingRepository = require("../repositories/bookingRepository");
const auditLogService = require("./auditLogService");
const bookingService = require("./bookingService");

const getUsers = async ({ page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    userRepository.findAllUsers(skip, limit),
    userRepository.countUsers(),
  ]);
  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateUserRole = async ({ targetUserId, role, performedBy }) => {
  if (!Object.values(ROLES).includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const existing = await userRepository.findById(targetUserId);
  if (!existing) throw new ApiError(404, "User not found");

  const oldData = { role: existing.role };
  const updated = await userRepository.updateUserRole(targetUserId, role);

  await auditLogService.createLog({
    action: "UPDATE_USER_ROLE",
    entity: "USER",
    entityId: targetUserId,
    performedBy,
    oldData,
    newData: { role },
  });

  return updated;
};

const deleteUser = async ({ targetUserId, adminUserId }) => {
  const existing = await userRepository.findById(targetUserId);
  const adminUser = await userRepository.findById(adminUserId);
  if (!existing) throw new ApiError(404, "User not found");
  if (String(existing._id) === String(adminUserId)) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  await userRepository.deleteById(targetUserId);

  await auditLogService.createLog({
    action: "DELETE_USER",
    entity: "USER",
    entityId: targetUserId,
    performedBy: `ADMIN:${adminUser?.name || "Unknown"} (${String(adminUserId)})`,
    oldData: {
      name: existing.name,
      email: existing.email,
      role: existing.role,
    },
    newData: null,
  });

  return { deleted: true, userId: targetUserId };
};

const getAnalytics = async () => {
  const [
    totalUsers,
    totalBookings,
    successfulBookings,
    totalRevenue,
    topPackages,
  ] = await Promise.all([
    userRepository.countUsers(),
    bookingRepository.countAllBookings(),
    bookingRepository.countSuccessfulBookings(),
    bookingRepository.aggregateTotalRevenue(),
    bookingRepository.aggregateTopPackages(5),
  ]);

  return {
    totalUsers,
    totalBookings,
    successfulBookings,
    totalRevenue,
    topPackages,
  };
};

const getBookings = async ({ page = 1, limit = 20, bookingStatus }) =>
  bookingService.getAllBookingsForAdmin({ page, limit, bookingStatus });

const getBookingById = async ({ bookingId }) => {
  const booking = await bookingRepository.findByIdForAdmin(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  return booking;
};

const confirmBooking = async ({ bookingId, adminUserId }) =>
  bookingService.confirmBookingByAdmin({ bookingId, adminUserId });

module.exports = {
  getUsers,
  updateUserRole,
  deleteUser,
  getAnalytics,
  getBookings,
  getBookingById,
  confirmBooking,
};
