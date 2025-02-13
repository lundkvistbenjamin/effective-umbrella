const multer = require("multer");
const path = require("path");

// Define the upload folder (mounted PVC)
const uploadFolder = "/app/uploads";  // This is mounted in the pod

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

module.exports = upload;
