import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGoalEvent extends Document {
  websiteId: mongoose.Types.ObjectId;
  goalId: mongoose.Types.ObjectId;
  sessionId: string;
  visitorId: string;
  path: string;
  value?: number; // Optional monetary value
  customData?: Record<string, any>; // Custom data attributes from tracking script
  timestamp: Date;
  createdAt: Date;
}

const GoalEventSchema = new Schema<IGoalEvent>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },
    goalId: {
      type: Schema.Types.ObjectId,
      ref: "Goal",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
    },
    customData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
GoalEventSchema.index({ websiteId: 1, timestamp: -1 });
GoalEventSchema.index({ websiteId: 1, goalId: 1, timestamp: -1 });

// Prevent model re-compilation during hot reload in development
const GoalEvent: Model<IGoalEvent> =
  mongoose.models.GoalEvent ||
  mongoose.model<IGoalEvent>("GoalEvent", GoalEventSchema);

export default GoalEvent;
