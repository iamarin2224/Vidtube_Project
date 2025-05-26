import dotenv from "dotenv";
import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

dotenv.config()

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
// console.log("API Key:", process.env.CLOUDINARY_API_KEY);
// console.log("API Secret:", process.env.CLOUDINARY_API_SECRET);

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath) //deleting from server after it is uploaded to cloud
        console.log(`File uploaded with url: ${response.url}`);
        return response
    } catch (error) {
        console.log("Cloudinary file upload error: ", error);
        if (fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath)
        }
        return null
    }
}

const  extractPublicId = (cloudinaryUrl) => {
  // Step 1: Remove query params if any
  const urlWithoutParams = cloudinaryUrl.split('?')[0];

  // Step 2: Split the URL by '/'
  const parts = urlWithoutParams.split('/');

  // Step 3: Get the last part (which is the filename with extension)
  const filename = parts[parts.length - 1]; // e.g., 'nm1hq0jksuqwpb6u9m3t.jpg'

  // Step 4: Remove the extension (e.g., .jpg, .png, etc.)
  const publicId = filename.replace(/\.[^/.]+$/, '');

  return publicId;
}


const deleteFromCloudinary = async (publicId) => {
    try {
        const result = cloudinary.uploader.destroy(publicId)
        console.log("Deleted from cloudinary with Public ID: ", publicId);
    } catch (error) {
        console.log("Error deleting from cloudinary: ", error);
        return null
    }
}

export {uploadOnCloudinary, deleteFromCloudinary, extractPublicId}