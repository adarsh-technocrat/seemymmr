import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import connectDB from "@/db";
import User from "@/db/models/User";
import { getTrialEndDate } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase();
    const userName = name || email.split("@")[0] || "User";

    // Use findOneAndUpdate with upsert to handle race conditions atomically
    // $setOnInsert only applies when creating a new document
    // $set applies to both new and existing documents
    const updateData: any = {
      email: normalizedEmail,
      name: userName,
    };

    // Always update avatarUrl if picture is available from Firebase
    if (picture) {
      updateData.avatarUrl = picture;
    }

    const dbUser = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: updateData,
        $setOnInsert: {
          subscription: {
            plan: "free",
            status: "trial",
            trialEndsAt: getTrialEndDate(),
          },
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return NextResponse.json({
      user: {
        id: dbUser._id.toString(),
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.avatarUrl || picture || undefined,
      },
      firebaseUid: uid,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
