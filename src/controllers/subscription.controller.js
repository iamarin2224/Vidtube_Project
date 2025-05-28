import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/users.models.js";
import { Subscription } from "../models/subscriptions.models.js";
import mongoose from "mongoose";

const subscribeToChannel = asyncHandler(async (req, res) => {

    const { username } = req.params;
    if (!username?.trim()){
        throw new ApiError(400, "Username is required")
    }
    const channelUser = await User.findOne({username})
    if (!channelUser) {
        throw new ApiError(404, "Channel not found in database")
    }
    const channelId = channelUser._id

    const userID = req.user?._id
    if(!userID){
        throw new ApiError(404, "User Id not found. Please log in to view")
    }
    const user = await User.findById(userID)
    if (!user){
        throw new ApiError(404, "User not found in database")
    }

    const existingRecord = await Subscription.findOne({
        subscriber: user._id,
        channel: channelId
    }).lean()
    const isSubscribed = !!existingRecord

    if (isSubscribed){
        throw new ApiError(400, "User is already subscribed to the channel")
    }

    let newSubscription;
    try {
        newSubscription = await Subscription.create({
            subscriber: user._id,
            channel: channelId
        })
    } catch (error) {
        throw new ApiError(400, "Error in subscribing")
    }

    const subscriptionRecord = await Subscription.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(newSubscription._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriptionInfo"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelInfo"
            }
        },
        {
            $unwind: "$subscriptionInfo"
        },
        {
            $unwind: "$channelInfo"
        },
        {
            $project: {
                channel: 1,
                channelUsername: "$channelInfo.username",
                subscriber: 1,
                subscriberUsername: "$subscriptionInfo.username",
                createdAt: 1
            }
        }
    ])

    return res.status(201).json(new ApiResponse(201, {subscriptionRecord}, "Successfully subscirbed to the channel"))

})

const unsubscribeChannel = asyncHandler(async (req, res) => {

    const { username } = req.params;
    if (!username?.trim()){
        throw new ApiError(400, "Username is required")
    }
    const channelUser = await User.findOne({username})
    if (!channelUser) {
        throw new ApiError(404, "Channel not found in database")
    }
    const channelId = channelUser._id

    const userID = req.user?._id
    if(!userID){
        throw new ApiError(404, "User Id not found. Please log in to view")
    }
    const user = await User.findById(userID)
    if (!user){
        throw new ApiError(404, "User not found in database")
    }

    const existingRecord = await Subscription.findOne({
        subscriber: user._id,
        channel: channelId
    })
    const isSubscribed = !!existingRecord

    if (!isSubscribed){
        throw new ApiError(400, "User is not subscribed to the channel")
    }

    await Subscription.findByIdAndDelete(existingRecord._id)

    return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed successfully"))

})

export{
    subscribeToChannel,
    unsubscribeChannel
}