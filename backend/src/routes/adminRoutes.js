const express = require("express");
const adminController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");
const ROLES = require("../constants/roles");
const { uploadPackageImages } = require("../middleware/upload");

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get("/users", adminController.getUsers);
router.patch("/users/:userId/role", adminController.updateUserRole);
router.delete("/users/:userId", adminController.deleteUser);
router.get("/audit-logs", adminController.getAuditLogs);
router.get("/analytics", adminController.getAnalytics);
router.get("/bookings", adminController.getBookings);
router.get("/bookings/:bookingId", adminController.getBookingById);
router.patch("/bookings/:bookingId/confirm", adminController.confirmBooking);
router.post(
  "/uploads/package-images",
  uploadPackageImages.array("images", 10),
  adminController.uploadPackageImages
);

module.exports = router;
