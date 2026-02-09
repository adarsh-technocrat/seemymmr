import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import NewsletterSubscriber from "@/db/models/NewsletterSubscriber";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await NewsletterSubscriber.findOne({
      email: email.toLowerCase(),
    });

    if (existing) {
      return NextResponse.json(
        { error: "This email is already subscribed" },
        { status: 400 }
      );
    }

    // Create new subscriber
    const subscriber = new NewsletterSubscriber({
      email: email.toLowerCase(),
      subscribedAt: new Date(),
      status: "active",
    });

    await subscriber.save();

    // In a real application, you would send a confirmation email here
    // For now, we'll just return success

    return NextResponse.json(
      {
        message: "Successfully subscribed to newsletter",
        subscriber: {
          email: subscriber.email,
          subscribedAt: subscriber.subscribedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again later." },
      { status: 500 }
    );
  }
}

