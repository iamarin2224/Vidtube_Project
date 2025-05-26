import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/users.models.js";
import { Video } from "../models/videos.models.js";
import { uploadOnCloudinary, deleteFromCloudinary, extractPublicId, deleteVideoFromCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

//upload video
const uploadVideo = asyncHandler(async (req, res) => {
    const {title, description} = req.body
    if (!(title && description)){
        throw new ApiError(400, "Title and Description are required")
    }

    const videoFilePath = req.files?.videoFile?.[0]?.path;
    const thumbnailFilePath = req.files?.thumbnail?.[0]?.path;
    if (!(videoFilePath && thumbnailFilePath)){
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    let videoFile;
    try {
        videoFile = await uploadOnCloudinary(videoFilePath)
    } catch (error) {
        console.log("Error in uploading video", error);
        throw new ApiError(500, "Failed to upload video")
    }

    let thumbnail;
    try {
        thumbnail = await uploadOnCloudinary(thumbnailFilePath)
    } catch (error) {
        console.log("Error in uploading thumbnail", error);
        throw new ApiError(500, "Failed to upload thumbnail")
    }

    const userID = req.user?._id
    if(!userID){
        await deleteVideoFromCloudinary(videoFile.public_id);
        await deleteVideoFromCloudinary(thumbnail.public_id);
        throw new ApiError(404, "User Id not found. Please ensure you are logged in!")
    }

    const user = await User.findById(req.user?._id)
    if (!user){
        throw new ApiError(404, "User not found in database")
    }
    
    let video;
    try {
        video = await Video.create({
            videoFile: videoFile.secure_url,
            thumbnail: thumbnail.secure_url,
            title,
            description,
            duration: videoFile.duration,
            owner: user._id
        })

        //additional check if video created
        const uploadedVideo = await Video.findById(video._id)
        if(!uploadVideo){
            throw new ApiError(500, "Something went wrong while creating database entry for the video")
        }
        else{
            console.log("Video uploaded and record created successfully with id:", video._id);
        }

        return res.status(201).json(new ApiResponse(201, uploadedVideo, "Video was successfully uploaded"))

    } catch (error) {
        console.log("Video uploading failed: ", error);
        if (video?._id) {
            await Video.findByIdAndDelete(video._id)
        }
        if (videoFile) {
            await deleteVideoFromCloudinary(videoFile.public_id);
        }
        if (thumbnail) {
            await deleteVideoFromCloudinary(thumbnail.public_id);
        }
        throw new ApiError(500, "Something went wrong while uploading the video. Uploaded data and files were deleted")
    }


})

export {
    uploadVideo
}