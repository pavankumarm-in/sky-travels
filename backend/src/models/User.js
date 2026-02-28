const mongoose = require("mongoose");
const ROLES = require("../constants/roles");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    defaultPaymentMethod: {
      type: String,
      enum: ["CC", "DC", "UPI", "NETBANKING", null],
      default: null,
    },
    defaultPaymentLabel: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
