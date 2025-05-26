import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema(
    {
        videoId: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        tweetId: {
            type: Schema.Types.ObjectId,
            ref: "Tweet"
        },
        commentId: {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
)

export const Like = mongoose.model("Like", likeSchema);