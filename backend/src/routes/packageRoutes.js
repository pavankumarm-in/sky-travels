const express = require("express");
const packageController = require("../controllers/packageController");
const { authenticate, authorize } = require("../middleware/auth");
const ROLES = require("../constants/roles");

const router = express.Router();

router.get("/", packageController.getPackages);
router.get("/:packageId", packageController.getPackageById);

router.post("/", authenticate, authorize(ROLES.ADMIN), packageController.createPackage);
router.put("/:packageId", authenticate, authorize(ROLES.ADMIN), packageController.updatePackage);
router.delete(
  "/:packageId",
  authenticate,
  authorize(ROLES.ADMIN),
  packageController.deletePackage
);

module.exports = router;
