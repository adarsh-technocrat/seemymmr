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
    // New settings
    timezone?: string; // e.g., "America/New_York"
    colorScheme?: string; // Hex color for charts, e.g., "#e78468"
    nickname?: string; // Friendly nickname
    additionalDomains?: string[]; // Other domains that can send data
    publicDashboard?: {
      enabled: boolean;
      shareId?: string; // Unique ID for public sharing
    };
    publicRealtimeGlobe?: {
      enabled: boolean;
      shareId?: string; // Unique ID for public realtime globe sharing
    };
    attackMode?: {
      enabled: boolean;
      autoActivate: boolean; // Auto-activate on traffic spike
      threshold?: number; // Traffic spike threshold
      activatedAt?: Date;
    };
    primaryGoalId?: mongoose.Types.ObjectId; // #1 KPI goal
  };
  paymentProviders?: {
    stripe?: {
      apiKey?: string;
      webhookSecret?: string;
      syncConfig?: {
        enabled?: boolean;
        frequency?: "realtime" | "hourly" | "every-6-hours" | "daily";
        lastSyncAt?: Date;
        nextSyncAt?: Date;
      };
    };
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
      timezone: {
        type: String,
        default: "UTC",
      },
      colorScheme: {
        type: String,
        default: "#e78468",
      },
      nickname: {
        type: String,
      },
      additionalDomains: [String],
      publicDashboard: {
        enabled: {
          type: Boolean,
          default: false,
        },
        shareId: {
          type: String,
          unique: true,
          sparse: true,
          index: true,
        },
      },
      publicRealtimeGlobe: {
        enabled: {
          type: Boolean,
          default: false,
        },
        shareId: {
          type: String,
          unique: true,
          sparse: true,
          index: true,
        },
      },
      attackMode: {
        enabled: {
          type: Boolean,
          default: false,
        },
        autoActivate: {
          type: Boolean,
          default: false,
        },
        threshold: {
          type: Number,
          default: 1000, // Default: 1000 requests per hour
        },
        activatedAt: {
          type: Date,
        },
      },
      primaryGoalId: {
        type: Schema.Types.ObjectId,
        ref: "Goal",
      },
    },
    paymentProviders: {
      stripe: {
        apiKey: String,
        webhookSecret: String,
        syncConfig: {
          enabled: {
            type: Boolean,
            default: true,
          },
          frequency: {
            type: String,
            enum: ["realtime", "hourly", "every-6-hours", "daily"],
            default: "realtime",
          },
          lastSyncAt: Date,
          nextSyncAt: Date,
        },
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
