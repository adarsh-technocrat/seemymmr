import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISearchConsoleData extends Document {
  websiteId: mongoose.Types.ObjectId;
  date: Date; // Date of the search data (indexed for querying by date)

  // Search Console data
  query: string; // Search query
  page: string; // URL of the page
  clicks: number;
  impressions: number;
  ctr: number; // Click-through rate
  position: number; // Average position in search results

  // Metadata
  country?: string;
  device?: string;

  createdAt: Date;
  updatedAt: Date;
}

const SearchConsoleDataSchema = new Schema<ISearchConsoleData>(
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
    query: {
      type: String,
      required: true,
      index: true,
    },
    page: {
      type: String,
      required: true,
      index: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    ctr: {
      type: Number,
      default: 0,
    },
    position: {
      type: Number,
    },
    country: {
      type: String,
      index: true,
    },
    device: {
      type: String,
      enum: ["DESKTOP", "MOBILE", "TABLET"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
SearchConsoleDataSchema.index({ websiteId: 1, date: -1 });
SearchConsoleDataSchema.index({ websiteId: 1, query: 1, date: -1 });
SearchConsoleDataSchema.index({ websiteId: 1, page: 1, date: -1 });

// Prevent model re-compilation during hot reload in development
const SearchConsoleData: Model<ISearchConsoleData> =
  mongoose.models.SearchConsoleData ||
  mongoose.model<ISearchConsoleData>(
    "SearchConsoleData",
    SearchConsoleDataSchema
  );

export default SearchConsoleData;
