#!/usr/bin/env node
/**
 * Test script for tracking script validation
 * Checks syntax, required functions, and common issues
 */

import { readFileSync } from "fs";
import { join } from "path";
import { minify } from "terser";

const TRACKING_SCRIPT_PATH = join(process.cwd(), "lib/tracking/script.js");

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const tests: TestResult[] = [];

function addTest(name: string, passed: boolean, error?: string) {
  tests.push({ name, passed, error });
}

function testSyntax(scriptContent: string): boolean {
  try {
    // Try to parse as JavaScript
    new Function(scriptContent);
    return true;
  } catch (error) {
    addTest(
      "JavaScript Syntax",
      false,
      `Syntax error: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

function testRequiredFunctions(scriptContent: string): void {
  const requiredFunctions = [
    "getVisitorId",
    "getSessionId",
    "trackPageview",
    "sendEvent",
    "setCookie",
    "getCookie",
  ];

  requiredFunctions.forEach((funcName) => {
    const regex = new RegExp(
      `function\\s+${funcName}|const\\s+${funcName}\\s*=|let\\s+${funcName}\\s*=|var\\s+${funcName}\\s*=`,
      "m"
    );
    const found = regex.test(scriptContent);
    addTest(
      `Required function: ${funcName}`,
      found,
      found ? undefined : `Function ${funcName} not found`
    );
  });
}

function testCookieNames(scriptContent: string): void {
  // Check that cookie names match backend expectations
  const cookieChecks = [
    { name: "_pm_vid", shouldExist: true },
    { name: "_pm_sid", shouldExist: true },
    {
      name: "postmetric_visitor_id",
      shouldExist: false,
      error: "Old cookie name found. Should use _pm_vid",
    },
    {
      name: "postmetric_session_id",
      shouldExist: false,
      error: "Old cookie name found. Should use _pm_sid",
    },
  ];

  cookieChecks.forEach(({ name, shouldExist, error }) => {
    const regex = new RegExp(`['"]${name}['"]`, "g");
    const found = regex.test(scriptContent);

    if (shouldExist && !found) {
      addTest(`Cookie name: ${name}`, false, `Cookie name ${name} not found`);
    } else if (!shouldExist && found) {
      addTest(
        `Cookie name: ${name}`,
        false,
        error || `Unexpected cookie name ${name} found`
      );
    } else {
      addTest(`Cookie name: ${name}`, true);
    }
  });
}

function testIIFE(scriptContent: string): void {
  // Check that script is wrapped in IIFE (after removing leading comments)
  const trimmed = scriptContent.trim();
  // Remove leading block comments and whitespace
  const withoutComments = trimmed.replace(/^\/\*[\s\S]*?\*\//, "").trim();
  const hasIIFE =
    /^\(function\(\)\s*\{/.test(withoutComments) ||
    /^\(\(\)\s*=>\s*\{/.test(withoutComments) ||
    /\(function\(\)/.test(scriptContent); // Check anywhere in the file as fallback
  addTest(
    "IIFE Wrapper",
    hasIIFE,
    hasIIFE ? undefined : "Script should be wrapped in IIFE"
  );
}

function testStrictMode(scriptContent: string): void {
  // Check for 'use strict'
  const hasStrictMode = /['"]use\s+strict['"]/.test(scriptContent);
  addTest(
    "'use strict' mode",
    hasStrictMode,
    hasStrictMode ? undefined : "Script should include 'use strict'"
  );
}

function testNoConsoleErrors(scriptContent: string): void {
  // Check for console.error or console.warn that might indicate issues
  const hasConsoleError = /console\.(error|warn)\(/.test(scriptContent);
  // This is just a warning, not a failure
  if (hasConsoleError) {
    console.warn(
      "⚠️  Warning: Script contains console.error or console.warn calls"
    );
  }
}

function testApiUrl(scriptContent: string): void {
  // Check that API URL is constructed properly
  const hasApiUrl = /\/api\/track/.test(scriptContent);
  addTest(
    "API URL reference",
    hasApiUrl,
    hasApiUrl ? undefined : "API URL (/api/track) not found"
  );
}

async function testMinification(scriptContent: string): Promise<void> {
  try {
    const result = await minify(scriptContent, {
      compress: {
        drop_console: false, // Keep console statements for debugging
        passes: 2,
      },
      mangle: {
        reserved: [
          // Preserve important function names that might be called externally
          "postmetric",
          "getVisitorId",
          "getSessionId",
          "trackPageview",
          "sendEvent",
        ],
      },
      format: {
        comments: false,
      },
    });

    if (!result.code) {
      addTest(
        "Minification",
        false,
        "Minification failed: No output code generated"
      );
      return;
    }

    // Test that minified code is valid JavaScript
    try {
      new Function(result.code);
      addTest("Minification", true);
    } catch (error) {
      addTest(
        "Minification - Valid JS",
        false,
        `Minified code is not valid JavaScript: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    // Check that minified code still contains essential elements
    const hasApiUrl = /\/api\/track/.test(result.code);
    if (!hasApiUrl) {
      addTest(
        "Minification - API URL preserved",
        false,
        "API URL not found in minified code"
      );
    } else {
      addTest("Minification - API URL preserved", true);
    }

    // Log minification stats
    const originalSize = scriptContent.length;
    const minifiedSize = result.code.length;
    const compressionRatio = ((1 - minifiedSize / originalSize) * 100).toFixed(
      1
    );
    console.log(
      `\n📦 Minification stats: ${originalSize} → ${minifiedSize} bytes (${compressionRatio}% reduction)`
    );
  } catch (error) {
    addTest(
      "Minification",
      false,
      `Minification error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function testValidJavaScript(scriptContent: string): void {
  // More thorough JavaScript validation
  try {
    // Test 1: Basic syntax check (already done in testSyntax, but verify again)
    try {
      new Function(scriptContent);
      addTest("Valid JavaScript - Syntax", true);
    } catch (error) {
      addTest(
        "Valid JavaScript - Syntax",
        false,
        `Syntax error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return; // Don't run other tests if syntax is invalid
    }

    // Test 2: Verify script can be parsed as valid JavaScript
    // Since new Function() succeeded, the script is syntactically valid
    // Additional structural checks would require a full AST parser
    addTest("Valid JavaScript - Parseable", true);
  } catch (error) {
    addTest(
      "Valid JavaScript",
      false,
      `JavaScript validation error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function main() {
  console.log("🧪 Testing tracking script...\n");

  try {
    const scriptContent = readFileSync(TRACKING_SCRIPT_PATH, "utf-8");

    // Run syntax test first
    if (!testSyntax(scriptContent)) {
      // If syntax fails, don't run other tests
      printResults();
      process.exit(1);
    }

    // Run synchronous tests
    testRequiredFunctions(scriptContent);
    testCookieNames(scriptContent);
    testIIFE(scriptContent);
    testStrictMode(scriptContent);
    testNoConsoleErrors(scriptContent);
    testApiUrl(scriptContent);
    testValidJavaScript(scriptContent);

    // Run async minification test
    await testMinification(scriptContent);

    printResults();

    const failedTests = tests.filter((t) => !t.passed);
    if (failedTests.length > 0) {
      console.error(`\n❌ ${failedTests.length} test(s) failed\n`);
      process.exit(1);
    } else {
      console.log("\n✅ All tests passed!\n");
      process.exit(0);
    }
  } catch (error) {
    console.error(
      "❌ Error reading tracking script:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

function printResults() {
  tests.forEach((test) => {
    const icon = test.passed ? "✅" : "❌";
    console.log(`${icon} ${test.name}`);
    if (test.error && !test.passed) {
      console.log(`   ${test.error}`);
    }
  });
}

main();
