import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import connectDB from "@/db";
import User from "@/db/models/User";
import { cookies } from "next/headers";

export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  };
}

export async function getSession(
  request?: NextRequest,
): Promise<Session | null> {
  try {
    let idToken: string | null = null;
    if (request) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        idToken = authHeader.substring(7);
      } else {
        // Try to get from cookies
        const cookieStore = await cookies();
        idToken = cookieStore.get("firebaseToken")?.value || null;
      }
    } else {
      // For server components, get from cookies
      const cookieStore = await cookies();
      idToken = cookieStore.get("firebaseToken")?.value || null;
    }

    if (!idToken) {
      return null;
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { email } = decodedToken;

    if (!email) {
      return null;
    }

    await connectDB();

    // Get user from database
    const dbUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!dbUser) {
      return null;
    }

    return {
      user: {
        id: dbUser._id.toString(),
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.avatarUrl,
      },
    };
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Get the current user ID from the session
 */
export async function getUserId(request?: NextRequest): Promise<string | null> {
  const session = await getSession(request);
  return session?.user?.id || null;
}
