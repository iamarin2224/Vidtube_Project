import mongoose, {Schema} from "mongoose";

const commentSchema = new Schema(
    {
        content: {
            type: String, 
            required: true
        },
        videoId: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        tweetId: {
            type: Schema.Types.ObjectId,
            ref: "Tweet"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
)

export const Comment = mongoose.model("Comment", commentSchema);