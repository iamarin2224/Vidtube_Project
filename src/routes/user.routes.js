import { Router } from "express";

import { 
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
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlware.js";

const router = Router();

//unsecured routes

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1 //even though max count is one, they are still arrays
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/refresh-token").post(refreshAccessToken)

//secured routes (for such operations middlewares comes first)

router.route("/logout").post(verifyJWT, logoutUser) 

router.route("/change-password").post(verifyJWT, changePassword) 

router.route("/user-details").get(verifyJWT, getUserDetails) 

router.route("/update/account-details").patch(verifyJWT, updateAccountDetails) 

router.route("/update/avatar").post(verifyJWT, upload.single("avatar"), updateAvatar) 

router.route("/update/cover-image").post(verifyJWT, upload.single("coverImage"), updateCoverImage) 

router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)

router.route("/watch-history").get(verifyJWT, getWatchHistory)

export default router