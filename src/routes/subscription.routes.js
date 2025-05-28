import { Router } from "express";

import { 
    subscribeToChannel,
    unsubscribeChannel
} from "../controllers/subscription.controller.js";

import { verifyJWT } from "../middlewares/auth.middlware.js";

const router = Router();

router.route("/subscribe/:username").post(verifyJWT, subscribeToChannel)

router.route("/unsubscribe/:username").delete(verifyJWT, unsubscribeChannel)

export default router