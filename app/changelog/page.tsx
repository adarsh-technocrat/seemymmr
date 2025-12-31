import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

interface ChangelogEntry {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  changes: {
    type: "added" | "fixed" | "changed" | "removed" | "deprecated";
    description: string;
  }[];
}

const changelogEntries: ChangelogEntry[] = [
  {
    version: "0.1.0",
    date: "January 2025",
    type: "major",
    changes: [
      {
        type: "added",
        description: "Initial release of Postmetric analytics platform",
      },
      {
        type: "added",
        description: "Real-time visitor tracking and analytics dashboard",
      },
      {
        type: "added",
        description: "Revenue attribution tracking with Stripe integration",
      },
      {
        type: "added",
        description: "Cookie-free analytics with privacy-first approach",
      },
      {
        type: "added",
        description: "Interactive world map for visitor geolocation",
      },
      {
        type: "added",
        description: "Goal and funnel tracking capabilities",
      },
      {
        type: "added",
        description: "Source breakdown (Channel, Referrer, Campaign, Keyword)",
      },
      {
        type: "added",
        description: "Path analysis (Hostname, Page, Entry page, Exit link)",
      },
      {
        type: "added",
        description: "System analytics (Browser, OS, Device)",
      },
      {
        type: "added",
        description: "Team collaboration features",
      },
      {
        type: "added",
        description: "API key management",
      },
      {
        type: "added",
        description: "Email notifications and alerts",
      },
      {
        type: "added",
        description: "GitHub commits integration",
      },
      {
        type: "added",
        description: "Twitter/X mentions tracking",
      },
      {
        type: "added",
        description: "Search Console data sync",
      },
      {
        type: "added",
        description: "Revenue breakdown by new, renewal, and refunds",
      },
      {
        type: "added",
        description: "Custom date range selection",
      },
      {
        type: "added",
        description: "Multiple granularity options (Hourly, Daily, Weekly, Monthly)",
      },
    ],
  },
];

function getTypeColor(type: ChangelogEntry["type"]) {
  switch (type) {
    case "major":
      return "bg-red-100 text-red-700 border-red-200";
    case "minor":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "patch":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-stone-100 text-stone-700 border-stone-200";
  }
}

function getChangeIcon(type: ChangelogEntry["changes"][0]["type"]) {
  switch (type) {
    case "added":
      return (
        <svg
          className="w-4 h-4 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      );
    case "fixed":
      return (
        <svg
          className="w-4 h-4 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "changed":
      return (
        <svg
          className="w-4 h-4 text-yellow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      );
    case "removed":
      return (
        <svg
          className="w-4 h-4 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
    case "deprecated":
      return (
        <svg
          className="w-4 h-4 text-orange-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    default:
      return null;
  }
}

function getChangeLabel(type: ChangelogEntry["changes"][0]["type"]) {
  switch (type) {
    case "added":
      return "Added";
    case "fixed":
      return "Fixed";
    case "changed":
      return "Changed";
    case "removed":
      return "Removed";
    case "deprecated":
      return "Deprecated";
    default:
      return type;
  }
}

export default function ChangelogPage() {
  return (
    <div className="flex flex-col w-full items-center min-h-screen antialiased font-sans bg-stone-50">
      <Navbar />
      <main className="items-center w-full max-w-4xl border-x border-stone-200 flex flex-col bg-white">
        {/* Hero Section */}
        <div className="w-full px-6 lg:px-12 py-16 lg:py-24 border-b border-stone-200">
          <div className="flex flex-col gap-4 items-center text-center max-w-2xl mx-auto">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-mono text-stone-600 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Product Updates
            </div>
            <h1 className="font-cooper text-[32px] lg:text-[48px] leading-tight text-stone-900">
              Changelog
            </h1>
            <p className="text-stone-500 text-lg lg:text-xl leading-relaxed max-w-xl">
              Stay up to date with the latest features, improvements, and fixes
              to Postmetric.
            </p>
          </div>
        </div>

        {/* Changelog Entries */}
        <div className="w-full">
          <div className="flex flex-col">
            {changelogEntries.map((entry, index) => (
              <div
                key={entry.version}
                className={`flex flex-col gap-6 p-6 lg:p-12 ${
                  index !== changelogEntries.length - 1
                    ? "border-b border-stone-200"
                    : ""
                }`}
              >
                {/* Version Header */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl lg:text-3xl font-cooper text-stone-900">
                      Version {entry.version}
                    </h2>
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono uppercase border ${getTypeColor(
                        entry.type
                      )}`}
                    >
                      {entry.type}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 font-mono">
                    {entry.date}
                  </p>
                </div>

                {/* Changes List */}
                <div className="flex flex-col gap-3">
                  {entry.changes.map((change, changeIndex) => (
                    <div
                      key={changeIndex}
                      className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100 hover:bg-stone-100 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getChangeIcon(change.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono uppercase text-stone-600 font-semibold">
                            {getChangeLabel(change.type)}
                          </span>
                        </div>
                        <p className="text-stone-700 leading-relaxed">
                          {change.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State for Future Updates */}
          <div className="px-6 lg:px-12 py-16 text-center border-t border-stone-200">
            <p className="text-stone-500 text-sm font-mono">
              More updates coming soon...
            </p>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}

