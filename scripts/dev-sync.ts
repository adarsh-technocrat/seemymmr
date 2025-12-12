/**
 * Development script to sync and process jobs locally
 *
 * Usage:
 *   pnpm dev:sync                              # Sync and process all pending jobs (hourly - last 2h)
 *   pnpm dev:sync --frequency every-6-hours    # Sync last 24 hours for all websites
 *   pnpm dev:sync --frequency daily            # Sync last 7 days for all websites
 *   pnpm dev:sync --process-only               # Only process existing jobs
 *   pnpm dev:sync --create-only                 # Only create sync jobs
 *   pnpm dev:sync --website-id <id>             # Sync specific website (last 24h)
 *   pnpm dev:sync --website-id <id> --hours-back 48  # Sync specific website (last 48h)
 *   pnpm dev:sync --all-time                    # Sync all websites with all historical data
 *   pnpm dev:sync --website-id <id> --all-time  # Sync specific website with all historical data
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "";
// Firebase token for user authentication (extract from browser cookies)
const FIREBASE_TOKEN =
  process.env.FIREBASE_TOKEN ||
  "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk1MTg5MTkxMTA3NjA1NDM0NGUxNWUyNTY0MjViYjQyNWVlYjNhNWMiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQWRhcnNoIHNpbmdoIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lSUElFWTVXbWpLaGxIU3VwdEtBUnJaWHV5dEFoZXpfWElwa1BWQ2l5cDlMZldkQT1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9zZWVtb3JldGhhbm1tciIsImF1ZCI6InNlZW1vcmV0aGFubW1yIiwiYXV0aF90aW1lIjoxNzY1NTEwMzc0LCJ1c2VyX2lkIjoiWmE0bnhmaXVlR2Y1TEFmWEkzMkRMUnZGRDhLMiIsInN1YiI6IlphNG54Zml1ZUdmNUxBZlhJMzJETFJ2RkQ4SzIiLCJpYXQiOjE3NjU1MTAzNzQsImV4cCI6MTc2NTUxMzk3NCwiZW1haWwiOiJhZGFyc2guc2luZ2hAcmVkYmF0b24uaW4iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExMjI5NTU4NDAyMTkwMDUzODE1MSJdLCJlbWFpbCI6WyJhZGFyc2guc2luZ2hAcmVkYmF0b24uaW4iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.Jrx-wPghzVP4SiyhhywQp4DDBqTHi2jf0MBy96AWyFXs7uBO4hmYjnHYKoMIQDyE-i7niXfI0uvbnDgZdUmcS2g8FOpaswcFcEIardRgVHwhMfG86Vs6C4LQxvDpzzFV07ScreVoKTsBOVwlD9Qfdi0UP_QVYLVodCHUIqgjZOFM4ZRNSsGMB3qkSWYK4qFV-ef6QOgAmnQnTKLH-9ISMHmDU21TRSQ3GTJaIVC5cdAwMLZQqe-Kwc0_ZOTwbOzLc3te_yy-24m_Py0SLU2lwIx9TjVmwAUBhhut8xJdpMXfOOjuDXBz1VReRrC-CabrWkCo0m3VD1C8pxrjTRfkFw";

interface Options {
  processOnly?: boolean;
  createOnly?: boolean;
  websiteId?: string;
  frequency?: "hourly" | "every-6-hours" | "daily";
  hoursBack?: number;
  allTime?: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--process-only") {
      options.processOnly = true;
    } else if (arg === "--create-only") {
      options.createOnly = true;
    } else if (arg === "--website-id" && args[i + 1]) {
      options.websiteId = args[++i];
    } else if (arg === "--frequency" && args[i + 1]) {
      options.frequency = args[++i] as Options["frequency"];
    } else if (arg === "--hours-back" && args[i + 1]) {
      options.hoursBack = parseInt(args[++i], 10);
    } else if (arg === "--all-time") {
      options.allTime = true;
    }
  }

  return options;
}

async function makeRequest(
  url: string,
  method: "GET" | "POST" = "GET",
  body?: any
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Use CRON_SECRET for cron endpoints via Authorization header
  if (CRON_SECRET && url.includes("/api/cron/")) {
    headers["Authorization"] = `Bearer ${CRON_SECRET}`;
  }

  // For sync endpoints, use Firebase token via Cookie header
  if (FIREBASE_TOKEN && url.includes("/sync")) {
    headers["Cookie"] = `firebaseToken=${FIREBASE_TOKEN}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Request failed: ${response.status} ${error}`);
  }

  return response.json();
}

async function createSyncJobs(frequency: Options["frequency"] = "hourly") {
  console.log(`\n📥 Creating sync jobs (frequency: ${frequency})...`);

  try {
    const url = `${BASE_URL}/api/cron/sync-payments?frequency=${frequency}`;
    const result = await makeRequest(url, "POST");

    console.log(
      `✅ Created ${result.jobsCreated} sync job(s) for ${result.websitesProcessed} website(s)`
    );
    if (result.jobs && result.jobs.length > 0) {
      console.log("   Jobs created:");
      result.jobs.forEach((job: any) => {
        console.log(
          `   - ${job.provider} for website ${job.websiteId} (job: ${job.jobId})`
        );
      });
    }

    return result;
  } catch (error: any) {
    console.error(`❌ Failed to create sync jobs: ${error.message}`);
    throw error;
  }
}

async function processJobs(batchSize: number = 10) {
  console.log(`\n⚙️  Processing pending jobs (batch size: ${batchSize})...`);

  let totalProcessed = 0;
  let attempts = 0;
  const maxAttempts = 10; // Prevent infinite loops

  while (attempts < maxAttempts) {
    try {
      const url = `${BASE_URL}/api/jobs/process`;
      const result = await makeRequest(url, "POST", {
        batchSize,
        maxConcurrent: 3,
      });

      if (result.processed === 0) {
        break; // No more jobs to process
      }

      totalProcessed += result.processed;
      console.log(`   Processed ${result.processed} job(s)...`);

      if (result.jobs) {
        result.jobs.forEach((job: any) => {
          const status = job.status === "completed" ? "✅" : "❌";
          console.log(`   ${status} Job ${job.jobId}: ${job.status}`);
          if (job.result) {
            console.log(
              `      Synced: ${job.result.synced}, Skipped: ${job.result.skipped}, Errors: ${job.result.errors}`
            );
          }
          if (job.error) {
            console.log(`      Error: ${job.error}`);
          }
        });
      }

      attempts++;

      // If we processed less than batchSize, we're done
      if (result.processed < batchSize) {
        break;
      }
    } catch (error: any) {
      console.error(`❌ Failed to process jobs: ${error.message}`);
      throw error;
    }
  }

  if (totalProcessed > 0) {
    console.log(`\n✅ Successfully processed ${totalProcessed} job(s) total`);
  } else {
    console.log(`\nℹ️  No pending jobs to process`);
  }

  return totalProcessed;
}

async function syncWebsite(
  websiteId: string,
  hoursBack: number = 24,
  allTime: boolean = false
) {
  if (allTime) {
    // Sync all time: go back 10 years (87,600 hours)
    hoursBack = 10 * 365 * 24;
    console.log(
      `\n📥 Creating manual sync for website ${websiteId} (ALL TIME - last 10 years)...`
    );
  } else {
    console.log(
      `\n📥 Creating manual sync for website ${websiteId} (last ${hoursBack} hours)...`
    );
  }

  try {
    const url = `${BASE_URL}/api/websites/${websiteId}/sync`;
    const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const endDate = new Date();

    const result = await makeRequest(url, "POST", {
      provider: "stripe",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    console.log(`✅ Created sync job: ${result.jobId}`);
    console.log(
      `   Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );
    return result;
  } catch (error: any) {
    console.error(`❌ Failed to create sync job: ${error.message}`);
    throw error;
  }
}

async function getAllWebsites(): Promise<
  Array<{ _id: string; name?: string }>
> {
  try {
    // Try to get websites from the API
    // Note: This requires authentication, so it may fail if not logged in
    const url = `${BASE_URL}/api/websites`;
    const response = await makeRequest(url, "GET");
    return response.websites || [];
  } catch (error: any) {
    console.warn(`⚠️  Could not fetch websites list: ${error.message}`);
    console.warn(`   Will use cron endpoint instead for all-time sync`);
    return [];
  }
}

async function syncAllWebsitesAllTime() {
  console.log(`\n📥 Creating sync jobs for ALL websites with ALL TIME data...`);

  // Try to get all websites
  const websites = await getAllWebsites();

  if (websites.length === 0) {
    // Fallback: Use a very large hours-back value with cron endpoint
    // But cron endpoint doesn't support custom ranges, so we'll need to sync each website individually
    console.log(
      `   Using cron endpoint with daily frequency (largest available range)...`
    );
    await createSyncJobs("daily");
    return;
  }

  // Sync each website individually with all-time data
  const hoursBack = 10 * 365 * 24; // 10 years
  let successCount = 0;
  let errorCount = 0;

  for (const website of websites) {
    try {
      await syncWebsite(website._id, hoursBack, true);
      successCount++;
    } catch (error: any) {
      console.error(
        `   ❌ Failed to sync website ${website._id}: ${error.message}`
      );
      errorCount++;
    }
  }

  console.log(`\n✅ Created sync jobs for ${successCount} website(s)`);
  if (errorCount > 0) {
    console.log(
      `   ⚠️  Failed to create sync jobs for ${errorCount} website(s)`
    );
  }
}

async function main() {
  const options = parseArgs();

  console.log("🚀 PostMetric Dev Sync Tool");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(
    `   Firebase Token: ${
      FIREBASE_TOKEN ? "✅ Set" : "⚠️  Not set (required for sync endpoints)"
    }`
  );
  console.log(
    `   Cron Secret: ${
      CRON_SECRET ? "✅ Set" : "⚠️  Not set (may fail if required)"
    }`
  );

  try {
    if (options.allTime) {
      // Sync all time
      if (options.websiteId) {
        // Sync specific website with all-time data
        await syncWebsite(options.websiteId, options.hoursBack || 24, true);
        if (!options.createOnly) {
          await processJobs();
        }
      } else {
        // Sync all websites with all-time data
        await syncAllWebsitesAllTime();
        if (!options.createOnly) {
          await processJobs();
        }
      }
    } else if (options.websiteId) {
      // Sync specific website
      await syncWebsite(options.websiteId, options.hoursBack || 24, false);
      if (!options.createOnly) {
        await processJobs();
      }
    } else if (options.processOnly) {
      // Only process existing jobs
      await processJobs();
    } else if (options.createOnly) {
      // Only create sync jobs
      await createSyncJobs(options.frequency);
    } else {
      // Default: create and process
      await createSyncJobs(options.frequency);
      await processJobs();
    }

    console.log("\n✨ Done!");
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === "undefined") {
  console.error(
    "❌ This script requires Node.js 18+ with native fetch support"
  );
  console.error("   Or install node-fetch: pnpm add -D node-fetch");
  process.exit(1);
}

main();
