import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGitHubCommit extends Document {
  websiteId: mongoose.Types.ObjectId;
  date: Date; // Date of the commit (indexed for querying by date)

  // GitHub commit data
  sha: string; // Unique commit SHA
  message: string;
  author: {
    name: string;
    email: string;
    username?: string;
    avatarUrl?: string;
  };
  repository: {
    name: string;
    owner: string;
    fullName: string; // owner/repo
  };
  url: string; // GitHub commit URL

  // Metadata
  additions?: number;
  deletions?: number;
  filesChanged?: number;

  createdAt: Date;
  updatedAt: Date;
}

const GitHubCommitSchema = new Schema<IGitHubCommit>(
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
    sha: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    author: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      username: {
        type: String,
      },
      avatarUrl: {
        type: String,
      },
    },
    repository: {
      name: {
        type: String,
        required: true,
      },
      owner: {
        type: String,
        required: true,
      },
      fullName: {
        type: String,
        required: true,
        index: true,
      },
    },
    url: {
      type: String,
      required: true,
    },
    additions: {
      type: Number,
    },
    deletions: {
      type: Number,
    },
    filesChanged: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying commits by website and date
GitHubCommitSchema.index({ websiteId: 1, date: -1 });
GitHubCommitSchema.index({ "repository.fullName": 1, date: -1 });

// Prevent model re-compilation during hot reload in development
const GitHubCommit: Model<IGitHubCommit> =
  mongoose.models.GitHubCommit ||
  mongoose.model<IGitHubCommit>("GitHubCommit", GitHubCommitSchema);

export default GitHubCommit;
