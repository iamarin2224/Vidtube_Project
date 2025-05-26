import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//the idea of building this middleware is to decode the access token and attach every information related to user in the req part

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    //in production grade, for mobile apps these tokens comes in this format in headers 

    if (!token){
        throw new ApiError(401, "Acess token not found")
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id).select("-password -refreshToken")

        if (!user){
            throw new ApiError(401, "Unauthorized")
        }

        req.user = user //?adding new info to the req

        next() //transfer control to next middleware

    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized")
    }
})
