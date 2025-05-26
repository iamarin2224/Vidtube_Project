import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/users.models.js";
import { uploadOnCloudinary, deleteFromCloudinary, extractPublicId } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

//helper function
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if(!user){
            throw new ApiError(404, "User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // console.log("AT: ", accessToken, "RT: ", refreshToken);
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Error in generating access and refresh token", error);
    }
}

//register user route
const registerUser = asyncHandler(async (req, res) => {

    const {fullname, username, email, password} = req.body;

    //empty fields
    if (
        [fullname, username, email, password].some((fields) => fields?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }
    
    //whether user exists or not
    const userExists = await User.findOne({
        $or: [{username}, {email}]  //mongodb built in method
    })
    if(userExists){
        throw new ApiError(409, "User with given username/email already exists");
    }

    //handling the files
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

/*
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    let coverImage = ""
    if(coverLocalPath){
        coverImage = await uploadOnCloudinary(coverLocalPath);
    }
*/

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
    } catch (error) {
        console.log("Error in uploading avatar", error);
        throw new ApiError(500, "Failed to upload avatar")
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    } catch (error) {
        console.log("Error in uploading coverImage", error);
        throw new ApiError(500, "Failed to upload coverImage")
    }

    //handling the user
    let user;
    try {
        user = await User.create({
            fullname,
            username: username.toLowerCase(),
            email,
            password,
            avatar: avatar.secure_url,
            coverImage: coverImage?.secure_url || ""
        })
    
        //check whether user created
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
    
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }
        else{
            console.log(`User object created successfully with id: ${user._id}\n`);
        }
    
        return res.status(201).json(new ApiResponse(201, createdUser, "User was registered successfully"))

    } catch (error) {
        console.log("User creation failed: ", error);
        if (user?._id) {
            await User.findByIdAndDelete(user._id)
        }
        if (avatar) {
            deleteFromCloudinary(avatar.public_id);
        }
        if (coverImage) {
            deleteFromCloudinary(coverImage.public_id);
        }
        throw new ApiError(500, "Something went wrong while registering the user. Uploaded data and images were deleted")
    }

})

//login user route
const loginUser = asyncHandler(async (req, res) => {

    const {email, username, password} = req.body;
    // console.log(email, username, password);
    //validation
    if (!(username || email) || !password){
        throw new ApiError(400, "All fields are required");
    }
    //finduser
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "User not found")
    }

    //password check
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid UserCredentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    // console.log("AT:", accessToken, "\nRT:", refreshToken);
    

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
}   ;


    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged-In Successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user.id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {new: true} //returns the new user (but we are not holding it so not required)
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    };


    return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "Successfully logged out the user"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token not found")
    }

    try {
        //get the decoded token to use properties inside it
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh token!")
        }

        //now verify with the stored refresh token stored in the database
        if (incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Invalid refresh token!")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        };


        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(new ApiResponse(200, {accessToken, newRefreshToken}, "Access token created successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while creating the access and refesh token")
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid UserCredentials")
    }

    user.password = newPassword;

    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getUserDetails = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User data fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullname, email} = req.body
    if (!fullname || !email){
        throw new ApiError(400, "Fullname and email are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "User data updated successfully"))    

})

const updateAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Files are required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar){
        throw new ApiError(500, "Something went wrong while uploading avatar")
    }

    const cloudinaryUrl = (await User.findById(req.user?._id))?.avatar;
    const publicId = extractPublicId(cloudinaryUrl);
    await deleteFromCloudinary(publicId);

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.secure_url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "User avatar updated successfully"))

})

const updateCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400, "Can't find cover image")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage){
        throw new ApiError(500, "Something went wrong while uploading cover image")
    }

    const cloudinaryUrl = (await User.findById(req.user?._id))?.coverImage;
    const publicId = extractPublicId(cloudinaryUrl);
    await deleteFromCloudinary(publicId);

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.secure_url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "User cover image updated successfully"))

})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params
    if(!username?.trim()){
        throw new ApiError(400, "Username is required")
    }

    const channel = await User.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscriptionList"
                }
            },
            {
                $addFields: { //these are not saved in the database
                    subscribersCount: {$size: "$subsribers"},
                    subscribedChannelsCount: {$size: "$subscriptionList"},
                    isSubsribed: {
                        $cond: {
                            if: {$in: [
                                req.user?._id, 
                                {
                                    $map: {
                                        input: "$subscribers",
                                        as: "subsArray",
                                        in: "$$subsArray.subscriber"
                                    }
                                }
                            ]},
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribersCount: 1,
                    subscribedChannelsCount: 1,
                    isSubsribed: 1,
                }
            }
        ]
    )

    if (!channel?.length){
        throw new ApiError(404, "Channel not found")
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))

})

const getWatchHistory = asyncHandler(async (req, res) => {

    const user = await User.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                        coverImage: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    if (!user){
        throw new ApiError(404, "User not found!")
    }

    return res.status(200).json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully"))

})

export {
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUserDetails,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}