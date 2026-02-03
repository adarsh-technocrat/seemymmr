import connectDB from "@/db";
import SyncJob, {
  type ISyncJob,
  type SyncJobProvider,
  type SyncJobType,
  type SyncJobStatus,
  type SyncRange,
} from "@/db/models/SyncJob";
import { Types } from "mongoose";

export interface CreateSyncJobParams {
  websiteId: string;
  provider: SyncJobProvider;
  type: SyncJobType;
  priority?: number;
  startDate?: Date;
  endDate?: Date;
  syncRange?: SyncRange;
  maxRetries?: number;
}

export interface SyncJobResult {
  synced: number;
  skipped: number;
  errors: number;
}

/**
 * Enqueue a new sync job
 */
export async function enqueueSyncJob(
  params: CreateSyncJobParams,
): Promise<ISyncJob> {
  await connectDB();

  const job = new SyncJob({
    websiteId: new Types.ObjectId(params.websiteId),
    provider: params.provider,
    type: params.type,
    status: "pending",
    priority: params.priority ?? getDefaultPriority(params.type),
    startDate: params.startDate,
    endDate: params.endDate,
    syncRange: params.syncRange,
    retryCount: 0,
    maxRetries: params.maxRetries ?? 3,
  });

  await job.save();
  return job;
}

/**
 * Get the next pending job to process
 * Orders by priority (desc) then createdAt (asc)
 */
export async function dequeueSyncJob(): Promise<ISyncJob | null> {
  await connectDB();

  const job = await SyncJob.findOneAndUpdate(
    { status: "pending" },
    {
      $set: {
        status: "processing",
        startedAt: new Date(),
      },
    },
    {
      sort: { priority: -1, createdAt: 1 }, // Higher priority first, then oldest first
      new: true,
    },
  );

  return job;
}

/**
 * Update job status and result
 */
export async function updateSyncJobStatus(
  jobId: string,
  status: SyncJobStatus,
  result?: SyncJobResult,
  error?: string,
): Promise<ISyncJob | null> {
  await connectDB();

  const update: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === "completed" || status === "failed") {
    update.completedAt = new Date();
  }

  if (result) {
    update.result = result;
  }

  if (error) {
    update.error = error;
  }

  const job = await SyncJob.findByIdAndUpdate(
    jobId,
    { $set: update },
    { new: true },
  );
  return job;
}

/**
 * Increment retry count for a failed job
 */
export async function incrementJobRetry(
  jobId: string,
): Promise<ISyncJob | null> {
  await connectDB();

  const job = await SyncJob.findByIdAndUpdate(
    jobId,
    {
      $inc: { retryCount: 1 },
      $set: { status: "pending", error: undefined },
    },
    { new: true },
  );

  return job;
}

/**
 * Get pending jobs for a specific website
 */
export async function getPendingJobsForWebsite(
  websiteId: string,
): Promise<ISyncJob[]> {
  await connectDB();

  const jobs = await SyncJob.find({
    websiteId: new Types.ObjectId(websiteId),
    status: { $in: ["pending", "processing"] },
  }).sort({ priority: -1, createdAt: 1 });

  return jobs;
}

/**
 * Get all pending jobs (for processing)
 */
export async function getAllPendingJobs(
  limit: number = 10,
): Promise<ISyncJob[]> {
  await connectDB();

  const jobs = await SyncJob.find({
    status: "pending",
  })
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit)
    .populate("websiteId", "name domain");

  return jobs;
}

/**
 * Get job by ID
 */
export async function getSyncJobById(jobId: string): Promise<ISyncJob | null> {
  await connectDB();

  const job = await SyncJob.findById(jobId).populate(
    "websiteId",
    "name domain",
  );
  return job;
}

/**
 * Get recent jobs for a website
 */
export async function getRecentJobsForWebsite(
  websiteId: string,
  limit: number = 10,
): Promise<ISyncJob[]> {
  await connectDB();

  const jobs = await SyncJob.find({
    websiteId: new Types.ObjectId(websiteId),
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("websiteId", "name domain");

  return jobs;
}

/**
 * Cancel pending jobs for a website/provider
 */
export async function cancelPendingJobs(
  websiteId: string,
  provider?: SyncJobProvider,
): Promise<number> {
  await connectDB();

  const filter: any = {
    websiteId: new Types.ObjectId(websiteId),
    status: "pending",
  };

  if (provider) {
    filter.provider = provider;
  }

  const result = await SyncJob.updateMany(filter, {
    $set: {
      status: "failed",
      error: "Cancelled",
      completedAt: new Date(),
    },
  });

  return result.modifiedCount ?? 0;
}

/**
 * Clean up old completed jobs (older than specified days)
 */
export async function cleanupOldJobs(daysOld: number = 30): Promise<number> {
  await connectDB();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await SyncJob.deleteMany({
    status: { $in: ["completed", "failed"] },
    completedAt: { $lt: cutoffDate },
  });

  return result.deletedCount || 0;
}

/**
 * Get default priority based on job type
 */
function getDefaultPriority(type: SyncJobType): number {
  switch (type) {
    case "webhook":
      return 100; // Highest priority - real-time events
    case "manual":
      return 80; // High priority - user requested
    case "periodic":
      return 60; // Medium-high priority - scheduled
    case "cron":
      return 50; // Medium priority - automated
    default:
      return 50;
  }
}

/**
 * Check if a recent sync was completed for a website/provider
 * Returns true if a sync was completed within the specified time window (default: 15 minutes)
 */
export async function hasRecentSync(
  websiteId: string,
  provider: SyncJobProvider,
  timeWindowMinutes: number = 15,
): Promise<boolean> {
  await connectDB();

  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - timeWindowMinutes);

  const recentJob = await SyncJob.findOne({
    websiteId: new Types.ObjectId(websiteId),
    provider,
    status: "completed",
    completedAt: { $gte: cutoffTime },
  }).sort({ completedAt: -1 });

  return !!recentJob;
}

/**
 * Calculate next sync date based on frequency
 */
export function calculateNextSyncDate(
  frequency: "realtime" | "hourly" | "every-6-hours" | "daily",
): Date {
  const now = new Date();
  switch (frequency) {
    case "realtime":
      return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes (matches cron schedule)
    case "hourly":
      return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    case "every-6-hours":
      return new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours
    case "daily":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    default:
      return new Date(now.getTime() + 5 * 60 * 1000); // Default to 5 minutes
  }
}
