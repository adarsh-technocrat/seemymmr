import { useState, useEffect, useRef } from "react";

export function useDomainIcon(domain: string) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    cancelledRef.current = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!domain || domain.trim().length === 0) {
      setIconUrl(null);
      setLoading(false);
      return;
    }

    // Debounce: wait 300ms before fetching favicon
    timeoutRef.current = setTimeout(() => {
      if (!mountedRef.current || cancelledRef.current) return;

      const cleanDomain = domain
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "")
        .trim();

      if (!cleanDomain || cleanDomain.length < 3) {
        if (mountedRef.current) {
          setIconUrl(null);
          setLoading(false);
        }
        return;
      }

      if (!mountedRef.current || cancelledRef.current) return;

      setLoading(true);
      setIconUrl(null);

      const faviconUrls = [
        `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=48`,
        `https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`,
        `https://${cleanDomain}/favicon.ico`,
      ];

      const tryNextFavicon = (index: number) => {
        if (cancelledRef.current || !mountedRef.current) return;

        if (index >= faviconUrls.length) {
          if (mountedRef.current) {
            setIconUrl(null);
            setLoading(false);
          }
          return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";

        const timeout = setTimeout(() => {
          if (!cancelledRef.current && mountedRef.current) {
            tryNextFavicon(index + 1);
          }
        }, 2000);

        img.onload = () => {
          clearTimeout(timeout);
          if (!cancelledRef.current && mountedRef.current) {
            setIconUrl(faviconUrls[index]);
            setLoading(false);
          }
        };

        img.onerror = () => {
          clearTimeout(timeout);
          if (!cancelledRef.current && mountedRef.current) {
            tryNextFavicon(index + 1);
          }
        };

        img.src = faviconUrls[index];
      };

      tryNextFavicon(0);
    }, 300);

    return () => {
      cancelledRef.current = true;
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [domain]);

  return { iconUrl, loading };
}
