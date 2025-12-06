import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Try to get IP from various headers (for proxies/load balancers)
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    let ip = forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp;

    if (!ip) {
      ip = "Unknown";
    }

    return NextResponse.json({ ip });
  } catch (error: any) {
    console.error("Error getting IP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get IP address" },
      { status: 500 }
    );
  }
}
