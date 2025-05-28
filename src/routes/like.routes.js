import { Router } from "express";

import {
    likeVideo,
    likeTweet,
    likeComment,
    unlike,
    getLikesCount,
    likeStatus
} from "../controllers/like.controller.js"

import { verifyJWT } from "../middlewares/auth.middlware.js";

const router = Router()

router.route("/video/:videoId").post(verifyJWT, likeVideo)

router.route("/tweet/:tweetId").post(verifyJWT, likeTweet)

router.route("/comment/:commentId").post(verifyJWT, likeComment)

router.route("/unlike/:likeId").delete(verifyJWT, unlike)

router.route("/get-count/:type/:id").get(getLikesCount)

router.route("/get-status/:type/:id").get(verifyJWT, likeStatus)

export default router