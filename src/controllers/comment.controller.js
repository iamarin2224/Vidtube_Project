import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/users.models.js";
import { Comment } from "../models/comments.models.js";
import { Tweet } from "../models/tweets.models.js";
import { Video } from "../models/videos.models.js";

const commentOnVideo = asyncHandler(async (req, res) => {

    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(404, "Video Id not found");
    }
    const video = await Video.findById(videoId)
    if (!video){
        throw new ApiError(404, "Video not found in database");
    }

    const userID = req.user?._id;
    if(!userID){
        throw new ApiError(404, "User Id not found. Please ensure you are logged in!");
    }
    const user = await User.findById(userID);
    if (!user){
        throw new ApiError(404, "User not found in database");
    }

    const {content} = req.body;
    if (!content || content.trim() == ""){
        throw new ApiError(400, "Content cannot be empty")
    }

    try {
        const comment = await Comment.create({
            videoId,
            content,
            owner: user._id
        })

        const createdComment = await Comment.findById(comment._id).select("-tweetId")

        if(!createdComment){
            throw new ApiError(500, "Something went wrong, comment can be made.")
        }

        return res.status(201).json(new ApiResponse(201, createdComment, "Comment was made on the video successfully"))

    } catch (error) {
        console.log("Error in creating comment, error:", error);
        throw new ApiError(500, "Something went wrong while commenting.");
    }
        
})

const commentOnTweet = asyncHandler(async (req, res) => {

    const {tweetId} = req.params;
    if(!tweetId){
        throw new ApiError(404, "Tweet Id not found");
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet){
        throw new ApiError(404, "Tweet not found in database");
    }

    const userID = req.user?._id;
    if(!userID){
        throw new ApiError(404, "User Id not found. Please ensure you are logged in!");
    }
    const user = await User.findById(userID);
    if (!user){
        throw new ApiError(404, "User not found in database");
    }

    const {content} = req.body;
    if (!content || content.trim() == ""){
        throw new ApiError(400, "Content cannot be empty")
    }

    try {
        const comment = await Comment.create({
            tweetId,
            content,
            owner: user._id
        })

        const createdComment = await Comment.findById(comment._id).select("-videoId")

        if(!createdComment){
            throw new ApiError(500, "Something went wrong, comment can be made.")
        }

        return res.status(201).json(new ApiResponse(201, createdComment, "Comment was made on the tweet successfully"))
        
    } catch (error) {
        console.log("Error in creating comment, error:", error);
        throw new ApiError(500, "Something went wrong while commenting.");
    }
        
})

const editComment = asyncHandler(async (req, res) => {

    const {content} = req.body
    if (!content || content.trim() == ""){
        throw new ApiError(400, "Content cannot be empty")
    }

    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(404, "Comment Id not found")
    }
    const comment = await Comment.findById(commentId)
    if (!comment){
        throw new ApiError(404, "Comment not found in database")
    }

    const userID = req.user?._id
    if(!userID){
        throw new ApiError(404, "User Id not found. Please ensure you are logged in!")
    }
    const user = await User.findById(userID)
    if (!user){
        throw new ApiError(404, "User not found in database")
    }

    if (user._id.toString() !== comment.owner.toString()) {
        throw new ApiError(401, "User not authorized, comment can only be updated by owner")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        comment._id,
        {
            $set: {
                content
            }
        },
        {new: true}
    )

    const commentObj = updatedComment.toObject();

    if(!updatedComment.tweetId) delete commentObj.tweetId
    if(!updatedComment.videotId) delete commentObj.videoId
    
    return res.status(200).json(new ApiResponse(200, commentObj, "Comment edited successfully")) 

})

const deleteComment = asyncHandler(async (req, res) => {

    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(404, "Comment Id not found")
    }
    const comment = await Comment.findById(commentId)
    if (!comment){
        throw new ApiError(404, "Comment not found in database")
    }

    const userID = req.user?._id
    if(!userID){
        throw new ApiError(404, "User Id not found. Please ensure you are logged in!")
    }
    const user = await User.findById(userID)
    if (!user){
        throw new ApiError(404, "User not found in database")
    }

    if (user._id.toString() !== comment.owner.toString()) {
        throw new ApiError(401, "User not authorized, comment can only be deleted by owner")
    }

    await Comment.findByIdAndDelete(comment._id)
    
    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully")) 

})

export {
    commentOnVideo,
    commentOnTweet,
    editComment,
    deleteComment
}