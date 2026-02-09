import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import ApiKey from "@/db/models/ApiKey";
import crypto from "crypto";

/**
 * GET /api/websites/[websiteId]/api-keys
 * List all API keys for a website
 */
export async function GET(
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

    // Verify user owns this website or is a team member
    const website = await Website.findOne({
      _id: websiteId,
      userId: session.user.id,
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const apiKeys = await ApiKey.find({ websiteId })
      .select("name keyPrefix lastUsedAt createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json({ apiKeys });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/websites/[websiteId]/api-keys
 * Generate a new API key
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

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "API key name is required" },
        { status: 400 }
      );
    }

    // Generate API key
    const randomBytes = crypto.randomBytes(32);
    const plainKey = `df_${randomBytes.toString("hex")}`;
    const keyPrefix = plainKey.substring(0, 11); // "df_" + 8 chars
    const hashedKey = crypto
      .createHash("sha256")
      .update(plainKey)
      .digest("hex");

    // Store hashed key
    const apiKey = new ApiKey({
      websiteId,
      userId: session.user.id,
      name,
      key: hashedKey,
      keyPrefix,
    });

    await apiKey.save();

    // Return plain key only once (frontend should save it immediately)
    return NextResponse.json({
      apiKey: {
        id: apiKey._id.toString(),
        name: apiKey.name,
        key: plainKey, // Only returned once!
        keyPrefix: apiKey.keyPrefix,
        createdAt: apiKey.createdAt,
      },
      message: "API key generated. Save it now - it won't be shown again!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate API key" },
      { status: 500 }
    );
  }
}
