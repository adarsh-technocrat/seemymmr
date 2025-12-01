import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { readFileSync } from "fs";
import { join } from "path";

let app: App;
if (getApps().length === 0) {
  let serviceAccount: any = undefined;

  try {
    const secretPath = join(process.cwd(), "firebase-secret.json");
    const secretFile = readFileSync(secretPath, "utf8");
    serviceAccount = JSON.parse(secretFile);
    console.log("✅ Loaded Firebase service account from firebase-secret.json");
  } catch (fileError: any) {
    console.log("⚠️  Could not read firebase-secret.json:", fileError?.message);

    // Fallback to environment variable if file read fails
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log("Trying FIREBASE_SERVICE_ACCOUNT_KEY from environment...");
      try {
        let keyValue = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();

        // Remove outer quotes if present
        if (
          (keyValue.startsWith('"') && keyValue.endsWith('"')) ||
          (keyValue.startsWith("'") && keyValue.endsWith("'"))
        ) {
          keyValue = keyValue.slice(1, -1);
        }

        // Unescape the JSON string - handle all escape sequences
        keyValue = keyValue
          .replace(/\\"/g, '"')
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\\\/g, "\\");

        serviceAccount = JSON.parse(keyValue);
        console.log(
          "✅ Loaded Firebase service account from environment variable"
        );
      } catch (error: any) {
        console.error(
          "❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:",
          error?.message
        );
        throw new Error(
          `Invalid FIREBASE_SERVICE_ACCOUNT_KEY format: ${error?.message}. Please check your .env.local file or ensure firebase-secret.json exists.`
        );
      }
    } else {
      throw new Error(
        `Could not load Firebase service account: ${fileError?.message}. Please ensure firebase-secret.json exists or set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.`
      );
    }
  }

  if (!serviceAccount) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set and firebase-secret.json not found"
    );
  }

  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
} else {
  app = getApps()[0];
}

// Initialize Firebase Admin Auth
export const adminAuth: Auth = getAuth(app);

export default app;
