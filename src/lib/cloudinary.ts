import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(file: File | { path: string }, folder: string) {
  try {
    let buffer: Buffer;
    
    if ('path' in file) {
      // This is a server file (from form-data)
      const fs = await import('fs');
      buffer = await fs.promises.readFile(file.path);
    } else {
      // This is a browser file
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    }

    // Compress and resize the image
    const sharp = (await import('sharp')).default;
    const compressedBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 75, progressive: true })
      .toBuffer();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `menuhub/${folder}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(compressedBuffer);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}