import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFeedbackPost extends Document {
  title: string;
  description: string;
  userId: Types.ObjectId;
  upvoteCount: number;
  upvotedBy: Types.ObjectId[];
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackPostSchema = new Schema<IFeedbackPost>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, default: "" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    upvoteCount: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

FeedbackPostSchema.index({ createdAt: -1 });
FeedbackPostSchema.index({ upvoteCount: -1 });
FeedbackPostSchema.index({ upvoteCount: -1, createdAt: -1 });
FeedbackPostSchema.index({ userId: 1 });

const FeedbackPost: Model<IFeedbackPost> =
  mongoose.models.FeedbackPost ||
  mongoose.model<IFeedbackPost>("FeedbackPost", FeedbackPostSchema);

export default FeedbackPost;
