import {Router} from "express"

import {
    uploadVideo,
    viewVideo,
    updateVideoDetails,
    updateVideoThumbnail
} from "../controllers/video.controller.js"

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlware.js";

const router = Router();

router.route("/upload-video").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        }, 
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    verifyJWT,
    uploadVideo
)

router.route("/view/:videoId").patch(verifyJWT, viewVideo)

router.route("/update/:videoId").patch(verifyJWT, updateVideoDetails)

router.route("/update/thumbnail/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideoThumbnail) 

export default router