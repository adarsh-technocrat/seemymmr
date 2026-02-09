import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { getVisitorsNow } from "@/utils/analytics/aggregations/getVisitorsNow.aggregation";
import { validateRealtimeAccess } from "@/utils/api/realtime-auth";
import connectDB from "@/db";
import Website from "@/db/models/Website";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  try {
    const { websiteId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const shareId = searchParams.get("shareId");
    const session = await getSession();

    // Unified authentication: supports both shareId (public) and session (authenticated)
    const accessResult = await validateRealtimeAccess(
      websiteId,
      shareId,
      session,
    );

    if (!accessResult.valid) {
      const statusCode =
        accessResult.error === "Unauthorized"
          ? 401
          : accessResult.error === "Website not found"
            ? 404
            : 403;
      return new Response(accessResult.error || "Access denied", {
        status: statusCode,
      });
    }

    // If not requesting SSE stream, return website info (for validation)
    const acceptHeader = request.headers.get("accept");
    if (!acceptHeader?.includes("text/event-stream")) {
      return NextResponse.json({
        websiteName: accessResult.website.name,
        websiteDomain: accessResult.website.domain,
      });
    }

    // Set up Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`),
        );

        // Poll for updates every 5 seconds
        const interval = setInterval(async () => {
          try {
            const visitorsNow = await getVisitorsNow(websiteId);

            const data = {
              type: "update",
              visitorsNow,
              timestamp: new Date().toISOString(),
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
            );
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  message: "Failed to fetch data",
                })}\n\n`,
              ),
            );
          }
        }, 5000); // Update every 5 seconds

        // Clean up on client disconnect
        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable buffering in nginx
      },
    });
  } catch (error: any) {
    return new Response("Internal server error", { status: 500 });
  }
}
