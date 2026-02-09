import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import ApiKey from "@/db/models/ApiKey";

/**
 * DELETE /api/websites/[websiteId]/api-keys/[keyId]
 * Delete an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string; keyId: string }> }
) {
  try {
    const { websiteId, keyId } = await params;
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

    // Delete the API key
    const apiKey = await ApiKey.findOneAndDelete({
      _id: keyId,
      websiteId,
      userId: session.user.id,
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "API key deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete API key" },
      { status: 500 }
    );
  }
}
