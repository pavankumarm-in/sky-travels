const Package = require("../models/Package");

const createPackage = (payload) => Package.create(payload);

const findById = (id) => Package.findById(id);

const countPackages = (query = {}) => Package.countDocuments(query);

const findPackages = (query, skip, limit) =>
  Package.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

const updatePackageById = (id, payload) =>
  Package.findByIdAndUpdate(id, payload, { new: true });

const deletePackageById = (id) => Package.findByIdAndDelete(id);

const hasAnyPackages = async () => (await Package.countDocuments()) > 0;

const insertManyPackages = (data) => Package.insertMany(data);

const listAllPackages = () => Package.find({});

const reserveSeats = (id, seats) =>
  Package.findOneAndUpdate(
    { _id: id, availableSeats: { $gte: seats } },
    { $inc: { availableSeats: -seats } },
    { new: true }
  );

module.exports = {
  createPackage,
  findById,
  countPackages,
  findPackages,
  updatePackageById,
  deletePackageById,
  hasAnyPackages,
  insertManyPackages,
  listAllPackages,
  reserveSeats,
};
