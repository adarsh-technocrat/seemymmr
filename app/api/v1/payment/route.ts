import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/utils/api/auth";
import { linkPaymentToVisitor } from "@/utils/revenue/linkPayment";
import connectDB from "@/db";
import Payment from "@/db/models/Payment";

/**
 * POST /api/v1/payment
 * Record a payment using API key authentication
 * Based on DataFast API: https://datafa.st/docs/api-introduction
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate using API key
    const auth = await authenticateApiRequest(request);

    if (!auth) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: 401,
            message: "Unauthorized. Invalid or missing API key.",
          },
        },
        { status: 401 }
      );
    }

    const { websiteId } = auth;
    const body = await request.json();

    const {
      provider,
      providerPaymentId,
      amount,
      currency = "USD",
      customerEmail,
      customerId,
      visitorId,
      sessionId,
      metadata,
    } = body;

    if (!provider || !providerPaymentId || !amount) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: 400,
            message: "provider, providerPaymentId, and amount are required",
          },
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Create payment record
    const payment = new Payment({
      websiteId,
      provider,
      providerPaymentId,
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      status: "completed",
      customerEmail,
      customerId,
      sessionId,
      visitorId,
      metadata,
      timestamp: new Date(),
    });

    await payment.save();

    // Try to link payment to visitor if visitorId/sessionId provided
    if (visitorId || sessionId) {
      try {
        await linkPaymentToVisitor(
          {
            metadata,
            customerEmail,
            timestamp: new Date(),
          },
          websiteId
        );
      } catch (error) {
        console.error("Error linking payment to visitor:", error);
        // Don't fail the request if linking fails
      }
    }

    return NextResponse.json({
      status: "success",
      data: {
        paymentId: payment._id.toString(),
        message: "Payment recorded successfully",
      },
    });
  } catch (error: unknown) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: 500,
          message: error.message || "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}

