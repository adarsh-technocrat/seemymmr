import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/jobs/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cronSecret && {
          Authorization: `Bearer ${cronSecret}`,
        }),
      },
      body: JSON.stringify({ batchSize: 10, maxConcurrent: 3 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `process-jobs: failed to process ${response.status} ${errorText}`,
      );
      return NextResponse.json(
        { error: "Job processing failed", status: response.status },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      processed: data.processed ?? 0,
      jobs: data.jobs ?? [],
    });
  } catch (error: any) {
    console.error("Error in cron process-jobs:", error);
    return NextResponse.json(
      { error: "Failed to process jobs", message: error?.message },
      { status: 500 },
    );
  }
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
