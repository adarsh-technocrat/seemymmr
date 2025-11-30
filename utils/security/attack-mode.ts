import connectDB from "@/db";
import Website from "@/db/models/Website";
import PageView from "@/db/models/PageView";

/**
 * Check if website should activate attack mode based on traffic spike
 * Returns true if attack mode should be activated
 */
export async function checkTrafficSpike(websiteId: string): Promise<boolean> {
  try {
    await connectDB();

    const website = await Website.findById(websiteId);

    if (!website || !website.settings?.attackMode?.autoActivate) {
      return false;
    }

    const threshold = website.settings.attackMode.threshold || 1000;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Count page views in the last hour
    const recentViews = await PageView.countDocuments({
      websiteId,
      timestamp: { $gte: oneHourAgo },
    });

    // If traffic exceeds threshold, activate attack mode
    if (recentViews > threshold && !website.settings.attackMode.enabled) {
      await Website.findByIdAndUpdate(websiteId, {
        "settings.attackMode.enabled": true,
        "settings.attackMode.activatedAt": new Date(),
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking traffic spike:", error);
    return false;
  }
}

/**
 * Apply attack mode protections (rate limiting, IP blocking, etc.)
 * This would be called in the tracking endpoint
 */
export async function applyAttackModeProtections(
  websiteId: string,
  ip: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    await connectDB();

    const website = await Website.findById(websiteId);

    if (!website?.settings?.attackMode?.enabled) {
      return { allowed: true };
    }

    // In attack mode, implement stricter rate limiting
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const recentViewsFromIP = await PageView.countDocuments({
      websiteId,
      // Note: We'd need to store IP in PageView model for this to work
      // For now, this is a placeholder
      timestamp: { $gte: oneMinuteAgo },
    });

    // Limit to 10 requests per minute per IP in attack mode
    if (recentViewsFromIP > 10) {
      return {
        allowed: false,
        reason: "Rate limit exceeded. Attack mode is active.",
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error applying attack mode protections:", error);
    // Fail open - allow request if check fails
    return { allowed: true };
  }
}
