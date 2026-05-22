const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const UPLOADS_URL_PREFIX = '/uploads';

const ensureUploadsDir = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  return UPLOADS_DIR;
};

const resolveUploadedImageUrl = (file) => {
  if (!file) {
    return null;
  }

  if (file.path) {
    const filename = path.basename(file.path);
    return `${UPLOADS_URL_PREFIX}/${filename}`;
  }

  if (file.filename) {
    return `${UPLOADS_URL_PREFIX}/${file.filename}`;
  }

  return null;
};

module.exports = {
  UPLOADS_DIR,
  UPLOADS_URL_PREFIX,
  ensureUploadsDir,
  resolveUploadedImageUrl,
};
