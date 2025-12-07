import {
  Adapter,
  AdapterUser,
  AdapterAccount,
  AdapterSession,
  VerificationToken as AdapterVerificationToken,
} from "next-auth/adapters";
import connectDB from "@/db";
import User from "@/db/models/User";
import VerificationToken from "@/db/models/VerificationToken";

export function MongooseAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">) {
      await connectDB();
      const newUser = new User({
        email: user.email?.toLowerCase(),
        name: user.name || user.email?.split("@")[0] || "User",
        avatarUrl: user.image,
        subscription: {
          plan: "free",
          status: "trial",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      });
      await newUser.save();
      const adapterUser: AdapterUser = {
        id: newUser._id.toString(),
        email: newUser.email,
        emailVerified: null,
        name: newUser.name || "",
        image: newUser.avatarUrl || undefined,
      };
      return adapterUser;
    },
    async getUser(id) {
      await connectDB();
      const user = await User.findById(id);
      if (!user) return null;
      const adapterUser: AdapterUser = {
        id: user._id.toString(),
        email: user.email,
        emailVerified: null,
        name: user.name || "",
        image: user.avatarUrl || undefined,
      };
      return adapterUser;
    },
    async getUserByEmail(email) {
      await connectDB();
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return null;
      const adapterUser: AdapterUser = {
        id: user._id.toString(),
        email: user.email,
        emailVerified: null,
        name: user.name || "",
        image: user.avatarUrl || undefined,
      };
      return adapterUser;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      await connectDB();
      // For OAuth providers, we handle account linking in callbacks
      // This is mainly for email provider
      const user = await User.findOne({
        email: providerAccountId.toLowerCase(),
      });
      if (!user) return null;
      const adapterUser: AdapterUser = {
        id: user._id.toString(),
        email: user.email,
        emailVerified: null,
        name: user.name || "",
        image: user.avatarUrl || undefined,
      };
      return adapterUser;
    },
    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, "id">) {
      await connectDB();
      const updatedUser = await User.findByIdAndUpdate(
        user.id,
        {
          ...(user.name && { name: user.name }),
          ...(user.email && { email: user.email.toLowerCase() }),
          ...(user.image && { avatarUrl: user.image }),
        },
        { new: true }
      );
      if (!updatedUser) throw new Error("User not found");
      const adapterUser: AdapterUser = {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        emailVerified: null,
        name: updatedUser.name || "",
        image: updatedUser.avatarUrl || undefined,
      };
      return adapterUser;
    },
    async linkAccount(account: AdapterAccount) {
      // We handle account linking in callbacks, so this is a no-op
      return account;
    },
    async createSession({
      sessionToken,
      userId,
      expires,
    }: {
      sessionToken: string;
      userId: string;
      expires: Date;
    }) {
      // Using JWT strategy, so sessions are stored in JWT, not database
      // This is a no-op but required by the adapter interface
      return {
        sessionToken,
        userId,
        expires,
      };
    },
    async getSessionAndUser(sessionToken) {
      // Using JWT strategy, so sessions are stored in JWT, not database
      return null;
    },
    async updateSession({ sessionToken }: { sessionToken: string }) {
      // Using JWT strategy, so sessions are stored in JWT, not database
      return null;
    },
    async deleteSession(sessionToken: string) {
      // Using JWT strategy, so sessions are stored in JWT, not database
    },
    async createVerificationToken({
      identifier,
      expires,
      token,
    }: {
      identifier: string;
      expires: Date;
      token: string;
    }) {
      await connectDB();
      // Delete any existing tokens for this identifier
      await VerificationToken.deleteMany({ identifier });
      const verificationToken = new VerificationToken({
        identifier,
        token,
        expires,
      });
      await verificationToken.save();
      return {
        identifier,
        token,
        expires,
      };
    },
    async useVerificationToken({
      identifier,
      token,
    }: {
      identifier: string;
      token: string;
    }) {
      await connectDB();
      const verificationToken = await VerificationToken.findOneAndDelete({
        identifier,
        token,
      });
      if (!verificationToken) return null;
      return {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: verificationToken.expires,
      };
    },
  };
}
