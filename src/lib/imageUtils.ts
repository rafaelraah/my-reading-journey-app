/**
 * Compress and resize an image file before upload.
 * Returns a new File with reduced size.
 */
export async function compressImage(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number; maxSizeKb?: number } = {}
): Promise<File> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.7, maxSizeKb = 300 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      // Try webp first, fall back to jpeg
      let q = quality;
      const tryCompress = () => {
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Failed to compress'));
              return;
            }
            if (blob.size > maxSizeKb * 1024 && q > 0.3) {
              q -= 0.1;
              tryCompress();
              return;
            }
            const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
            resolve(new File([blob], `compressed.${ext}`, { type: blob.type }));
          },
          'image/webp',
          q
        );
      };
      tryCompress();
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Crop an image given a canvas-relative crop area.
 */
export function getCroppedImage(
  image: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
  outputWidth = 400
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceW = crop.width * scaleX;
    const sourceH = crop.height * scaleY;

    const aspect = sourceH / sourceW;
    const outW = outputWidth;
    const outH = Math.round(outW * aspect);

    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, outW, outH);

    canvas.toBlob(
      blob => {
        if (!blob) return reject(new Error('Crop failed'));
        resolve(new File([blob], 'cropped.webp', { type: 'image/webp' }));
      },
      'image/webp',
      0.8
    );
  });
}
