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

    const payment = new Payment({
      websiteId,
      provider,
      providerPaymentId,
      amount: Math.round(amount * 100),
      currency,
      renewal: false,
      refunded: false,
      customerEmail,
      customerId,
      sessionId,
      visitorId,
      metadata,
      timestamp: new Date(),
    });

    if (!visitorId && !sessionId) {
      try {
        const link = await linkPaymentToVisitor(
          {
            metadata,
            customerEmail,
            timestamp: payment.timestamp,
          },
          websiteId
        );

        if (link) {
          if (link.visitorId) payment.visitorId = link.visitorId;
          if (link.sessionId) payment.sessionId = link.sessionId;
        }
      } catch (error) {
        console.error("Error linking payment to visitor:", error);
      }
    }

    await payment.save();

    return NextResponse.json({
      status: "success",
      data: {
        paymentId: payment._id.toString(),
        message: "Payment recorded successfully",
      },
    });
  } catch (error: any) {
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
