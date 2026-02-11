/**
 * Test the sync-payment cron API locally.
 * Run with: npm run test:cron-sync
 *
 * Prerequisites:
 * 1. Start the dev server: npm run dev
 * 2. (Optional) Set CRON_SECRET in .env.local if your route requires it
 * 3. Ensure MongoDB is running and you have at least one website with Stripe + realtime sync configured
 */

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "";

async function main() {
  const url = `${BASE}/api/cron/sync-payment`;

  console.log("Testing sync-payment cron API at:", url);
  console.log("");

  // 1. GET - health check
  try {
    const getRes = await fetch(url);
    const getData = await getRes.json();
    console.log("GET (health check):", getRes.status, getData);
    if (!getRes.ok) {
      console.error("Health check failed.");
      process.exit(1);
    }
  } catch (err) {
    console.error("GET failed (is the dev server running? npm run dev):", err);
    process.exit(1);
  }

  // 2. POST - trigger sync
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (CRON_SECRET) {
    headers["Authorization"] = `Bearer ${CRON_SECRET}`;
    console.log("Using CRON_SECRET for Authorization.");
  } else {
    console.log("No CRON_SECRET set (auth skipped by route when unset).");
  }
  console.log("");

  try {
    const postRes = await fetch(url, { method: "POST", headers });
    const postData = await postRes.json();

    console.log("POST (sync):", postRes.status);
    console.log(JSON.stringify(postData, null, 2));

    if (!postRes.ok) {
      console.error("\nSync failed.");
      process.exit(1);
    }

    console.log("\nSync completed successfully.");
  } catch (err) {
    console.error("POST failed:", err);
    process.exit(1);
  }
}

main();
