export function getLogoDevUrl(domain: string | null): string | null {
  if (!domain || domain.length < 2) {
    return null;
  }

  const cleanDomain = domain.replace(/^www\./, "").trim();
  if (!cleanDomain) {
    return null;
  }

  const token =
    process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN || "pk_Dy6u8vlcQUGBq5pdblEd5w";
  return `https://img.logo.dev/${encodeURIComponent(cleanDomain)}?token=${token}`;
}
