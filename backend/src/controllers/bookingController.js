const bookingService = require("../services/bookingService");
const asyncHandler = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/apiResponse");

const createBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.createBooking({
    userId: req.user.userId,
    packageId: req.body.packageId,
    adults: Number(req.body.adults),
    children: Number(req.body.children || 0),
    travelDate: req.body.travelDate,
  });
  return sendResponse(res, 201, "Booking created", data);
});

const getMyBookings = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const paymentStatus = req.query.paymentStatus || undefined;
  const bookingStatus = req.query.bookingStatus || undefined;
  const data = await bookingService.getMyBookings({
    userId: req.user.userId,
    page,
    limit,
    paymentStatus,
    bookingStatus,
  });
  return sendResponse(res, 200, "Booking history fetched", data);
});

const simulatePayment = asyncHandler(async (req, res) => {
  const data = await bookingService.simulatePayment({
    bookingId: req.params.bookingId,
    userId: req.user.userId,
    role: req.user.role,
    paymentMethod: req.body.paymentMethod,
    paymentLabel: req.body.paymentLabel,
    makeDefault: Boolean(req.body.makeDefault),
  });
  return sendResponse(res, 200, "Payment simulation successful", data);
});

const getPaymentPreference = asyncHandler(async (req, res) => {
  const data = await bookingService.getPaymentPreference({ userId: req.user.userId });
  return sendResponse(res, 200, "Payment preference fetched", data);
});

module.exports = { createBooking, getMyBookings, simulatePayment, getPaymentPreference };
