const path = require('path');
const multer = require('multer');
const { IMAGE_FIELD_OPTIONS } = require('../config/collections');
const {
  isSupportedImageMimeType,
  isSupportedImageExtension,
} = require('../utils/fileHelpers');
const { ensureUploadsDir, UPLOADS_DIR } = require('../utils/uploadHelpers');

ensureUploadsDir();

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, UPLOADS_DIR);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, uniqueName);
  },
});

const imageFileFilter = (req, file, callback) => {
  if (!isSupportedImageMimeType(file.mimetype) || !isSupportedImageExtension(file.originalname)) {
    const error = new Error('Only jpg, jpeg, png, and webp images are allowed.');
    error.statusCode = 400;
    return callback(error);
  }

  return callback(null, true);
};

const multerUpload = multer({
  storage,
  limits: {
    fileSize: IMAGE_FIELD_OPTIONS.maxSize,
    files: 1,
  },
  fileFilter: imageFileFilter,
});

const handleMulterError = (error, label = 'image') => {
  if (!error) {
    return null;
  }

  if (error instanceof multer.MulterError) {
    const uploadError = new Error('Image upload failed.');
    uploadError.statusCode = 400;

    if (error.code === 'LIMIT_FILE_SIZE') {
      uploadError.message = `Image must be smaller than ${IMAGE_FIELD_OPTIONS.maxSize} bytes.`;
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      uploadError.message = `Only one ${label} image can be uploaded.`;
    }

    return uploadError;
  }

  error.statusCode = error.statusCode || 400;
  return error;
};

const uploadSingleImage = (label = 'resource') => {
  return (req, res, next) => {
    const upload = multerUpload.single('image');

    upload(req, res, (error) => {
      const uploadError = handleMulterError(error, label);

      if (uploadError) {
        return next(uploadError);
      }

      return next();
    });
  };
};

const uploadRestaurantImage = (req, res, next) => {
  const upload = uploadSingleImage('restaurant');
  return upload(req, res, next);
};

const uploadMenuImage = (req, res, next) => {
  const upload = uploadSingleImage('menu item');
  return upload(req, res, next);
};

module.exports = {
  uploadSingleImage,
  uploadRestaurantImage,
  uploadMenuImage,
};
