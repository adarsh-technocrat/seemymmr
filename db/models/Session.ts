import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
  websiteId: mongoose.Types.ObjectId;
  sessionId: string; // Unique session identifier
  visitorId: string; // Persistent visitor identifier
  userId?: string; // If user identification is enabled

  // First visit data
  firstVisitAt: Date;
  referrer?: string;
  referrerDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;

  // Device & Location
  device: "desktop" | "mobile" | "tablet";
  browser: string;
  browserVersion?: string;
  os: string;
  osVersion?: string;
  country: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;

  // Tracking
  pageViews: number;
  duration: number; // seconds
  bounce: boolean;
  lastSeenAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
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
    userId: {
      type: String,
      index: true,
    },
    firstVisitAt: {
      type: Date,
      required: true,
      index: true,
    },
    referrer: {
      type: String,
    },
    referrerDomain: {
      type: String,
      index: true,
    },
    utmSource: {
      type: String,
      index: true,
    },
    utmMedium: {
      type: String,
      index: true,
    },
    utmCampaign: {
      type: String,
      index: true,
    },
    utmTerm: {
      type: String,
    },
    utmContent: {
      type: String,
    },
    device: {
      type: String,
      enum: ["desktop", "mobile", "tablet"],
      required: true,
      index: true,
    },
    browser: {
      type: String,
      required: true,
      index: true,
    },
    browserVersion: {
      type: String,
    },
    os: {
      type: String,
      required: true,
      index: true,
    },
    osVersion: {
      type: String,
    },
    country: {
      type: String,
      required: true,
      index: true,
    },
    region: {
      type: String,
    },
    city: {
      type: String,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    pageViews: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    bounce: {
      type: Boolean,
      default: true,
    },
    lastSeenAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

SessionSchema.index({ websiteId: 1, createdAt: -1 });
SessionSchema.index({ websiteId: 1, lastSeenAt: -1 });
SessionSchema.index({ websiteId: 1, firstVisitAt: 1 });
SessionSchema.index({ visitorId: 1, websiteId: 1 });

// Prevent model re-compilation during hot reload in development
const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default Session;
