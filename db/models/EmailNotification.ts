import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmailNotification extends Document {
  websiteId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  weeklySummary: boolean;
  trafficSpike: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailNotificationSchema = new Schema<IEmailNotification>(
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
    weeklySummary: {
      type: Boolean,
      default: false,
    },
    trafficSpike: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying notifications by website and user
EmailNotificationSchema.index({ websiteId: 1, userId: 1 }, { unique: true });

// Prevent model re-compilation during hot reload in development
const EmailNotification: Model<IEmailNotification> =
  mongoose.models.EmailNotification ||
  mongoose.model<IEmailNotification>(
    "EmailNotification",
    EmailNotificationSchema
  );

export default EmailNotification;
