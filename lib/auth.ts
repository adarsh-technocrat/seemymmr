import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import connectDB from "@/db";
import User from "@/db/models/User";
import { MongooseAdapter } from "./adapter";
import type { Adapter } from "next-auth/adapters";

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
};

export const authOptions: NextAuthOptions = {
  // @ts-ignore - pnpm dependency resolution issue with next-auth types
  adapter: MongooseAdapter(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    EmailProvider({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const { host } = new URL(url);
        const appName = "PostMetric";

        try {
          const resend = getResend();
          await resend.emails.send({
            from:
              provider.from ||
              process.env.EMAIL_FROM ||
              "onboarding@resend.dev",
            to: identifier,
            subject: `Sign in to ${appName}`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Sign in to ${appName}</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">${appName}</h1>
                  </div>
                  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Sign in to your account</h2>
                    <p style="color: #6b7280; font-size: 16px; margin-bottom: 30px;">
                      Click the button below to sign in to your ${appName} account. This link will expire in 24 hours.
                    </p>
                    <a href="${url}" style="display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-bottom: 20px;">
                      Sign in to ${appName}
                    </a>
                    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px; margin-bottom: 0;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; margin-bottom: 0;">
                      Or copy and paste this URL into your browser:<br>
                      <a href="${url}" style="color: #667eea; word-break: break-all;">${url}</a>
                    </p>
                  </div>
                  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                    <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
                  </div>
                </body>
              </html>
            `,
            text: `Sign in to ${appName}\n\nClick this link to sign in: ${url}\n\nThis link will expire in 24 hours.\n\nIf you didn't request this email, you can safely ignore it.`,
          });
        } catch (error) {
          console.error("Error sending email:", error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      await connectDB();

      // Handle both Google and Email providers
      if (account?.provider === "google" || account?.provider === "email") {
        // Find or create user
        let dbUser = await User.findOne({
          email: user.email?.toLowerCase(),
        });

        if (!dbUser) {
          // Create new user
          dbUser = new User({
            email: user.email?.toLowerCase(),
            name: user.name || user.email?.split("@")[0] || "User",
            avatarUrl: user.image,
            subscription: {
              plan: "free",
              status: "trial",
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            },
          });
          await dbUser.save();
        } else {
          // Update avatar if changed (for Google)
          if (user.image && dbUser.avatarUrl !== user.image) {
            dbUser.avatarUrl = user.image;
            await dbUser.save();
          }
        }

        // Update user object with database ID
        user.id = dbUser._id.toString();
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
