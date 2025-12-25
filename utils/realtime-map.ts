// Constants
export const DEFAULT_COORDS: [number, number] = [0, 20];

export const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  US: [-95.7129, 37.0902],
  GB: [-3.436, 55.3781],
  CA: [-106.3468, 56.1304],
  AU: [133.7751, -25.2744],
  DE: [10.4515, 51.1657],
  FR: [2.2137, 46.2276],
  IT: [12.5674, 41.8719],
  ES: [-3.7492, 40.4637],
  NL: [5.2913, 52.1326],
  BE: [4.4699, 50.5039],
  CH: [8.2275, 46.8182],
  AT: [14.5501, 47.5162],
  SE: [18.6435, 60.1282],
  NO: [8.4689, 60.472],
  DK: [9.5018, 56.2639],
  FI: [25.7482, 61.9241],
  PL: [19.1451, 51.9194],
  IE: [-8.2439, 53.4129],
  PT: [-8.2245, 39.3999],
  GR: [21.8243, 39.0742],
  BR: [-51.9253, -14.235],
  MX: [-102.5528, 23.6345],
  AR: [-63.6167, -38.4161],
  CL: [-71.543, -35.6751],
  CO: [-74.2973, 4.5709],
  PE: [-75.0152, -9.19],
  IN: [78.9629, 20.5937],
  CN: [104.1954, 35.8617],
  JP: [138.2529, 36.2048],
  KR: [127.7669, 35.9078],
  SG: [103.8198, 1.3521],
  MY: [101.9758, 4.2105],
  TH: [100.9925, 15.87],
  ID: [113.9213, -0.7893],
  PH: [121.774, 12.8797],
  VN: [108.2772, 14.0583],
  TR: [35.2433, 38.9637],
  SA: [45.0792, 23.8859],
  AE: [53.8478, 23.4241],
  IL: [34.8516, 31.0461],
  ZA: [22.9375, -30.5595],
  NG: [8.6753, 9.082],
  EG: [30.8025, 26.8206],
  KE: [37.9062, -0.0236],
  RO: [24.9668, 45.9432],
};

export const ADJECTIVES = [
  "blue",
  "red",
  "green",
  "yellow",
  "purple",
  "orange",
  "pink",
  "cyan",
  "teal",
  "silver",
  "gold",
  "tan",
  "salmon",
  "coral",
  "lime",
  "navy",
];

export const NOUNS = [
  "quail",
  "peacock",
  "mink",
  "opossum",
  "lamprey",
  "stingray",
  "shark",
  "dolphin",
  "whale",
  "eagle",
  "hawk",
  "owl",
  "raven",
  "crow",
  "swan",
];

// Visitor interface
export interface Visitor {
  visitorId: string;
  sessionId: string;
  userId?: string; // If user identification is enabled
  country: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  device: string;
  browser: string;
  os: string;
  referrer?: string;
  referrerDomain?: string;
  currentPath?: string;
  lastSeenAt: string;
  pageViews: number;
  duration: number;
  conversionScore?: number;
}

export interface PaymentEvent {
  id: string;
  type: "payment";
  visitorId?: string;
  sessionId?: string;
  customerEmail?: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export interface PageViewEvent {
  id: string;
  type: "pageview";
  visitorId: string;
  sessionId: string;
  userId?: string;
  country: string;
  region?: string;
  city?: string;
  path: string;
  timestamp: string;
}

export type ActivityItem = Visitor | PaymentEvent | PageViewEvent;

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export function getConversionScoreColor(score?: number): string {
  if (!score) return "rgb(209, 213, 219)";
  if (score >= 80) return "rgb(239, 68, 68)";
  if (score >= 60) return "rgb(253, 186, 116)";
  return "rgb(209, 213, 219)";
}

export function generateVisitorName(
  visitorId: string,
  userId?: string
): string {
  const idToUse = userId || visitorId;
  const hash = idToUse
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const adj = ADJECTIVES[hash % ADJECTIVES.length];
  const noun = NOUNS[(hash * 7) % NOUNS.length];
  return `${adj} ${noun}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes} min ${remainingSeconds} sec`
      : `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
}

export function getConversionLikelihood(score?: number): {
  percentage: string;
  color: string;
  position: number;
} {
  if (!score) {
    return { percentage: "0%", color: "rgb(209, 213, 219)", position: 50 };
  }
  const percentage = score >= 0 ? `+${score}%` : `${score}%`;
  let color = "rgb(209, 213, 219)";
  let position = 50;

  if (score >= 80) {
    color = "rgb(239, 68, 68)";
    position = 100;
  } else if (score >= 60) {
    color = "rgb(253, 186, 116)";
    position = 65;
  } else if (score >= 40) {
    color = "rgb(139, 183, 253)";
    position = 35;
  } else if (score >= 20) {
    color = "rgb(59, 130, 246)";
    position = 20;
  } else if (score < 0) {
    color = "rgb(209, 213, 219)";
    position = Math.max(0, 50 + score);
  }

  return { percentage, color, position };
}

import { generateAvatar } from "@/lib/avatar";

const avatarCache = new Map<string, string>();

export function getAvatarUrl(visitorId: string, country?: string): string {
  if (avatarCache.has(visitorId)) {
    return avatarCache.get(visitorId)!;
  }

  const seed = country ? `${visitorId}-${country}` : visitorId;
  const avatarUrl = generateAvatar(seed, {
    size: 56,
  });

  // Cache the URL for this visitor
  avatarCache.set(visitorId, avatarUrl);

  return avatarUrl;
}

export function createMarkerElement(visitor: Visitor): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-container";
  el.style.cursor = "pointer";

  const scoreColor = getConversionScoreColor(visitor.conversionScore);
  const visitorName = generateVisitorName(visitor.visitorId, visitor.userId);
  const avatarUrl = getAvatarUrl(visitor.visitorId, visitor.country);

  el.innerHTML = `
    <div class="relative marker-inner">
      <img 
        src="${avatarUrl}"
        alt="${visitorName}"
        class="rounded-full ring-1 transition-all duration-100 bg-base-200 shadow-lg ring-base-content/10 dark:ring-base-content/20 size-14 object-cover"
        loading="lazy"
      />
      <div 
        class="absolute right-px top-px z-10 flex h-[13px] w-[13px] items-center justify-center rounded-full"
        style="background: ${scoreColor};"
      >
        <div 
          class="absolute -inset-px rounded-full opacity-30"
          style="background: ${scoreColor};"
        ></div>
      </div>
    </div>
  `;

  return el;
}

export function createPopupContent(visitor: Visitor): string {
  const visitorName = generateVisitorName(visitor.visitorId, visitor.userId);
  const avatarUrl = getAvatarUrl(visitor.visitorId, visitor.country);
  const scoreColor = getConversionScoreColor(visitor.conversionScore);
  const conversion = getConversionLikelihood(visitor.conversionScore);
  const duration = formatDuration(visitor.duration);
  const location =
    visitor.city && visitor.region
      ? `${visitor.city}, ${visitor.country}`
      : visitor.region
      ? `${visitor.region}, ${visitor.country}`
      : visitor.country;

  const referrerDomain = visitor.referrerDomain || "Direct";
  const referrerIcon =
    referrerDomain !== "Direct"
      ? `https://icons.duckduckgo.com/ip3/${referrerDomain}.ico`
      : "";

  // Estimated value (simplified calculation)
  const estimatedValue = visitor.conversionScore
    ? `$${((Math.abs(visitor.conversionScore) / 100) * 232.94).toFixed(2)}`
    : "$0.00";

  return `
    <div class="w-80 animate-opacityFast overflow-hidden rounded-xl border border-base-content/10 bg-base-100 p-3 text-sm shadow-2xl duration-100">
      <img 
        src="${avatarUrl}"
        alt="${visitorName}"
        class="absolute left-3 top-3 rounded-full bg-base-200 ring-1 ring-base-content/10 transition-all duration-100 size-14 object-cover"
      />
      <div class="mb-3 pl-18">
        <div class="mb-1.5 space-y-0.5">
          <div class="flex items-center">
            <h3 class="truncate text-sm font-semibold">${visitorName}</h3>
          </div>
        </div>
        <div class="text-base-secondary grid grid-cols-2 gap-x-1.5 gap-y-1 text-xs leading-tight">
          <div class="flex items-center gap-1.5">
            <div class="inline-flex shrink-0 overflow-hidden rounded-sm shadow-sm h-[10px] w-[15px]" title="${
              visitor.country
            }">
              <img src="https://purecatamphetamine.github.io/country-flag-icons/3x2/${
                visitor.country
              }.svg" alt="${
    visitor.country
  } flag" class="h-full w-full saturate-[0.9]">
            </div>
            <span title="${location}" class="truncate capitalize">${location}</span>
          </div>
          <div title="${visitor.os}" class="flex items-center gap-1.5">
            <span class="truncate">${visitor.os}</span>
          </div>
          <div title="${visitor.device}" class="flex items-center gap-1.5">
            <span class="truncate capitalize">${visitor.device}</span>
          </div>
          <div title="${visitor.browser}" class="flex items-center gap-1.5">
            <span class="truncate">${visitor.browser}</span>
          </div>
        </div>
      </div>
      <div class="space-y-1 border-t-[0.5px] border-base-content/10 pt-3 text-xs">
        <p class="flex items-center justify-between">
          <span class="text-base-secondary">Referrer:</span>
          <span class="flex max-w-[65%] items-center gap-1.5 truncate text-right">
            ${
              referrerIcon
                ? `<img src="${referrerIcon}" alt="${referrerDomain}" class="size-3 shrink-0" onerror="this.style.display='none'">`
                : ""
            }
            <span>${referrerDomain}</span>
          </span>
        </p>
        <p class="flex items-center justify-between">
          <span class="text-base-secondary">Current URL:</span>
          <span title="${
            visitor.currentPath || "/"
          }" class="max-w-[65%] truncate text-right font-medium">
            <span class="rounded bg-base-300 px-1.5 py-0.5 font-mono text-[0.68rem] text-xs text-base-content">${
              visitor.currentPath || "/"
            }</span>
          </span>
        </p>
        <p class="flex items-center justify-between">
          <span class="text-base-secondary">Session time:</span>
          <span>${duration}</span>
        </p>
        <div class="flex items-center justify-between">
          <span class="text-base-secondary">Total visits:</span>
          <span class="font-medium">${visitor.pageViews}</span>
        </div>
      </div>
      <div class="mt-2 space-y-1 border-t-[0.5px] border-base-content/10 pt-2 text-xs">
        <div class="cursor-help space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-base-secondary">Conversion likelihood:</span>
            <span class="flex cursor-help items-center gap-1 font-medium">
              <span class="font-medium text-base-content">${
                conversion.percentage
              }</span>
              <span class="text-[0.65rem] opacity-70">vs. avg</span>
            </span>
          </div>
          <div class="pb-0.5">
            <div class="relative h-[6px]">
              <div class="absolute inset-0 overflow-hidden rounded-full" style="background: linear-gradient(90deg, rgb(59, 130, 246) 0%, rgb(139, 183, 253) 35%, rgb(209, 213, 219) 50%, rgb(253, 186, 116) 65%, rgb(239, 68, 68) 100%);"></div>
              <div class="absolute -top-[3px] z-10 bg-transparent!" style="left: ${
                conversion.position
              }%;">
                <div class="h-[12px] w-[12px] rounded-full border-[3px] border-base-content/60 bg-transparent! ring-1 ring-base-100/80 dark:border-base-content" style="transform: translateX(-50%);">
                  <div class="absolute inset-0 rounded-full border border-base-100/30 bg-transparent! transition-all duration-300"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex cursor-help items-center justify-between">
          <span class="text-base-secondary">Estimated value:</span>
          <span class="flex cursor-help items-center gap-1 font-medium">
            <span class="font-medium text-success">${estimatedValue}</span>
          </span>
        </div>
      </div>
    </div>
  `;
}

// Device and browser icon helpers
export function getDeviceIcon(device: string): string {
  const deviceLower = device.toLowerCase();
  if (deviceLower === "mobile") {
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H7V4h10v16z"/>
      </svg>`
    )}`;
  } else if (deviceLower === "tablet") {
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H3V6h18v12z"/>
      </svg>`
    )}`;
  } else {
    // desktop
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z"/>
      </svg>`
    )}`;
  }
}

export function getBrowserIcon(browser: string): string {
  const browserLower = browser.toLowerCase();

  // Map browser names to browser-logos CDN paths
  const browserMap: Record<string, string> = {
    chrome: "chrome",
    firefox: "firefox",
    safari: "safari",
    edge: "edge",
    opera: "opera",
    "internet explorer": "internet-explorer",
    brave: "brave",
    samsung: "samsung-internet",
    "samsung internet": "samsung-internet",
    vivaldi: "vivaldi",
    yandex: "yandex",
    uc: "uc-browser",
    "uc browser": "uc-browser",
  };

  // Try to match browser name
  for (const [key, folder] of Object.entries(browserMap)) {
    if (browserLower.includes(key)) {
      return `https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/${folder}/${folder}_64x64.png`;
    }
  }

  // Default browser icon (generic)
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>`
  )}`;
}

export function getVisitorCoordinates(visitor: Visitor): [number, number] {
  if (
    visitor.latitude !== undefined &&
    visitor.longitude !== undefined &&
    !isNaN(visitor.latitude) &&
    !isNaN(visitor.longitude)
  ) {
    return [visitor.longitude, visitor.latitude];
  }

  if (visitor.country && visitor.country !== "Unknown") {
    const countryCoords = COUNTRY_COORDINATES[visitor.country.toUpperCase()];
    if (countryCoords) {
      return countryCoords;
    }
  }
  return DEFAULT_COORDS;
}
