import connectDB from "@/db";
import Profile from "@/db/models/Profile";

/**
 * Database query functions using MongoDB/Mongoose
 */

// Server-side database operations
export async function getProfiles() {
  await connectDB();

  try {
    const profiles = await Profile.find({}).sort({ createdAt: -1 });
    return profiles;
  } catch (error) {
    throw error;
  }
}

export async function getProfileByUserId(userId: string) {
  await connectDB();

  try {
    const profile = await Profile.findOne({ userId });
    return profile;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new profile
 */
export async function createProfile(data: {
  userId: string;
  fullName?: string;
  avatarUrl?: string;
}) {
  await connectDB();

  try {
    const profile = new Profile({
      userId: data.userId,
      fullName: data.fullName,
      avatarUrl: data.avatarUrl,
    });

    await profile.save();
    return profile;
  } catch (error) {
    throw error;
  }
}

/**
 * Update profile
 */
export async function updateProfile(
  userId: string,
  updates: {
    fullName?: string;
    avatarUrl?: string;
  }
) {
  await connectDB();

  try {
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return profile;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete profile
 */
export async function deleteProfile(userId: string) {
  await connectDB();

  try {
    await Profile.findOneAndDelete({ userId });
  } catch (error) {
    throw error;
  }
}
