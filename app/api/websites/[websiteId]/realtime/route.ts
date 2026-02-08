import { NextRequest } from "next/server";
import { getSession } from "@/lib/get-session";
import { getVisitorsNow } from "@/utils/analytics/aggregations/getVisitorsNow.aggregation";
import Website from "@/db/models/Website";
import connectDB from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify user owns this website
  await connectDB();
  const website = await Website.findOne({
    _id: websiteId,
    userId: session.user.id,
  });

  if (!website) {
    return new Response("Website not found", { status: 404 });
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
          console.error("Error in realtime stream:", error);
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
}
