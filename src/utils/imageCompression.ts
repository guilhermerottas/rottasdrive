/**
 * Compress an image file using canvas.
 * 
 * @param file - The original image File
 * @param quality - JPEG quality (0-1). Lower = smaller file. Default 0.7
 * @param maxWidth - Max width in pixels. Default 1920
 * @param maxHeight - Max height in pixels. Default 1920
 * @returns A new compressed File (JPEG) or the original if not an image
 */
export async function compressImage(
  file: File,
  quality: number = 0.7,
  maxWidth: number = 1920,
  maxHeight: number = 1920
): Promise<File> {
  // Only compress images
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Skip SVGs and GIFs (they don't benefit from canvas compression)
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // Only use compressed version if it's actually smaller
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          // Keep original name but change extension for JPEG output
          const name = file.name.replace(/\.[^.]+$/, ".jpg");
          const compressed = new File([blob], name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          // Image compression completed

          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original on error
    };

    img.src = url;
  });
}

/**
 * Compress an image aggressively for thumbnails/covers.
 * Targets 50-80% size reduction with max 800px dimensions.
 */
export async function compressCoverImage(file: File): Promise<File> {
  return compressImage(file, 0.5, 800, 800);
}

/**
 * Compress an image for general uploads.
 * Targets 30-50% size reduction while preserving quality.
 */
export async function compressUploadImage(file: File): Promise<File> {
  return compressImage(file, 0.8, 2560, 2560);
}
