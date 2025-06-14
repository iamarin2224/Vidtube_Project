import { Router } from "express";

import {
    commentOnVideo,
    commentOnTweet,
    editComment,
    deleteComment,
    getAllComments
} from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middlware.js";

const router = Router()

router.route("/video/:videoId").post(verifyJWT, commentOnVideo)

router.route("/tweet/:tweetId").post(verifyJWT, commentOnTweet)

router.route("/edit/:commentId").patch(verifyJWT, editComment)

router.route("/delete/:commentId").delete(verifyJWT, deleteComment)

router.route("/get-comments/:type/:id").get(getAllComments)

export default router