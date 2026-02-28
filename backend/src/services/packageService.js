const { ApiError, isValidObjectId } = require("../utils");
const packageRepository = require("../repositories/packageRepository");
const auditLogService = require("./auditLogService");

const validatePackagePayload = (payload) => {
  const {
    title,
    country,
    duration,
    price,
    destinations,
    images,
    itinerary,
    description,
    totalSeats,
    availableSeats,
  } = payload;

  if (!title || !country || !duration || !description) {
    throw new ApiError(400, "title, country, duration and description are required");
  }
  if (typeof price !== "number" || price < 0) {
    throw new ApiError(400, "price must be a valid non-negative number");
  }
  if (!Array.isArray(destinations) || destinations.length === 0) {
    throw new ApiError(400, "destinations must be a non-empty array");
  }
  if (!Array.isArray(images) || images.length < 2) {
    throw new ApiError(400, "images must be an array with at least 2 URLs");
  }
  const isValidUrl = (value) =>
    /^https?:\/\/\S+$/i.test(value) ||
    /^\/uploads\/\S+$/i.test(value) ||
    /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(value);
  if (!images.every((img) => typeof img === "string" && isValidUrl(img))) {
    throw new ApiError(400, "each image must be a valid URL, data URL, or uploaded image path");
  }
  if (!Array.isArray(itinerary) || itinerary.length < 3) {
    throw new ApiError(400, "itinerary must be an array with at least 3 day entries");
  }
  if (!Number.isInteger(totalSeats) || totalSeats < 1) {
    throw new ApiError(400, "totalSeats must be an integer greater than 0");
  }
  if (!Number.isInteger(availableSeats) || availableSeats < 0 || availableSeats > totalSeats) {
    throw new ApiError(400, "availableSeats must be between 0 and totalSeats");
  }
};

const getPackages = async ({ search, minPrice, maxPrice, page = 1, limit = 6 }) => {
  const query = {};

  if (search) {
    const pattern = { $regex: search, $options: "i" };
    query.$or = [
      { title: pattern },
      { country: pattern },
      { duration: pattern },
      { description: pattern },
      { destinations: pattern },
    ];
  }
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    packageRepository.findPackages(query, skip, limit),
    packageRepository.countPackages(query),
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

const getPackageById = async (id) => {
  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid packageId");
  }
  const pkg = await packageRepository.findById(id);
  if (!pkg) throw new ApiError(404, "Package not found");
  return pkg;
};

const createPackage = async (payload, performedBy) => {
  validatePackagePayload(payload);
  const created = await packageRepository.createPackage({
    ...payload,
    totalSeats: payload.totalSeats,
    availableSeats:
      typeof payload.availableSeats === "number" ? payload.availableSeats : payload.totalSeats,
    createdBy: performedBy,
    updatedBy: performedBy,
  });
  await auditLogService.createLog({
    action: "CREATE_PACKAGE",
    entity: "PACKAGE",
    entityId: created._id,
    performedBy,
    newData: created.toObject(),
  });
  return created;
};

const updatePackage = async (id, payload, performedBy) => {
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid packageId");
  const oldData = await packageRepository.findById(id);
  if (!oldData) throw new ApiError(404, "Package not found");

  const merged = { ...oldData.toObject(), ...payload };
  validatePackagePayload(merged);

  const updated = await packageRepository.updatePackageById(id, {
    ...payload,
    updatedBy: performedBy,
  });
  await auditLogService.createLog({
    action: "UPDATE_PACKAGE",
    entity: "PACKAGE",
    entityId: id,
    performedBy,
    oldData: oldData.toObject(),
    newData: updated.toObject(),
  });
  return updated;
};

const deletePackage = async (id, performedBy) => {
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid packageId");
  const existing = await packageRepository.findById(id);
  if (!existing) throw new ApiError(404, "Package not found");

  await packageRepository.deletePackageById(id);
  await auditLogService.createLog({
    action: "DELETE_PACKAGE",
    entity: "PACKAGE",
    entityId: id,
    performedBy,
    oldData: existing.toObject(),
  });
};

module.exports = {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
};
