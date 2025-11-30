import { NextRequest } from "next/server";
import connectDB from "@/db";
import ApiKey from "@/db/models/ApiKey";
import crypto from "crypto";

/**
 * Authenticate API request using Bearer token
 * Returns the API key document if valid, null otherwise
 */
export async function authenticateApiRequest(
  request: NextRequest
): Promise<{ apiKey: any; websiteId: string } | null> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    await connectDB();

    // Hash the provided token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find API key
    const apiKey = await ApiKey.findOne({ key: hashedToken }).populate(
      "websiteId"
    );

    if (!apiKey) {
      return null;
    }

    // Update last used timestamp
    apiKey.lastUsedAt = new Date();
    await apiKey.save();

    return {
      apiKey,
      websiteId: apiKey.websiteId.toString(),
    };
  } catch (error) {
    console.error("Error authenticating API request:", error);
    return null;
  }
}
