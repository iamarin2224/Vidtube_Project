import {Router} from "express"

import {
    uploadVideo,
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
    uploadVideo
)

export default router