import connectDB from "@/db";
import Website from "@/db/models/Website";
import { randomBytes } from "crypto";
import { isValidObjectId } from "@/utils/validation";

export function generateTrackingCode(): string {
  return randomBytes(12).toString("hex");
}

export async function getWebsitesByUserId(userId: string) {
  await connectDB();

  try {
    const websites = await Website.find({ userId }).sort({ createdAt: -1 });
    return websites;
  } catch (error) {
    throw error;
  }
}

export async function getWebsiteById(websiteId: string) {
  await connectDB();

  try {
    if (!isValidObjectId(websiteId)) {
      return null;
    }
    const website = await Website.findById(websiteId);
    return website;
  } catch (error) {
    throw error;
  }
}

export async function getWebsiteByTrackingCode(
  trackingCode: string,
  hostname?: string
) {
  await connectDB();

  try {
    // Strip pmid_ prefix if present for lookup (DB stores without prefix)
    const codeForLookup = trackingCode.startsWith("pmid_")
      ? trackingCode.substring(5)
      : trackingCode;

    const website = await Website.findOne({ trackingCode: codeForLookup });
    if (website && hostname) {
      const mainDomain = website.domain.toLowerCase();
      const checkHostname = hostname.toLowerCase();
      if (
        checkHostname === mainDomain ||
        checkHostname.endsWith(`.${mainDomain}`)
      ) {
        return website;
      }
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
      return website;
    }

    return website;
  } catch (error) {
    throw error;
  }
}

export async function createWebsite(data: {
  userId: string;
  domain: string;
  name: string;
  iconUrl?: string;
  settings?: any;
}) {
  await connectDB();

  try {
    let trackingCode = generateTrackingCode();
    let exists = await Website.findOne({ trackingCode });

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
    throw error;
  }
}
