const User = require("../models/User");

const createUser = (payload) => User.create(payload);

const findByEmailWithPassword = (email) =>
  User.findOne({ email: email.toLowerCase() }).select("+password");

const findById = (id) => User.findById(id);

const findAllUsers = (skip, limit) =>
  User.find({}, { password: 0 }).sort({ createdAt: -1 }).skip(skip).limit(limit);

const countUsers = () => User.countDocuments();
const countUsersByRole = (role) => User.countDocuments({ role });

const updateUserRole = (id, role) =>
  User.findByIdAndUpdate(id, { role }, { new: true, projection: { password: 0 } });

const updateDefaultPayment = (id, { method, label }) =>
  User.findByIdAndUpdate(
    id,
    { defaultPaymentMethod: method, defaultPaymentLabel: label },
    { new: true, projection: { password: 0 } }
  );

const deleteById = (id) => User.findByIdAndDelete(id, { projection: { password: 0 } });

module.exports = {
  createUser,
  findByEmailWithPassword,
  findById,
  findAllUsers,
  countUsers,
  countUsersByRole,
  updateUserRole,
  updateDefaultPayment,
  deleteById,
};
