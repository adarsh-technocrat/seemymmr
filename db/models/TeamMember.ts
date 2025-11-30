import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeamMember extends Document {
  websiteId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // User who is a team member
  invitedBy: mongoose.Types.ObjectId; // User who invited them
  role: "viewer" | "editor" | "admin";
  status: "pending" | "accepted" | "declined";
  invitedAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["viewer", "editor", "admin"],
      default: "viewer",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying team members by website
TeamMemberSchema.index({ websiteId: 1, userId: 1 }, { unique: true });
TeamMemberSchema.index({ websiteId: 1, status: 1 });

// Prevent model re-compilation during hot reload in development
const TeamMember: Model<ITeamMember> =
  mongoose.models.TeamMember ||
  mongoose.model<ITeamMember>("TeamMember", TeamMemberSchema);

export default TeamMember;
