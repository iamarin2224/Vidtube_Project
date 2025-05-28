import { Router } from "express";

import {
    commentOnVideo,
    commentOnTweet,
    editComment,
    deleteComment
} from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middlware.js";

const router = Router()

router.route("/video/:videoId").post(verifyJWT, commentOnVideo)

router.route("/tweet/:tweetId").post(verifyJWT, commentOnTweet)

router.route("/edit/:commentId").patch(verifyJWT, editComment)

router.route("/delete/:commentId").delete(verifyJWT, deleteComment)

export default router