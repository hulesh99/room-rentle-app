const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

export const compressImage = (file, { maxDimension = MAX_DIMENSION, quality = QUALITY } = {}) =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Not an image file'));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
              return;
            }
            const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
            const base = file.name.replace(/\.[^.]+$/, '');
            const compressed = new File([blob], `${base}.${ext}`, { type: blob.type });
            resolve(compressed);
          },
          'image/webp',
          quality
        );
      } catch (error) {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });

export const compressImages = async (files, options) =>
  Promise.all(Array.from(files).map((file) => compressImage(file, options)));
