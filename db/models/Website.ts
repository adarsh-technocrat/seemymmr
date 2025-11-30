import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWebsite extends Document {
  userId: mongoose.Types.ObjectId;
  domain: string;
  name: string;
  iconUrl?: string;
  trackingCode: string; // Unique tracking ID
  settings: {
    excludeIps?: string[];
    excludeCountries?: string[];
    excludeHostnames?: string[];
    excludePaths?: string[];
    hashPaths?: boolean;
    trackScroll?: boolean;
    trackUserIdentification?: boolean;
  };
  paymentProviders?: {
    stripe?: { webhookSecret: string };
    lemonSqueezy?: { webhookSecret: string };
    polar?: { webhookSecret: string };
    paddle?: { webhookSecret: string };
  };
  integrations?: {
    twitter?: {
      enabled: boolean;
      username?: string; // Twitter username to track mentions for
      bearerToken?: string; // Twitter API bearer token
    };
    github?: {
      enabled: boolean;
      repositories?: Array<{
        owner: string;
        name: string;
        accessToken?: string; // Repository-specific token
      }>;
    };
    googleSearchConsole?: {
      enabled: boolean;
      propertyUrl?: string; // GSC property URL
      accessToken?: string; // OAuth access token
      refreshToken?: string; // OAuth refresh token
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteSchema = new Schema<IWebsite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    iconUrl: {
      type: String,
    },
    trackingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    settings: {
      excludeIps: [String],
      excludeCountries: [String],
      excludeHostnames: [String],
      excludePaths: [String],
      hashPaths: {
        type: Boolean,
        default: false,
      },
      trackScroll: {
        type: Boolean,
        default: false,
      },
      trackUserIdentification: {
        type: Boolean,
        default: false,
      },
    },
    paymentProviders: {
      stripe: {
        webhookSecret: String,
      },
      lemonSqueezy: {
        webhookSecret: String,
      },
      polar: {
        webhookSecret: String,
      },
      paddle: {
        webhookSecret: String,
      },
    },
    integrations: {
      twitter: {
        enabled: {
          type: Boolean,
          default: false,
        },
        username: String,
        bearerToken: String,
      },
      github: {
        enabled: {
          type: Boolean,
          default: false,
        },
        repositories: [
          {
            owner: String,
            name: String,
            accessToken: String,
          },
        ],
      },
      googleSearchConsole: {
        enabled: {
          type: Boolean,
          default: false,
        },
        propertyUrl: String,
        accessToken: String,
        refreshToken: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model re-compilation during hot reload in development
const Website: Model<IWebsite> =
  mongoose.models.Website || mongoose.model<IWebsite>("Website", WebsiteSchema);

export default Website;
