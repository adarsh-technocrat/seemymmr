import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFeedbackComment extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  body: string;
  upvoteCount: number;
  upvotedBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackCommentSchema = new Schema<IFeedbackComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "FeedbackPost",
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
    upvoteCount: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

FeedbackCommentSchema.index({ postId: 1, createdAt: 1 });

const FeedbackComment: Model<IFeedbackComment> =
  mongoose.models.FeedbackComment ||
  mongoose.model<IFeedbackComment>("FeedbackComment", FeedbackCommentSchema);

export default FeedbackComment;
