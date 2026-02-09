import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { minify } from "terser";

// Cache for minified script (in-memory cache)
let cachedMinifiedScript: string | null = null;
let cachedScriptTimestamp: number = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Serve the tracking script at /js/script.js
 *
 * This is a static endpoint that serves the tracking script.
 * The script reads configuration from data attributes on the script tag:
 * - data-website-id: The tracking code
 * - data-domain: The website domain
 *
 * Usage:
 * <script
 *   defer
 *   data-website-id="YOUR_TRACKING_CODE"
 *   data-domain="example.com"
 *   src="https://your-domain.com/js/script.js"
 * ></script>
 */
export async function GET(request: NextRequest) {
  try {
    const scriptPath = join(process.cwd(), "lib", "tracking", "script.js");
    const scriptStats = await stat(scriptPath);
    const scriptModifiedTime = scriptStats.mtimeMs;

    // Check if we should use cached version
    const useCache =
      cachedMinifiedScript !== null &&
      Date.now() - cachedScriptTimestamp < CACHE_DURATION &&
      scriptModifiedTime <= cachedScriptTimestamp;

    let script: string;

    if (useCache && cachedMinifiedScript !== null) {
      script = cachedMinifiedScript;
    } else {
      // Read the tracking script
      const rawScript = await readFile(scriptPath, "utf-8");

      // Minify in production or when ENABLE_MINIFICATION is set
      // Note: next dev overrides NODE_ENV, so we check both
      const shouldMinify =
        process.env.NODE_ENV === "production" ||
        process.env.ENABLE_MINIFICATION === "true";

      if (shouldMinify) {
        try {
          const minified = await minify(rawScript, {
            compress: {
              drop_console: false, // Keep console logs for debugging
              drop_debugger: true,
              ecma: 2015,
              passes: 2, // Multiple passes for better compression
            },
            mangle: {
              reserved: [
                "postmetric",
                "window",
                "document",
                "navigator",
                "location",
                "localStorage",
                "sessionStorage",
              ], // Don't mangle these important globals
            },
            format: {
              comments: false, // Remove comments
              ecma: 2015,
            },
            ecma: 2015,
            module: false,
          });

          script = minified.code || rawScript;
        } catch (minifyError) {
          // Fallback to raw script if minification fails
          script = rawScript;
        }
      } else {
        script = rawScript;
      }

      // Cache the result
      cachedMinifiedScript = script;
      cachedScriptTimestamp = Date.now();
    }

    return new NextResponse(script, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600, immutable", // Cache for 1 hour
        // Security headers
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        // Allow script to be loaded from any origin (for tracking)
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        // Content Security Policy - allow script execution
        "Content-Security-Policy":
          "default-src 'self'; script-src 'unsafe-inline' 'unsafe-eval' *; connect-src *;",
      },
    });
  } catch (error) {
    return new NextResponse("// Error loading tracking script", {
      status: 500,
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }
}
