import connectDB from "@/db";
import Website from "@/db/models/Website";
import { randomBytes } from "crypto";

/**
 * Generate unique tracking code
 */
export function generateTrackingCode(): string {
  return randomBytes(12).toString("hex");
}

/**
 * Get all websites for a user
 */
export async function getWebsitesByUserId(userId: string) {
  await connectDB();

  try {
    const websites = await Website.find({ userId }).sort({ createdAt: -1 });
    return websites;
  } catch (error) {
    console.error("Error fetching websites:", error);
    throw error;
  }
}

/**
 * Get website by ID
 */
export async function getWebsiteById(websiteId: string) {
  await connectDB();

  try {
    const website = await Website.findById(websiteId);
    return website;
  } catch (error) {
    console.error("Error fetching website:", error);
    throw error;
  }
}

/**
 * Get website by tracking code
 * Also checks additional domains if hostname matches
 */
export async function getWebsiteByTrackingCode(
  trackingCode: string,
  hostname?: string
) {
  await connectDB();

  try {
    const website = await Website.findOne({ trackingCode });

    // If website found, verify hostname matches domain or additional domains
    if (website && hostname) {
      const mainDomain = website.domain.toLowerCase();
      const checkHostname = hostname.toLowerCase();

      // Check if hostname matches main domain or any subdomain
      if (
        checkHostname === mainDomain ||
        checkHostname.endsWith(`.${mainDomain}`)
      ) {
        return website;
      }

      // Check additional domains
      const additionalDomains = website.settings?.additionalDomains || [];
      for (const domain of additionalDomains) {
        const domainLower = domain.toLowerCase();
        if (
          checkHostname === domainLower ||
          checkHostname.endsWith(`.${domainLower}`)
        ) {
          return website;
        }
      }

      // If hostname doesn't match, return null (or website if you want to allow all)
      // For now, we'll return website to maintain backward compatibility
      return website;
    }

    return website;
  } catch (error) {
    console.error("Error fetching website:", error);
    throw error;
  }
}

/**
 * Create a new website
 */
export async function createWebsite(data: {
  userId: string;
  domain: string;
  name: string;
  iconUrl?: string;
  settings?: any;
}) {
  await connectDB();

  try {
    // Generate unique tracking code
    let trackingCode = generateTrackingCode();
    let exists = await Website.findOne({ trackingCode });

    // Ensure uniqueness
    while (exists) {
      trackingCode = generateTrackingCode();
      exists = await Website.findOne({ trackingCode });
    }

    const website = new Website({
      userId: data.userId,
      domain: data.domain,
      name: data.name,
      iconUrl: data.iconUrl,
      trackingCode,
      settings: data.settings || {
        hashPaths: false,
        trackScroll: false,
        trackUserIdentification: false,
      },
    });

    await website.save();
    return website;
  } catch (error) {
    console.error("Error creating website:", error);
    throw error;
  }
}

/**
 * Update website
 */
export async function updateWebsite(
  websiteId: string,
  updates: {
    name?: string;
    domain?: string;
    iconUrl?: string;
    settings?: any;
    paymentProviders?: any;
  }
) {
  await connectDB();

  try {
    const website = await Website.findByIdAndUpdate(
      websiteId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return website;
  } catch (error) {
    console.error("Error updating website:", error);
    throw error;
  }
}

/**
 * Delete website
 */
export async function deleteWebsite(websiteId: string) {
  await connectDB();

  try {
    await Website.findByIdAndDelete(websiteId);
  } catch (error) {
    console.error("Error deleting website:", error);
    throw error;
  }
}
