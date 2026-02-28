const ApiError = require("../utils/ApiError");
const { isValidObjectId } = require("../utils/validators");
const bookingRepository = require("../repositories/bookingRepository");
const packageRepository = require("../repositories/packageRepository");
const userRepository = require("../repositories/userRepository");
const auditLogService = require("./auditLogService");

const PAYMENT_METHODS = ["CC", "DC", "UPI", "NETBANKING"];
const CHILD_FARE_MULTIPLIER = 0.5;

const formatPerformer = (role, user, userId) =>
  `${role}:${user?.name || "Unknown"} (${String(userId)})`;

const createBooking = async ({ userId, packageId, adults, children, travelDate }) => {
  if (!isValidObjectId(packageId)) throw new ApiError(400, "Invalid packageId");
  if (!Number.isInteger(adults) || adults < 1 || adults > 20) {
    throw new ApiError(400, "adults must be an integer between 1 and 20");
  }
  if (!Number.isInteger(children) || children < 0 || children > 20) {
    throw new ApiError(400, "children must be an integer between 0 and 20");
  }
  const seatsBooked = adults + children;
  if (seatsBooked < 1 || seatsBooked > 20) {
    throw new ApiError(400, "total travellers must be between 1 and 20");
  }

  const date = new Date(travelDate);
  if (Number.isNaN(date.getTime()) || date <= new Date()) {
    throw new ApiError(400, "travelDate must be a valid future date");
  }

  const pkg = await packageRepository.findById(packageId);
  if (!pkg) throw new ApiError(404, "Package not found");
  if (pkg.availableSeats < seatsBooked) {
    throw new ApiError(400, `Only ${pkg.availableSeats} seats are available for this package`);
  }

  const reserved = await packageRepository.reserveSeats(packageId, seatsBooked);
  if (!reserved) {
    throw new ApiError(400, "Unable to reserve seats. Please refresh and try again.");
  }

  const adultFare = adults * pkg.price;
  const childFare = children * pkg.price * CHILD_FARE_MULTIPLIER;
  const totalAmount = adultFare + childFare;

  const bookingUser = await userRepository.findById(userId);
  const created = await bookingRepository.createBooking({
    userId,
    packageId,
    adults,
    children,
    seatsBooked,
    travelDate: date,
    totalAmount,
    fareBreakup: {
      adultFare,
      childFare,
      childMultiplier: CHILD_FARE_MULTIPLIER,
    },
    paymentStatus: "PENDING",
    bookingStatus: "AWAITING_PAYMENT",
  });

  await auditLogService.createLog({
    action: "CREATE_BOOKING",
    entity: "BOOKING",
    entityId: created._id,
    performedBy: formatPerformer("USER", bookingUser, userId),
    oldData: null,
    newData: {
      bookingId: created._id,
      userId: String(userId),
      userName: bookingUser?.name || null,
      userEmail: bookingUser?.email || null,
      packageId: String(packageId),
      adults,
      children,
      seatsBooked,
      travelDate: created.travelDate,
      totalAmount,
      fareBreakup: created.fareBreakup,
      paymentStatus: created.paymentStatus,
      bookingStatus: created.bookingStatus,
      createdAt: created.createdAt,
    },
  });

  return created;
};

const getMyBookings = async ({ userId, page = 1, limit = 10, paymentStatus, bookingStatus }) => {
  const skip = (page - 1) * limit;
  const query = {};
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (bookingStatus) query.bookingStatus = bookingStatus;
  const [items, total] = await Promise.all([
    bookingRepository.findUserBookings(userId, skip, limit, query),
    bookingRepository.countUserBookings(userId, query),
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

const simulatePayment = async ({
  bookingId,
  userId,
  role,
  paymentMethod,
  paymentLabel,
  makeDefault = false,
}) => {
  if (!isValidObjectId(bookingId)) throw new ApiError(400, "Invalid bookingId");
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method");
  }
  if (!paymentLabel || paymentLabel.trim().length < 4) {
    throw new ApiError(400, "Payment details are required");
  }

  const booking = await bookingRepository.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  const bookingUser = await userRepository.findById(booking.userId);
  const actorUser = await userRepository.findById(userId);

  if (role !== "ADMIN" && String(booking.userId) !== String(userId)) {
    throw new ApiError(403, "You do not have access to this booking");
  }

  if (booking.paymentStatus === "SUCCESS") {
    return booking;
  }

  const transactionId = `TXN_${Date.now()}`;
  const updated = await bookingRepository.updateBookingById(bookingId, {
    paymentStatus: "SUCCESS",
    transactionId,
    paymentMethod,
    paymentLabel: paymentLabel.trim(),
    paymentCompletedAt: new Date(),
    bookingStatus: "AWAITING_ADMIN_CONFIRMATION",
  });

  if (makeDefault) {
    await userRepository.updateDefaultPayment(userId, {
      method: paymentMethod,
      label: paymentLabel.trim(),
    });
  }

  await auditLogService.createLog({
    action: "PAYMENT_SUCCESS",
    entity: "BOOKING",
    entityId: bookingId,
    performedBy: formatPerformer(role === "ADMIN" ? "ADMIN" : "USER", actorUser, userId),
    oldData: {
      paymentStatus: booking.paymentStatus,
      transactionId: booking.transactionId,
      bookingStatus: booking.bookingStatus,
    },
    newData: {
      paymentStatus: "SUCCESS",
      transactionId,
      bookingStatus: "AWAITING_ADMIN_CONFIRMATION",
      paymentMethod,
      totalAmount: updated.totalAmount,
      seatsBooked: updated.seatsBooked,
      travelDate: updated.travelDate,
      bookingId: updated._id,
      userId: String(updated.userId),
      userName: bookingUser?.name || null,
      userEmail: bookingUser?.email || null,
      packageId: String(updated.packageId),
      paymentCompletedAt: updated.paymentCompletedAt,
    },
  });

  return updated;
};

const getPaymentPreference = async ({ userId }) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  return {
    defaultPaymentMethod: user.defaultPaymentMethod || null,
    defaultPaymentLabel: user.defaultPaymentLabel || null,
  };
};

const getAllBookingsForAdmin = async ({ page = 1, limit = 20, bookingStatus }) => {
  const skip = (page - 1) * limit;
  const query = {};
  if (bookingStatus) query.bookingStatus = bookingStatus;
  const [items, total] = await Promise.all([
    bookingRepository.findAllBookings(skip, limit, query),
    bookingRepository.countAllBookingsByQuery(query),
  ]);
  return {
    items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const confirmBookingByAdmin = async ({ bookingId, adminUserId }) => {
  if (!isValidObjectId(bookingId)) throw new ApiError(400, "Invalid bookingId");
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  const bookingUser = await userRepository.findById(booking.userId);
  const adminUser = await userRepository.findById(adminUserId);
  if (booking.paymentStatus !== "SUCCESS") {
    throw new ApiError(400, "Only paid bookings can be confirmed");
  }
  if (booking.bookingStatus === "CONFIRMED") return booking;

  const updated = await bookingRepository.updateBookingById(bookingId, {
    bookingStatus: "CONFIRMED",
    confirmedAt: new Date(),
    confirmedBy: `ADMIN:${adminUserId}`,
  });

  await auditLogService.createLog({
    action: "CONFIRM_BOOKING",
    entity: "BOOKING",
    entityId: bookingId,
    performedBy: formatPerformer("ADMIN", adminUser, adminUserId),
    oldData: { bookingStatus: booking.bookingStatus },
    newData: {
      bookingStatus: "CONFIRMED",
      bookingId: updated._id,
      userId: String(updated.userId),
      userName: bookingUser?.name || null,
      userEmail: bookingUser?.email || null,
      packageId: String(updated.packageId),
      totalAmount: updated.totalAmount,
      seatsBooked: updated.seatsBooked,
      travelDate: updated.travelDate,
      paymentStatus: updated.paymentStatus,
      transactionId: updated.transactionId,
      confirmedAt: updated.confirmedAt,
      confirmedBy: updated.confirmedBy,
    },
  });

  return updated;
};

module.exports = {
  createBooking,
  getMyBookings,
  simulatePayment,
  getPaymentPreference,
  getAllBookingsForAdmin,
  confirmBookingByAdmin,
};
