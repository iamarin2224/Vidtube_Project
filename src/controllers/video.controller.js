import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/users.models.js";
import { Video } from "../models/videos.models.js";
import { uploadOnCloudinary, deleteFromCloudinary, extractPublicId, deleteVideoFromCloudinary } from "../utils/cloudinary.js"
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

    const userID = req.user?._id
    if(!userID){
        throw new ApiError(404, "User Id not found. Please ensure you are logged in!")
    }
    const user = await User.findById(userID)
    if (!user){
        throw new ApiError(404, "User not found in database")
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
            await deleteFromCloudinary(thumbnail.public_id);
        }
        throw new ApiError(500, "Something went wrong while uploading the video. Uploaded data and files were deleted")
    }


})

const viewVideo = asyncHandler(async (req, res) => {

    const {videoId} = req.params

    const userID = req.user?._id
    if(!userID){
        throw new ApiError(404, "User Id not found. Please log in to view")
    }

    const user = await User.findById(userID)
    if (!user){
        throw new ApiError(404, "User not found in database")
    }

    const alreadyWatched = user.watchHistory.includes(videoId)
    if(!alreadyWatched){
        user.watchHistory.push(videoId);
        await user.save({validateBeforeSave: false})
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 }
        },
        {new: true}
    ).populate("owner", "username avatar")

    if(!video){
        throw new ApiError(404, "Video not found in database")
    }

    return res.status(200).json(new ApiResponse(201, video, "Video viewed successfully"))    

})

const getVideoDetails = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(404, "Video Id not found")
    }
    const video = await Video.findById(videoId)
    if (!video){
        throw new ApiError(404, "Video not found in database")
    }
    return res.status(200).json(new ApiResponse(200, video, "Video data updated successfully")) 
})

const updateVideoDetails = asyncHandler(async (req, res) => {

    const {title, description} = req.body
    if (!title || !description){
        throw new ApiError(404, "Title and description are reuired")
    }

    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(404, "Video Id not found")
    }
    const video = await Video.findById(videoId)
    if (!video){
        throw new ApiError(404, "Video not found in database")
    }

    const userID = req.user?._id
    if(!userID){
        throw new ApiError(404, "User Id not found. Please ensure you are logged in!")
    }
    const user = await User.findById(userID)
    if (!user){
        throw new ApiError(404, "User not found in database")
    }

    // console.log("UserId:", user._id, "VideoOwnerId:", video.owner);

    if (user._id.toString() !== video.owner.toString()) {
        throw new ApiError(401, "User not authorized, video details can only be changed by owner")
    }

    const newVideo = await Video.findByIdAndUpdate(
        video._id,
        {
            $set:   {
                title,
                description
            }
        },
        {new: true}
    )

    return res.status(200).json(new ApiResponse(200, newVideo, "Video data updated successfully")) 

})

const updateVideoThumbnail = asyncHandler(async (req, res) => {

    const thumbnailFilePath = req.file?.path
    if(!thumbnailFilePath){
        throw new ApiError(404, "Thumbnail file is required")
    }

    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(404, "Video Id not found")
    }
    const video = await Video.findById(videoId)
    if (!video){
        throw new ApiError(404, "Video not found in database")
    }

    const userID = req.user?._id
    if(!userID){
        throw new ApiError(404, "User Id not found. Please ensure you are logged in!")
    }
    const user = await User.findById(userID)
    if (!user){
        throw new ApiError(404, "User not found in database")
    }

    if (user._id.toString() !== video.owner.toString()) {
        throw new ApiError(401, "User not authrorized, video details can only be changed by owner")
    }

    let thumbnail;
    try {
        thumbnail = await uploadOnCloudinary(thumbnailFilePath)
    } catch (error) {
        console.log("Error in uploading thumbnail", error);
        throw new ApiError(500, "Failed to upload thumbnail")
    }

    const publicId = extractPublicId(video.thumbnail);
    await deleteFromCloudinary(publicId)

    const newVideo = await Video.findByIdAndUpdate(
        video._id,
        {
            $set:   {
                thumbnail: thumbnail.secure_url
            }
        },
        {new: true}
    )

    return res.status(200).json(new ApiResponse(200, newVideo, "Video thumbnail updated successfully")) 

})

const deleteVideo = asyncHandler(async (req, res) => {

    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(404, "Video Id not found")
    }
    const video = await Video.findById(videoId)
    if (!video){
        throw new ApiError(404, "Video not found in database")
    }

    const userID = req.user?._id
    if(!userID){
        throw new ApiError(404, "User Id not found. Please ensure you are logged in!")
    }
    const user = await User.findById(userID)
    if (!user){
        throw new ApiError(404, "User not found in database")
    }

    if (user._id.toString() !== video.owner.toString()) {
        throw new ApiError(401, "User not authorized, video can only be deleted by owner")
    }

    const videoFilePublicId = extractPublicId(video.videoFile);
    await deleteVideoFromCloudinary(videoFilePublicId)

    const thumbnailPublicId = extractPublicId(video.thumbnail);
    await deleteFromCloudinary(thumbnailPublicId)

    await Video.findByIdAndDelete(video._id)
    
    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully")) 

})

const getUploadedVideos = asyncHandler(async (req, res) => {

    const userID = req.user?._id
    if(!userID){
        throw new ApiError(404, "User Id not found. Please ensure you are logged in!")
    }
    const user = await User.findById(userID)
    if (!user){
        throw new ApiError(404, "User not found in database")
    }

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(user._id)
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, videos, "List of uploaded videos fetched successfully"))
})

export {
    uploadVideo,
    getVideoDetails,
    viewVideo,
    updateVideoDetails,
    updateVideoThumbnail,
    deleteVideo,
    getUploadedVideos
}