const path = require('path');
const { IMAGE_FIELD_OPTIONS } = require('../config/collections');

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const getFileExtension = (filename = '') => {
  return path.extname(filename).toLowerCase();
};

const isSupportedImageMimeType = (mimeType) => {
  return IMAGE_FIELD_OPTIONS.mimeTypes.includes(mimeType);
};

const isSupportedImageExtension = (filename) => {
  return ALLOWED_IMAGE_EXTENSIONS.includes(getFileExtension(filename));
};

const validateImageUpload = (file, options = {}) => {
  const { required = false, field = 'image' } = options;
  const errors = [];

  if (!file) {
    if (required) {
      errors.push({
        field,
        message: `${field} is required.`,
      });
    }

    return errors;
  }

  if (!isSupportedImageMimeType(file.mimetype)) {
    errors.push({
      field,
      message: `${field} must be a jpg, jpeg, png, or webp image.`,
    });
  }

  if (!isSupportedImageExtension(file.originalname)) {
    errors.push({
      field,
      message: `${field} must use a .jpg, .jpeg, .png, or .webp extension.`,
    });
  }

  if (file.size > IMAGE_FIELD_OPTIONS.maxSize) {
    errors.push({
      field,
      message: `${field} must be smaller than ${IMAGE_FIELD_OPTIONS.maxSize} bytes.`,
    });
  }

  return errors;
};

const appendFileToFormData = (formData, fieldName, file) => {
  if (!file) {
    return;
  }

  const uploadFile = new File([file.buffer], file.originalname, {
    type: file.mimetype,
  });

  formData.append(fieldName, uploadFile);
};

const getPocketBaseFileUrl = (client, record, filename, options = {}) => {
  if (!filename) {
    return null;
  }

  return client.files.getURL(record, filename, options);
};

module.exports = {
  ALLOWED_IMAGE_EXTENSIONS,
  validateImageUpload,
  appendFileToFormData,
  getPocketBaseFileUrl,
  isSupportedImageMimeType,
  isSupportedImageExtension,
};
