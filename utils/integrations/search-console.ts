import SearchConsoleData from "@/db/models/SearchConsoleData";
import connectDB from "@/db";

interface SearchConsoleRow {
  keys: string[]; // [query, page, country, device]
  clicks: string;
  impressions: string;
  ctr: string;
  position: string;
}

interface SearchConsoleResponse {
  rows: SearchConsoleRow[];
}

/**
 * Refresh Google OAuth access token
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetch data from Google Search Console API
 */
export async function fetchSearchConsoleData(
  propertyUrl: string,
  accessToken: string,
  refreshToken: string,
  startDate: Date,
  endDate: Date
): Promise<SearchConsoleRow[]> {
  try {
    // Try to use the access token, refresh if needed
    let token = accessToken;

    const url = new URL(
      `https://searchconsole.googleapis.com/v1/urlSearchAnalytics/searchAnalytics`
    );
    url.searchParams.set("siteUrl", propertyUrl);
    url.searchParams.set("startDate", startDate.toISOString().split("T")[0]);
    url.searchParams.set("endDate", endDate.toISOString().split("T")[0]);
    url.searchParams.set("rowLimit", "25000");

    let response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // If token expired, refresh and retry
    if (response.status === 401 && refreshToken) {
      token = await refreshAccessToken(refreshToken);
      response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Search Console data: ${response.statusText}`
      );
    }

    const data: SearchConsoleResponse = await response.json();
    return data.rows || [];
  } catch (error) {
    console.error("Error fetching Search Console data:", error);
    throw error;
  }
}

/**
 * Store Search Console data in database
 */
export async function storeSearchConsoleData(
  websiteId: string,
  rows: SearchConsoleRow[],
  date: Date
): Promise<void> {
  await connectDB();

  for (const row of rows) {
    const [query, page, country, device] = row.keys;

    await SearchConsoleData.findOneAndUpdate(
      {
        websiteId,
        date,
        query: query || "",
        page: page || "",
        country: country || undefined,
        device: device || undefined,
      },
      {
        websiteId,
        date,
        query: query || "",
        page: page || "",
        clicks: parseInt(row.clicks) || 0,
        impressions: parseInt(row.impressions) || 0,
        ctr: parseFloat(row.ctr) || 0,
        position: parseFloat(row.position) || 0,
        country: country || undefined,
        device: device || undefined,
      },
      {
        upsert: true,
        new: true,
      }
    );
  }
}

/**
 * Sync Google Search Console data for a website
 */
export async function syncSearchConsoleData(
  websiteId: string,
  propertyUrl: string,
  accessToken: string,
  refreshToken: string
): Promise<number> {
  try {
    await connectDB();

    // Get the last date we synced
    const lastData = await SearchConsoleData.findOne({ websiteId })
      .sort({ date: -1 })
      .limit(1);

    const endDate = new Date();
    const startDate = lastData?.date
      ? new Date(lastData.date)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default to 90 days ago

    // Fetch data for each day
    const rows: SearchConsoleRow[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayEnd = new Date(currentDate);
      dayEnd.setDate(dayEnd.getDate() + 1);

      try {
        const dayRows = await fetchSearchConsoleData(
          propertyUrl,
          accessToken,
          refreshToken,
          currentDate,
          dayEnd
        );
        rows.push(...dayRows);

        // Store data for this day
        if (dayRows.length > 0) {
          await storeSearchConsoleData(websiteId, dayRows, currentDate);
        }
      } catch (error) {
        console.error(
          `Error fetching data for ${currentDate.toISOString()}:`,
          error
        );
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return rows.length;
  } catch (error) {
    console.error(
      `Error syncing Search Console data for website ${websiteId}:`,
      error
    );
    throw error;
  }
}
