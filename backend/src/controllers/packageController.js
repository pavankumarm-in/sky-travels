const packageService = require("../services/packageService");
const asyncHandler = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/apiResponse");

const getPackages = asyncHandler(async (req, res) => {
  const { search, minPrice, maxPrice } = req.query;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 6);
  const data = await packageService.getPackages({ search, minPrice, maxPrice, page, limit });
  return sendResponse(res, 200, "Packages fetched", data);
});

const getPackageById = asyncHandler(async (req, res) => {
  const data = await packageService.getPackageById(req.params.packageId);
  return sendResponse(res, 200, "Package details fetched", data);
});

const createPackage = asyncHandler(async (req, res) => {
  const performedBy = `ADMIN:${req.user.userId}`;
  const data = await packageService.createPackage(req.body, performedBy);
  return sendResponse(res, 201, "Package created", data);
});

const updatePackage = asyncHandler(async (req, res) => {
  const performedBy = `ADMIN:${req.user.userId}`;
  const data = await packageService.updatePackage(req.params.packageId, req.body, performedBy);
  return sendResponse(res, 200, "Package updated", data);
});

const deletePackage = asyncHandler(async (req, res) => {
  const performedBy = `ADMIN:${req.user.userId}`;
  await packageService.deletePackage(req.params.packageId, performedBy);
  return sendResponse(res, 200, "Package deleted");
});

module.exports = {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
};
