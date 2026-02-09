import { NextRequest, NextResponse } from "next/server";
import { getSyncJobById } from "@/utils/jobs/queue";
import { getUserId } from "@/lib/get-session";
import { getWebsiteById } from "@/utils/database/website";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const job = await getSyncJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const website = await getWebsiteById(job.websiteId.toString());
    if (!website || website.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      id: job._id.toString(),
      websiteId: job.websiteId.toString(),
      provider: job.provider,
      type: job.type,
      status: job.status,
      priority: job.priority,
      startDate: job.startDate,
      endDate: job.endDate,
      syncRange: job.syncRange,
      result: job.result,
      error: job.error,
      retryCount: job.retryCount,
      maxRetries: job.maxRetries,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get job", message: error.message },
      { status: 500 }
    );
  }
}
