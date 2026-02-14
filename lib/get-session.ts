import { cache } from "react";
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

/**
 * Session is cached per-request so multiple getSession/getUserId calls
 * (e.g. in the same route or across helpers) only verify the token and hit DB once.
 */
async function getSessionUncached(
  request?: NextRequest,
): Promise<Session | null> {
  try {
    let idToken: string | null = null;
    if (request) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        idToken = authHeader.substring(7);
      } else {
        const cookieStore = await cookies();
        idToken = cookieStore.get("firebaseToken")?.value || null;
      }
    } else {
      const cookieStore = await cookies();
      idToken = cookieStore.get("firebaseToken")?.value || null;
    }

    if (!idToken) {
      return null;
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { email } = decodedToken;

    if (!email) {
      return null;
    }

    await connectDB();

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
    return null;
  }
}

const getSessionCached = cache(getSessionUncached);

export async function getSession(
  request?: NextRequest,
): Promise<Session | null> {
  return getSessionCached(request);
}

export async function getUserId(request?: NextRequest): Promise<string | null> {
  const session = await getSessionCached(request);
  return session?.user?.id || null;
}
