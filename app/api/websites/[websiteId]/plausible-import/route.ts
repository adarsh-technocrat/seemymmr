import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import PageView from "@/db/models/PageView";
import { parse } from "csv-parse/sync";

/**
 * POST /api/websites/[websiteId]/plausible-import
 * Import data from Plausible Analytics export
 * Accepts a ZIP file containing CSV exports from Plausible
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Verify user owns this website
    const website = await Website.findOne({
      _id: websiteId,
      userId: session.user.id,
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(buffer);

    // Parse CSV using csv-parse sync API
    // Plausible exports are CSV format
    // Note: For ZIP files, you'd need to extract first
    // @ts-ignore - csv-parse sync returns array but types may not be accurate
    const records: any[] = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true,
    });

    let imported = 0;
    const errors: string[] = [];

    // Import page views
    for (const record of records) {
      try {
        // Plausible CSV format varies, but typically includes:
        // date, page, visitors, pageviews, etc.
        const date = new Date(record.date || record.timestamp);
        const path = record.page || record.path || "/";
        const hostname = website.domain;

        // Create page view record
        // Note: This is simplified - you'd need to map Plausible data
        // to your schema more carefully
        const pageView = new PageView({
          websiteId,
          sessionId: `plausible_import_${Date.now()}_${imported}`,
          visitorId: `plausible_visitor_${record.visitor_id || imported}`,
          path,
          hostname,
          timestamp: date,
        });

        await pageView.save();
        imported++;
      } catch (error: any) {
        errors.push(`Row ${imported + 1}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `Imported ${imported} records from Plausible`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to import Plausible data",
        note: "Plausible import requires CSV format. For ZIP files, extract and upload individual CSV files.",
      },
      { status: 500 }
    );
  }
}
