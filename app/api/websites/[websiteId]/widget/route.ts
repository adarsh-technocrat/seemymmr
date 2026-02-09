import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import { getVisitorsNow } from "@/utils/analytics/aggregations/getVisitorsNow.aggregation";

/**
 * GET /api/websites/[websiteId]/widget
 * Generate widget iframe HTML for real-time visitor count
 * Based on Postmetric widget: https://postmetric.com/docs/api-introduction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const shareId = searchParams.get("shareId");

    await connectDB();

    const website = await Website.findById(websiteId);

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Check if public dashboard is enabled and shareId matches
    if (
      !website.settings?.publicDashboard?.enabled ||
      website.settings.publicDashboard.shareId !== shareId
    ) {
      return NextResponse.json(
        { error: "Widget not available" },
        { status: 403 }
      );
    }

    const mainTextSize = searchParams.get("mainTextSize") || "16";
    const primaryColor =
      searchParams.get("primaryColor") ||
      website.settings?.colorScheme ||
      "#e78468";

    // Get current visitor count
    const visitorsNow = await getVisitorsNow(websiteId);

    // Return widget HTML
    const widgetHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .widget {
      text-align: center;
      color: #333;
    }
    .visitor-count {
      font-size: ${mainTextSize}px;
      font-weight: bold;
      color: ${primaryColor};
      margin: 10px 0;
    }
    .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="widget">
    <div class="label">Visitors now</div>
    <div class="visitor-count" id="visitor-count">${visitorsNow}</div>
  </div>
  <script>
    // Auto-refresh every 5 seconds
    setInterval(function() {
      fetch(window.location.origin + '/api/websites/${websiteId}/widget/data?shareId=${shareId}')
        .then(r => r.json())
        .then(data => {
          if (data.visitorsNow !== undefined) {
            document.getElementById('visitor-count').textContent = data.visitorsNow;
          }
        })
        .catch(() => {});
    }, 5000);
  </script>
</body>
</html>
    `.trim();

    return new NextResponse(widgetHtml, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate widget" },
      { status: 500 }
    );
  }
}
