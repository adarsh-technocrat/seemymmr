import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires authentication
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/websites") ||
    pathname.startsWith("/api/goals");

  // Skip authentication for public API routes
  // Note: Unified endpoints (/realtime, /realtime/visitors) handle auth internally
  // They accept shareId query param for public access or require session for authenticated access
  const isPublicApiRoute =
    pathname.startsWith("/api/track") ||
    pathname.startsWith("/api/identify") ||
    (pathname.startsWith("/api/websites") && pathname.includes("/public")) ||
    (pathname.startsWith("/api/websites") &&
      pathname.includes("/realtime") &&
      !pathname.includes("/realtime/public")) || // Unified endpoints handle auth internally
    pathname.startsWith("/api/auth/firebase/verify") ||
    pathname.startsWith("/globe");

  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  if (isProtectedRoute) {
    // Get token from cookie or Authorization header
    const token =
      request.cookies.get("firebaseToken")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Redirect to login for page routes
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify the token
      await adminAuth.verifyIdToken(token);
      return NextResponse.next();
    } catch (error) {
      console.error("Token verification failed:", error);
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      // Redirect to login for page routes
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/websites/:path*",
    "/api/goals/:path*",
    "/api/websites/:path*/analytics",
    "/globe/:path*",
  ],
};
