export interface UTMParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export function parseUTMParams(url: string | null): UTMParams {
  if (!url) return {};

  try {
    const urlObj = new URL(url);
    const params: UTMParams = {};

    const utmSource = urlObj.searchParams.get("utm_source");
    const utmMedium = urlObj.searchParams.get("utm_medium");
    const utmCampaign = urlObj.searchParams.get("utm_campaign");
    const utmTerm = urlObj.searchParams.get("utm_term");
    const utmContent = urlObj.searchParams.get("utm_content");

    if (utmSource) params.utmSource = utmSource;
    if (utmMedium) params.utmMedium = utmMedium;
    if (utmCampaign) params.utmCampaign = utmCampaign;
    if (utmTerm) params.utmTerm = utmTerm;
    if (utmContent) params.utmContent = utmContent;

    return params;
  } catch (error) {
    return {};
  }
}

export function extractReferrerDomain(referrer: string | null): string | null {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch (error) {
    return null;
  }
}

export interface AttributionResult {
  type: "utm" | "google_ads" | "facebook_ads" | "custom" | "direct" | "organic";
  source: string;
  medium: string;
  campaign?: string;
  referrer: string | null;
  referrerDomain: string | null;
}

/**
 * Resolve attribution from UTM params, ad click IDs, referrer, and current URL
 * Priority: UTM params > Ad click IDs > Custom ref params > Referrer > Direct
 */
export function resolveAttribution(data: {
  utmParams?: Record<string, string>;
  adClickIds?: Record<string, string>;
  referrer?: string | null;
  currentUrl?: string;
}): AttributionResult {
  const {
    utmParams = {},
    adClickIds = {},
    referrer = null,
    currentUrl = "",
  } = data;

  // Priority 1: UTM parameters (highest priority)
  if (utmParams.utm_source) {
    return {
      type: "utm",
      source: utmParams.utm_source,
      medium: utmParams.utm_medium || "unknown",
      campaign: utmParams.utm_campaign || undefined,
      referrer: referrer,
      referrerDomain: extractReferrerDomain(referrer),
    };
  }

  // Priority 2: Google Ads click IDs
  if (adClickIds.gclid || adClickIds.wbraid || adClickIds.gbraid) {
    return {
      type: "google_ads",
      source: "google",
      medium: "cpc",
      campaign: undefined,
      referrer: referrer,
      referrerDomain: extractReferrerDomain(referrer),
    };
  }

  // Priority 3: Facebook Ads click ID
  if (adClickIds.fbclid) {
    return {
      type: "facebook_ads",
      source: "facebook",
      medium: "cpc",
      campaign: undefined,
      referrer: referrer,
      referrerDomain: extractReferrerDomain(referrer),
    };
  }

  // Priority 4: Other ad click IDs (LinkedIn, Microsoft, TikTok, Twitter)
  if (
    adClickIds.li_fat_id ||
    adClickIds.msclkid ||
    adClickIds.ttclid ||
    adClickIds.twclid
  ) {
    let source = "unknown";
    if (adClickIds.li_fat_id) source = "linkedin";
    else if (adClickIds.msclkid) source = "microsoft";
    else if (adClickIds.ttclkid) source = "tiktok";
    else if (adClickIds.twclid) source = "twitter";

    return {
      type: "custom",
      source: source,
      medium: "cpc",
      campaign: undefined,
      referrer: referrer,
      referrerDomain: extractReferrerDomain(referrer),
    };
  }

  // Priority 5: Custom ref params (ref, via) from URL
  if (currentUrl) {
    try {
      const url = new URL(currentUrl);
      const refParam =
        url.searchParams.get("ref") || url.searchParams.get("via");
      if (refParam) {
        return {
          type: "custom",
          source: refParam,
          medium: "referral",
          campaign: undefined,
          referrer: referrer,
          referrerDomain: extractReferrerDomain(referrer),
        };
      }
    } catch (e) {
      // Invalid URL, continue to next priority
    }
  }

  // Priority 6: Referrer-based attribution
  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      const hostname = referrerUrl.hostname.toLowerCase();

      // Check if it's a search engine (organic)
      const searchEngines = [
        "google.com",
        "google.co.uk",
        "google.ca",
        "bing.com",
        "yahoo.com",
        "duckduckgo.com",
        "baidu.com",
        "yandex.com",
      ];

      const isSearchEngine = searchEngines.some((se) => hostname.includes(se));

      if (isSearchEngine) {
        return {
          type: "organic",
          source: hostname.split(".")[0] || "search",
          medium: "organic",
          campaign: undefined,
          referrer: referrer,
          referrerDomain: hostname,
        };
      }

      // Regular referral
      return {
        type: "custom",
        source: hostname,
        medium: "referral",
        campaign: undefined,
        referrer: referrer,
        referrerDomain: hostname,
      };
    } catch (e) {
      // Invalid referrer URL
    }
  }

  // Priority 7: Direct (no attribution)
  return {
    type: "direct",
    source: "direct",
    medium: "none",
    campaign: undefined,
    referrer: null,
    referrerDomain: null,
  };
}
