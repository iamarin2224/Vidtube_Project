import { Router } from "express";

import {
    postTweet,
    editTweet,
    deleteTweet
} from "../controllers/tweet.controller.js";

import { verifyJWT } from "../middlewares/auth.middlware.js";

const router = Router();

router.route("/post").post(verifyJWT, postTweet);

router.route("/edit/:tweetId").patch(verifyJWT, editTweet);

router.route("/delete/:tweetId").delete(verifyJWT, deleteTweet);

export default router