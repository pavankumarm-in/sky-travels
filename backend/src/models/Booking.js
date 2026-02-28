const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
      index: true,
    },
    adults: { type: Number, required: true, min: 1, max: 20 },
    children: { type: Number, required: true, min: 0, max: 20, default: 0 },
    seatsBooked: { type: Number, required: true, min: 1, max: 20 },
    travelDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    fareBreakup: {
      adultFare: { type: Number, required: true, min: 0 },
      childFare: { type: Number, required: true, min: 0 },
      childMultiplier: { type: Number, required: true, default: 0.5 },
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    bookingStatus: {
      type: String,
      enum: ["AWAITING_PAYMENT", "AWAITING_ADMIN_CONFIRMATION", "CONFIRMED"],
      default: "AWAITING_PAYMENT",
    },
    transactionId: { type: String, default: null },
    paymentMethod: {
      type: String,
      enum: ["CC", "DC", "UPI", "NETBANKING", null],
      default: null,
    },
    paymentLabel: { type: String, default: null },
    paymentCompletedAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    confirmedBy: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
