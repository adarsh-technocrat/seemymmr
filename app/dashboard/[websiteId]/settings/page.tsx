"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWebsiteById } from "@/store/slices/websitesSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GeneralSettings } from "@/components/dashboard/GeneralSettings";
import { RevenueSettings } from "@/components/dashboard/RevenueSettings";

const SETTINGS_TABS = [
  { id: "general", label: "General", icon: "⚙️" },
  { id: "revenue", label: "Revenue", icon: "💰" },
  { id: "team", label: "Team", icon: "👥" },
  { id: "import", label: "Import", icon: "📥" },
  { id: "reports", label: "Reports", icon: "📊" },
  { id: "widgets", label: "Widgets", icon: "📱" },
  { id: "integrations", label: "Integrations", icon: "🔗" },
  { id: "api", label: "API", icon: "🔌" },
  { id: "exclusions", label: "Exclusions", icon: "🚫" },
  { id: "security", label: "Security", icon: "🔒" },
] as const;

export default function SettingsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const website = useAppSelector((state) => state.websites.currentWebsite) as {
    _id: string;
    domain: string;
    name: string;
    iconUrl?: string;
    trackingCode?: string;
    settings?: {
      timezone?: string;
      colorScheme?: string;
      nickname?: string;
      additionalDomains?: string[];
      publicDashboard?: {
        enabled: boolean;
        shareId?: string;
      };
    };
  } | null;

  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (websiteId) {
      dispatch(fetchWebsiteById(websiteId));
    }
  }, [websiteId, dispatch]);

  const handleUpdate = () => {
    dispatch(fetchWebsiteById(websiteId));
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-32 md:px-8 bg-background">
      {/* Header */}
      <section className="mb-8 space-y-2">
        <Link
          href={`/dashboard/${websiteId}`}
          className="btn btn-ghost btn-sm inline-flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="size-4"
          >
            <path
              fillRule="evenodd"
              d="M14 8a.75.75 0 0 1-.75.75H4.56l1.22 1.22a.75.75 0 1 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1 className="text-2xl font-bold text-textPrimary">
          Settings for {website?.domain || website?.name || "Loading..."}
        </h1>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Navigation */}
        <nav className="overflow-x-auto lg:w-52 lg:overflow-x-visible">
          <ul className="flex gap-2 lg:flex-col">
            {SETTINGS_TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full select-none items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 duration-200 ${
                    activeTab === tab.id
                      ? "bg-neutral text-neutral-content shadow"
                      : "bg-base-300 hover:bg-neutral hover:text-neutral-content"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="max-w-lg flex-1">
          {activeTab === "general" && (
            <GeneralSettings
              website={website}
              websiteId={websiteId}
              onUpdate={handleUpdate}
            />
          )}

          {activeTab === "revenue" && (
            <RevenueSettings
              website={website}
              websiteId={websiteId}
              onUpdate={handleUpdate}
            />
          )}

          {activeTab !== "general" && activeTab !== "revenue" && (
            <section className="space-y-4">
              <Card className="custom-card">
                <CardHeader>
                  <CardTitle>
                    {SETTINGS_TABS.find((t) => t.id === activeTab)?.label}
                  </CardTitle>
                  <CardDescription>
                    This section is coming soon. Check back later for more
                    features.
                  </CardDescription>
                </CardHeader>
              </Card>
            </section>
          )}
        </main>
      </div>
    </main>
  );
}
