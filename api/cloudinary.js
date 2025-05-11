import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload an image to Cloudinary
 * @param {string} image - Base64 encoded image
 * @param {string} folder - Folder to upload to
 * @returns {Promise} - Cloudinary upload response
 */
export async function uploadImage(image, folder = 'travel-nexus') {
  try {
    const result = await cloudinary.uploader.upload(image, {
      folder,
      resource_type: 'auto'
    });
    
    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise} - Cloudinary delete response
 */
export async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return { result };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
}
