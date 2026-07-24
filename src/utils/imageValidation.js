/**
 * Helper utility for client-side image dimension validation before upload.
 */

/**
 * Reads an image file and resolves its dimensions (width, height, aspect ratio).
 * @param {File} file - The file selected by the user.
 * @returns {Promise<{width: number, height: number, aspectRatio: string, numericRatio: number}>}
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not a valid image.'));
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(objectUrl);

      const numericRatio = height > 0 ? width / height : 0;
      let aspectRatio = `${width}:${height}`;

      // Simplify common aspect ratios
      if (Math.abs(numericRatio - 16 / 9) < 0.1) {
        aspectRatio = '16:9';
      } else if (Math.abs(numericRatio - 4 / 3) < 0.1) {
        aspectRatio = '4:3';
      } else if (Math.abs(numericRatio - 1) < 0.05) {
        aspectRatio = '1:1';
      } else if (Math.abs(numericRatio - 21 / 9) < 0.1) {
        aspectRatio = '21:9';
      }

      resolve({
        width,
        height,
        numericRatio,
        aspectRatio
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for validation. File may be corrupted.'));
    };

    img.src = objectUrl;
  });
};

/**
 * Validates an image file against specific dimension requirements.
 * @param {File} file - Image file to validate
 * @param {'banner' | 'logo'} imageType - Type of image
 * @returns {Promise<{
 *   isValid: boolean,
 *   dimensions: {width: number, height: number, aspectRatio: string},
 *   error: string | null,
 *   warning: string | null,
 *   qualityScore: 'optimal' | 'warning' | 'error'
 * }>}
 */
export const validateEventImage = async (file, imageType = 'banner') => {
  const MAX_FILE_SIZE_MB = 10;
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return {
      isValid: false,
      dimensions: null,
      error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
      warning: null,
      qualityScore: 'error'
    };
  }

  try {
    const dimensions = await getImageDimensions(file);
    const { width, height, aspectRatio, numericRatio } = dimensions;

    if (imageType === 'banner') {
      const MIN_WIDTH = 1200;
      const MIN_HEIGHT = 630;
      const REC_WIDTH = 1920;
      const REC_HEIGHT = 1080;

      // 1. Check minimum requirements
      if (width < MIN_WIDTH || height < MIN_HEIGHT) {
        return {
          isValid: false,
          dimensions,
          error: `Banner resolution (${width}×${height}px) is below minimum requirement (${MIN_WIDTH}×${MIN_HEIGHT}px).`,
          warning: null,
          qualityScore: 'error'
        };
      }

      // 2. Check optimal recommendations
      let warning = null;
      let qualityScore = 'optimal';

      if (width < REC_WIDTH || height < REC_HEIGHT) {
        warning = `Banner resolution is ${width}×${height}px. Recommended resolution for high quality display is ${REC_WIDTH}×${REC_HEIGHT}px (16:9).`;
        qualityScore = 'warning';
      } else if (Math.abs(numericRatio - 16 / 9) > 0.3) {
        warning = `Banner aspect ratio (${aspectRatio}) deviates from standard 16:9 format. Image may crop on wide screens.`;
        qualityScore = 'warning';
      }

      return {
        isValid: true,
        dimensions,
        error: null,
        warning,
        qualityScore
      };
    }

    if (imageType === 'logo') {
      const MIN_SIZE = 100;
      const REC_SIZE = 200;

      if (width < MIN_SIZE || height < MIN_SIZE) {
        return {
          isValid: false,
          dimensions,
          error: `Logo resolution (${width}×${height}px) is too small. Minimum required size is ${MIN_SIZE}×${MIN_SIZE}px.`,
          warning: null,
          qualityScore: 'error'
        };
      }

      let warning = null;
      let qualityScore = 'optimal';

      if (width < REC_SIZE || height < REC_SIZE) {
        warning = `Logo resolution is ${width}×${height}px. Recommended minimum size is ${REC_SIZE}×${REC_SIZE}px for sharp rendering.`;
        qualityScore = 'warning';
      }

      return {
        isValid: true,
        dimensions,
        error: null,
        warning,
        qualityScore
      };
    }

    return {
      isValid: true,
      dimensions,
      error: null,
      warning: null,
      qualityScore: 'optimal'
    };
  } catch (err) {
    return {
      isValid: false,
      dimensions: null,
      error: err.message || 'Image validation failed',
      warning: null,
      qualityScore: 'error'
    };
  }
};
