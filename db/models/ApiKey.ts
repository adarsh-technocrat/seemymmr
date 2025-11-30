import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "crypto";

export interface IApiKey extends Document {
  websiteId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // User who created the key
  name: string; // e.g., "Prod Key", "Dev Key"
  key: string; // The hashed API key (stored in DB)
  keyPrefix: string; // First 11 characters for display (e.g., "df_abc12345")
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
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
    name: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keyPrefix: {
      type: String,
      required: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate a new API key
ApiKeySchema.statics.generate = function (
  websiteId: string,
  userId: string,
  name: string
) {
  const randomBytes = crypto.randomBytes(32);
  const key = `df_${randomBytes.toString("hex")}`;
  const keyPrefix = key.substring(0, 11); // "df_" + 8 chars

  // Hash the key for storage
  const hashedKey = crypto.createHash("sha256").update(key).digest("hex");

  return {
    key, // Return plain key only once
    keyPrefix,
    hashedKey, // Store this in DB
  };
};

// Verify an API key
ApiKeySchema.statics.verify = async function (apiKey: string) {
  const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");
  return this.findOne({ key: hashedKey });
};

// Prevent model re-compilation during hot reload in development
const ApiKey: Model<IApiKey> =
  mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", ApiKeySchema);

export default ApiKey;
