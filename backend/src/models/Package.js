const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    destinations: [{ type: String, required: true, trim: true }],
    images: [{ type: String, required: true, trim: true }],
    itinerary: [{ type: String, required: true, trim: true }],
    description: { type: String, required: true, trim: true },
    totalSeats: { type: Number, required: true, min: 1, default: 40 },
    availableSeats: { type: Number, required: true, min: 0, default: 40 },
    createdBy: { type: String, default: "SYSTEM" },
    updatedBy: { type: String, default: "SYSTEM" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
