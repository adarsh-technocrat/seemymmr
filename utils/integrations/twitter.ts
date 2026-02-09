import Mention from "@/db/models/Mention";
import connectDB from "@/db";

interface TwitterMention {
  id: string;
  text: string;
  created_at: string;
  author_id?: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
  };
  entities?: {
    urls?: Array<{ url: string; expanded_url?: string }>;
  };
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

/**
 * Fetch mentions from Twitter/X API v2
 * Requires Twitter API Bearer Token
 */
export async function fetchTwitterMentions(
  username: string,
  bearerToken: string,
  sinceId?: string
): Promise<TwitterMention[]> {
  try {
    // First, get the user ID from username
    const userResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    const userId = userData.data?.id;

    if (!userId) {
      throw new Error("User not found");
    }

    // Fetch mentions (tweets that mention the username)
    const mentionsUrl = new URL(
      "https://api.twitter.com/2/tweets/search/recent"
    );
    mentionsUrl.searchParams.set("query", `@${username} -is:retweet`);
    mentionsUrl.searchParams.set("max_results", "100");
    mentionsUrl.searchParams.set(
      "tweet.fields",
      "created_at,author_id,public_metrics,entities"
    );
    mentionsUrl.searchParams.set(
      "user.fields",
      "username,name,profile_image_url"
    );
    mentionsUrl.searchParams.set("expansions", "author_id");

    if (sinceId) {
      mentionsUrl.searchParams.set("since_id", sinceId);
    }

    const mentionsResponse = await fetch(mentionsUrl.toString(), {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    if (!mentionsResponse.ok) {
      throw new Error(
        `Failed to fetch mentions: ${mentionsResponse.statusText}`
      );
    }

    const mentionsData = await mentionsResponse.json();
    return mentionsData.data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Store mentions in database
 */
export async function storeMentions(
  websiteId: string,
  mentions: TwitterMention[],
  users: Record<string, TwitterUser>
): Promise<void> {
  await connectDB();

  for (const mention of mentions) {
    const mentionDate = new Date(mention.created_at);
    const author = mention.author_id ? users[mention.author_id] : null;
    const url = mention.entities?.urls?.[0]?.expanded_url;

    // Determine mention type
    let type: "profile" | "gear" | "other" = "other";
    if (mention.text.includes("🔧") || mention.text.includes("⚙️")) {
      type = "gear";
    } else if (author) {
      type = "profile";
    }

    await Mention.findOneAndUpdate(
      {
        websiteId,
        tweetId: mention.id,
      },
      {
        websiteId,
        date: mentionDate,
        text: mention.text,
        url,
        type,
        authorUsername: author?.username,
        authorAvatarUrl: author?.profile_image_url,
        tweetId: mention.id,
        retweetCount: mention.public_metrics?.retweet_count || 0,
        likeCount: mention.public_metrics?.like_count || 0,
      },
      {
        upsert: true,
        new: true,
      }
    );
  }
}

/**
 * Sync Twitter mentions for a website
 */
export async function syncTwitterMentions(
  websiteId: string,
  username: string,
  bearerToken: string
): Promise<number> {
  try {
    // Get the last mention ID we synced
    await connectDB();
    const lastMention = await Mention.findOne({ websiteId })
      .sort({ date: -1 })
      .limit(1);

    const sinceId = lastMention?.tweetId;

    // Fetch new mentions
    const mentions = await fetchTwitterMentions(username, bearerToken, sinceId);

    if (mentions.length === 0) {
      return 0;
    }

    // Fetch user data for authors
    const authorIds = [
      ...new Set(mentions.map((m) => m.author_id).filter(Boolean)),
    ];
    const users: Record<string, TwitterUser> = {};

    // Note: In a real implementation, you'd fetch user data from the API
    // For now, we'll store what we have from the mentions response

    await storeMentions(websiteId, mentions, users);

    return mentions.length;
  } catch (error) {
    throw error;
  }
}
