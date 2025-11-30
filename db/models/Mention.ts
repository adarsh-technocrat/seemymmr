import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMention extends Document {
  websiteId: mongoose.Types.ObjectId;
  date: Date; // Date of the mention (indexed for querying by date)

  // Twitter/X mention data
  text: string;
  url?: string;
  type: "profile" | "gear" | "other";
  authorUsername?: string;
  authorAvatarUrl?: string;

  // Metadata
  tweetId?: string;
  retweetCount?: number;
  likeCount?: number;

  createdAt: Date;
  updatedAt: Date;
}

const MentionSchema = new Schema<IMention>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    url: {
      type: String,
    },
    type: {
      type: String,
      enum: ["profile", "gear", "other"],
      default: "other",
    },
    authorUsername: {
      type: String,
    },
    authorAvatarUrl: {
      type: String,
    },
    tweetId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    retweetCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying mentions by website and date
MentionSchema.index({ websiteId: 1, date: -1 });

// Prevent model re-compilation during hot reload in development
const Mention: Model<IMention> =
  mongoose.models.Mention || mongoose.model<IMention>("Mention", MentionSchema);

export default Mention;
