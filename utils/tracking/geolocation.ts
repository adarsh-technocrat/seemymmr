import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
countries.registerLocale(enLocale);

/**
 * Get geolocation from IP address
 * Supports multiple geolocation services:
 * - IPStack (ipstack.com)
 * - ipapi.co (free tier available)
 * - MaxMind GeoIP2 (requires local database)
 */
export interface LocationInfo {
  country: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Get location from IP address using ipapi.co (free tier)
 * Alternative services: IPStack, MaxMind GeoIP2, ip-api.com
 */
export async function getLocationFromIP(ip: string): Promise<LocationInfo> {
  if (
    ip === "0.0.0.0" ||
    ip === "127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  ) {
    return {
      country: "Unknown",
      region: undefined,
      city: undefined,
    };
  }

  // Option 1: ipapi.co (free tier: 1000 requests/day, no API key required)
  // API key is optional - use it for higher rate limits
  const IPAPI_KEY = process.env.IPAPI_KEY;
  try {
    const url = IPAPI_KEY
      ? `https://ipapi.co/${ip}/json/?key=${IPAPI_KEY}`
      : `https://ipapi.co/${ip}/json/`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "PostMetric/1.0",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.error) {
        console.error("ipapi.co error:", data.reason);
      } else {
        const lat =
          typeof data.latitude === "number" && !isNaN(data.latitude)
            ? data.latitude
            : undefined;
        const lon =
          typeof data.longitude === "number" && !isNaN(data.longitude)
            ? data.longitude
            : undefined;

        return {
          country: data.country_code || "Unknown",
          region: data.region,
          city: data.city,
          latitude: lat,
          longitude: lon,
        };
      }
    }
  } catch (error) {
    console.error("ipapi.co geolocation error:", error);
  }

  // Option 2: IPStack (requires API key)
  const IPSTACK_API_KEY = process.env.IPSTACK_API_KEY;
  if (IPSTACK_API_KEY) {
    try {
      const response = await fetch(
        `http://api.ipstack.com/${ip}?access_key=${IPSTACK_API_KEY}`,
        {
          headers: {
            "User-Agent": "PostMetric/1.0",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          console.error("IPStack error:", data.error.info);
        } else {
          const lat =
            typeof data.latitude === "number" && !isNaN(data.latitude)
              ? data.latitude
              : undefined;
          const lon =
            typeof data.longitude === "number" && !isNaN(data.longitude)
              ? data.longitude
              : undefined;

          return {
            country: data.country_code || "Unknown",
            region: data.region_name,
            city: data.city,
            latitude: lat,
            longitude: lon,
          };
        }
      }
    } catch (error) {
      console.error("IPStack geolocation error:", error);
    }
  }

  // Option 3: ip-api.com (free tier: 45 requests/minute)
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,countryCode,regionName,city,lat,lon`,
      {
        headers: {
          "User-Agent": "PostMetric/1.0",
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.status === "success") {
        const lat =
          typeof data.lat === "number" && !isNaN(data.lat)
            ? data.lat
            : undefined;
        const lon =
          typeof data.lon === "number" && !isNaN(data.lon)
            ? data.lon
            : undefined;

        return {
          country: data.countryCode || "Unknown",
          region: data.regionName,
          city: data.city,
          latitude: lat,
          longitude: lon,
        };
      }
    }
  } catch (error) {
    console.error("ip-api.com geolocation error:", error);
  }

  return {
    country: "Unknown",
    region: undefined,
    city: undefined,
  };
}

export function getIPFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  const cfConnectingIP = headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  return "0.0.0.0";
}

export function getCountryNameFromCode(code: string): string {
  const countryName = countries.getName(code.toUpperCase(), "en");
  return countryName || code;
}

export function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function getLocationImageUrlFromCode(
  name: string,
  type: "country" | "region" | "city"
): string {
  if (type === "country") {
    const countryCode = name.length === 2 ? name.toUpperCase() : name;
    return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode}.svg`;
  }
  return "";
}
