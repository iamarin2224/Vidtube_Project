import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const healthcheck = asyncHandler (async (req, res) => {
    return res.status(200).json(new ApiResponse(200, "ok", "Healthcheck Passed"))
    //these automatically stringifies the apiresponse object and attaches a json content to the response
})

export {healthcheck}