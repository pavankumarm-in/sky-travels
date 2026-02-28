const express = require("express");
const bookingController = require("../controllers/bookingController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.post("/", bookingController.createBooking);
router.get("/my-history", bookingController.getMyBookings);
router.get("/payment-preference", bookingController.getPaymentPreference);
router.post("/:bookingId/pay", bookingController.simulatePayment);

module.exports = router;
