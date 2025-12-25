import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === "production";

  // In production, redirect all non-API routes to launching-soon page
  if (isProduction) {
    // Allow API routes to work normally
    if (pathname.startsWith("/api")) {
      // Continue with authentication checks for protected API routes
      const isProtectedRoute =
        pathname.startsWith("/api/websites") ||
        pathname.startsWith("/api/goals");

      // Skip authentication for public API routes
      const isPublicApiRoute =
        pathname.startsWith("/api/track") ||
        pathname.startsWith("/api/identify") ||
        (pathname.startsWith("/api/websites") &&
          pathname.includes("/public")) ||
        pathname.startsWith("/api/auth/firebase/verify") ||
        pathname.startsWith("/api/v1") ||
        pathname.startsWith("/api/webhooks") ||
        pathname.startsWith("/api/jobs") ||
        pathname.startsWith("/api/cron") ||
        pathname.startsWith("/api/ip");

      if (isPublicApiRoute) {
        return NextResponse.next();
      }

      if (isProtectedRoute) {
        // Get token from cookie or Authorization header
        const token =
          request.cookies.get("firebaseToken")?.value ||
          request.headers.get("authorization")?.replace("Bearer ", "");

        if (!token) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          // Verify the token
          await adminAuth.verifyIdToken(token);
          return NextResponse.next();
        } catch (error) {
          console.error("Token verification failed:", error);
          return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }
      }

      return NextResponse.next();
    }

    // Allow the launching-soon page and static assets
    if (
      pathname === "/launching-soon" ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname.startsWith("/icon") ||
      pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/)
    ) {
      return NextResponse.next();
    }

    // Redirect all other routes to launching-soon
    if (pathname !== "/launching-soon") {
      return NextResponse.redirect(new URL("/launching-soon", request.url));
    }
  }

  // In development, handle authentication for protected routes
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/websites") ||
    pathname.startsWith("/api/goals");

  // Skip authentication for public API routes
  const isPublicApiRoute =
    pathname.startsWith("/api/track") ||
    pathname.startsWith("/api/identify") ||
    (pathname.startsWith("/api/websites") && pathname.includes("/public")) ||
    pathname.startsWith("/api/auth/firebase/verify") ||
    pathname.startsWith("/api/v1") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/jobs") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/ip");

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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
