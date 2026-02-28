const multer = require("multer");

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }
  cb(new Error("Only image files are allowed"));
};

const uploadPackageImages = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

module.exports = { uploadPackageImages };
