import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import type { Session } from "@/lib/get-session";

interface ValidateAccessResult {
  valid: boolean;
  error?: string;
  website?: any;
}

/**
 * Unified authentication helper for realtime endpoints
 * Supports both authenticated (session) and public (shareId) access
 */
export async function validateRealtimeAccess(
  websiteId: string,
  shareId: string | null,
  session: Session | null,
): Promise<ValidateAccessResult> {
  await connectDB();
  const website = await Website.findById(websiteId);

  if (!website) {
    return { valid: false, error: "Website not found" };
  }

  // Public access via shareId
  if (shareId) {
    if (
      website.settings?.publicRealtimeGlobe?.enabled &&
      website.settings.publicRealtimeGlobe.shareId === shareId
    ) {
      return { valid: true, website };
    }
    return { valid: false, error: "Public realtime globe not available" };
  }

  // Authenticated access
  if (!session?.user?.id) {
    return { valid: false, error: "Unauthorized" };
  }

  const ownedWebsite = await Website.findOne({
    _id: websiteId,
    userId: session.user.id,
  });

  if (!ownedWebsite) {
    return { valid: false, error: "Website not found or unauthorized" };
  }

  return { valid: true, website: ownedWebsite };
}
