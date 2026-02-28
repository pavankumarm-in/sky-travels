const mongoose = require("mongoose");
const Booking = require("../models/Booking");

const createBooking = (payload) => Booking.create(payload);

const findUserBookings = (userId, skip, limit, query = {}) =>
  Booking.find({ userId, ...query })
    .populate("packageId", "title country duration price")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

const countUserBookings = (userId, query = {}) => Booking.countDocuments({ userId, ...query });

const findById = (id) => Booking.findById(id).populate("packageId");

const findByIdForAdmin = (id) =>
  Booking.findById(id)
    .populate("packageId", "title country price")
    .populate("userId", "name email role");

const updateBookingById = (id, payload) =>
  Booking.findByIdAndUpdate(id, payload, { new: true });

const countAllBookings = () => Booking.countDocuments();

const countSuccessfulBookings = () => Booking.countDocuments({ paymentStatus: "SUCCESS" });

const aggregateTotalRevenue = async () => {
  const result = await Booking.aggregate([
    { $match: { paymentStatus: "SUCCESS" } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
  ]);
  return result[0]?.totalRevenue || 0;
};

const aggregateTopPackages = (limit = 5) =>
  Booking.aggregate([
    { $match: { paymentStatus: "SUCCESS" } },
    {
      $group: {
        _id: "$packageId",
        bookings: { $sum: 1 },
      },
    },
    { $sort: { bookings: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "packages",
        localField: "_id",
        foreignField: "_id",
        as: "package",
      },
    },
    { $unwind: "$package" },
    {
      $project: {
        _id: 0,
        packageId: "$package._id",
        title: "$package.title",
        country: "$package.country",
        bookings: 1,
      },
    },
  ]);

const isOwnedByUser = async (bookingId, userId) => {
  const count = await Booking.countDocuments({
    _id: new mongoose.Types.ObjectId(bookingId),
    userId: new mongoose.Types.ObjectId(userId),
  });
  return count > 0;
};

const findAllBookings = (skip, limit, query = {}) =>
  Booking.find(query)
    .populate("packageId", "title country price")
    .populate("userId", "name email role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

const countAllBookingsByQuery = (query = {}) => Booking.countDocuments(query);

module.exports = {
  createBooking,
  findUserBookings,
  countUserBookings,
  findById,
  findByIdForAdmin,
  updateBookingById,
  countAllBookings,
  countSuccessfulBookings,
  aggregateTotalRevenue,
  aggregateTopPackages,
  isOwnedByUser,
  findAllBookings,
  countAllBookingsByQuery,
};
