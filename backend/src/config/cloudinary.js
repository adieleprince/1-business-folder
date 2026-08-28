import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const cloudinaryConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true
  });
} else {
  console.warn(
    "⚠️  CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are not fully set — " +
    "product image and payment receipt uploads will be rejected until they are configured. " +
    "Local disk storage is not used because Render wipes the filesystem on every redeploy/restart."
  );
}

/**
 * Uploads a Buffer (from multer's memoryStorage) to Cloudinary.
 * resourceType: "image" for product photos, "auto" for receipts (image or PDF) —
 * Cloudinary decides "image" or "raw" and reports it back as result.resource_type.
 */
export function uploadBufferToCloudinary(buffer, { folder, resourceType = "image" }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Deletes a previously-uploaded file by its Cloudinary public_id.
 * resourceType must be the real type Cloudinary stored it as ("image" or "raw") —
 * never "auto". Never throws — a failed cleanup shouldn't break the caller's request.
 */
export async function deleteFromCloudinary(publicId, resourceType = "image") {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error(`CLOUDINARY DELETE ERROR (${publicId}):`, error);
  }
}

export default cloudinary;