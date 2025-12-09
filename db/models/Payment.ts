import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  websiteId: mongoose.Types.ObjectId;
  provider: "stripe" | "lemonsqueezy" | "polar" | "paddle" | "other";
  providerPaymentId: string;
  amount: number;
  currency: string;
  renewal: boolean;
  refunded: boolean;

  customerEmail?: string;
  customerId?: string;
  sessionId?: string;
  visitorId?: string;

  // Metadata
  metadata?: Record<string, any>;

  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    visitorId: {
      type: String,
      index: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "lemonsqueezy", "polar", "paddle", "other"],
      required: true,
      index: true,
    },
    providerPaymentId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "usd",
    },
    renewal: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    refunded: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    customerEmail: {
      type: String,
      index: true,
    },
    customerId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
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
PaymentSchema.index({ websiteId: 1, timestamp: -1 });
PaymentSchema.index({ websiteId: 1, renewal: 1, timestamp: -1 });
PaymentSchema.index({ websiteId: 1, refunded: 1, timestamp: -1 });
PaymentSchema.index({ provider: 1, providerPaymentId: 1 }, { unique: true });

// Prevent model re-compilation during hot reload in development
const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
