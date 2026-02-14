export const BREAKDOWN_KEYS = [
  "source-channel",
  "source-referrer",
  "source-campaign",
  "source-keyword",
  "source-channels",
  "path-pages",
  "path-hostnames",
  "path-entry-pages",
  "path-exit-links",
  "location-country",
  "location-region",
  "location-city",
  "system-browser",
  "system-os",
  "system-device",
] as const;

export type BreakdownKey = (typeof BREAKDOWN_KEYS)[number];

export function isBreakdownKey(value: string): value is BreakdownKey {
  return (BREAKDOWN_KEYS as readonly string[]).includes(value);
}
