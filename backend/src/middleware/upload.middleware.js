import multer from "multer";

// 1. Storage configuration
// Using 'memoryStorage' means files are stored temporarily in RAM as Buffer objects.
// Useful if you want to process the file (e.g., upload to cloud storage like S3) 
// instead of saving to your local disk.
const storage = multer.memoryStorage();


// 2. File filter
// This function decides whether to accept or reject a file.
// - If file mimetype starts with "image/", it is allowed.
// - Otherwise, reject it with an error saying only image files are allowed.
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};


// 3. Multer configuration
// Here we initialize multer with:
// - storage: memoryStorage (files in RAM, not disk)
// - fileFilter: ensures only image files pass
// - limits: set file size limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, //5MB limit
});

export default upload;
