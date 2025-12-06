export function parseFormattedNumber(formatted: string): number {
  if (!formatted) return 0;

  const isPercent = formatted.includes("%");
  let cleaned = formatted.replace(/[$,\s]/g, "").replace(/%$/, "");

  if (cleaned.toUpperCase().endsWith("K")) {
    const num = parseFloat(cleaned.slice(0, -1)) * 1000;
    return isPercent ? num / 100 : num;
  }
  if (cleaned.toUpperCase().endsWith("M")) {
    const num = parseFloat(cleaned.slice(0, -1)) * 1000000;
    return isPercent ? num / 100 : num;
  }
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return isPercent ? parsed / 100 : parsed;
}

export function isPercentage(formatted: string): boolean {
  return formatted.includes("%");
}

export function isCurrency(formatted: string): boolean {
  return formatted.startsWith("$");
}
