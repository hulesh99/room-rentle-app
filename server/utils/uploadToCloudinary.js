import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

export const ensureUploadsDir = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  return UPLOADS_DIR;
};

const uploadImageBufferLocal = (buffer, originalname = 'image.jpg') => {
  ensureUploadsDir();
  const ext = (path.extname(originalname) || '.jpg').toLowerCase();
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return {
    public_id: `local/${filename}`,
    url: `/uploads/${filename}`,
  };
};

export const uploadImageBuffer = (buffer, folder = 'room-rental-app', originalname) => {
  if (!isCloudinaryConfigured()) {
    return Promise.resolve(uploadImageBufferLocal(buffer, originalname));
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export const uploadImages = async (files, folder) => {
  const results = await Promise.all(
    files.map((file) => uploadImageBuffer(file.buffer, folder, file.originalname))
  );
  return results.map((result) => ({
    public_id: result.public_id,
    url: result.secure_url || result.url,
  }));
};

const deleteImageLocal = async (publicId) => {
  const filename = publicId.replace(/^local\//, '');
  const filePath = path.join(UPLOADS_DIR, path.basename(filename));
  try {
    if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
  } catch {}
};

export const deleteImage = async (publicId) => {
  try {
    if (String(publicId).startsWith('local/')) {
      await deleteImageLocal(publicId);
      return;
    }
    if (!isCloudinaryConfigured()) return;
    await cloudinary.uploader.destroy(publicId);
  } catch {}
};
