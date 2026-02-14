"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWebsiteDetailsById } from "@/store/slices/websitesSlice";
import { GeneralSettings } from "@/components/dashboard/settings/GeneralSettings";
import { RevenueSettings } from "@/components/dashboard/settings/RevenueSettings";
import { TeamSettings } from "@/components/dashboard/settings/TeamSettings";
import { SecuritySettings } from "@/components/dashboard/settings/SecuritySettings";
import { ExclusionsSettings } from "@/components/dashboard/settings/ExclusionsSettings";
import { APISettings } from "@/components/dashboard/settings/APISettings";
import { IntegrationsSettings } from "@/components/dashboard/settings/IntegrationsSettings";
import { ReportsSettings } from "@/components/dashboard/settings/ReportsSettings";
import { ImportSettings } from "@/components/dashboard/settings/ImportSettings";
import { WidgetsSettings } from "@/components/dashboard/settings/WidgetsSettings";

const SETTINGS_TABS = [
  { id: "general", label: "General" },
  { id: "revenue", label: "Revenue" },
  { id: "team", label: "Team" },
  { id: "import", label: "Import" },
  { id: "reports", label: "Reports" },
  { id: "widgets", label: "Widgets" },
  { id: "integrations", label: "Integrations" },
  { id: "api", label: "API" },
  { id: "exclusions", label: "Exclusions" },
  { id: "security", label: "Security" },
] as const;

const TAB_IDS = new Set(SETTINGS_TABS.map((t) => t.id));

export default function SettingsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const dispatch = useAppDispatch();
  const website = useAppSelector((state) => state.websites.currentWebsite) as {
    _id: string;
    domain: string;
    name: string;
    userId: string;
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
      attackMode?: {
        enabled: boolean;
        autoActivate: boolean;
        threshold?: number;
        activatedAt?: Date;
      };
      excludeIps?: string[];
      excludePaths?: string[];
      excludeHostnames?: string[];
      excludeCountries?: string[];
    };
    integrations?: {
      googleSearchConsole?: {
        enabled: boolean;
        propertyUrl?: string;
      };
      github?: {
        enabled: boolean;
        repositories?: Array<{ owner: string; name: string }>;
      };
      twitter?: {
        enabled: boolean;
        username?: string;
      };
    };
  } | null;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabFromUrl = searchParams.get("tab");
  const activeTab = useMemo(() => {
    if (
      tabFromUrl &&
      TAB_IDS.has(tabFromUrl as (typeof SETTINGS_TABS)[number]["id"])
    ) {
      return tabFromUrl as (typeof SETTINGS_TABS)[number]["id"];
    }
    return "general";
  }, [tabFromUrl]);

  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "general") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  useEffect(() => {
    if (websiteId) {
      dispatch(fetchWebsiteDetailsById(websiteId));
    }
  }, [websiteId, dispatch]);

  const handleUpdate = () => {
    dispatch(fetchWebsiteDetailsById(websiteId));
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full min-w-0 overflow-x-hidden">
      <div className="flex flex-col gap-4 min-w-0">
        <p className="text-stone-800 font-semibold text-lg">
          Settings for {website?.domain || website?.name || "Loading..."}
        </p>
        <div className="mr-px px-0 flex min-w-0 overflow-x-hidden">
          <div className="flex items-center border-b border-stone-200 w-full bg-stone-50 min-w-0 overflow-x-hidden">
            <ul
              className="flex items-center text-sm gap-1 overflow-x-auto min-w-0 scrollbar-hide"
              style={{ zIndex: 5, WebkitOverflowScrolling: "touch" }}
            >
              {SETTINGS_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <li key={tab.id} className="flex items-center">
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex whitespace-nowrap text-center border-b-2 items-center justify-between text-sm transition-all ease-in duration-75 font-medium border-transparent ${
                        isActive
                          ? "text-indigo-600 dark:text-brand-600 border-indigo-400 font-semibold"
                          : "text-stone-950"
                      }`}
                    >
                      <div className="hover:bg-stone-200 rounded-[10px] px-3 py-1 mb-1">
                        {tab.label}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-x-hidden">
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

        {activeTab === "team" && (
          <TeamSettings
            website={website}
            websiteId={websiteId}
            onUpdate={handleUpdate}
          />
        )}

        {activeTab === "security" && (
          <SecuritySettings
            website={website}
            websiteId={websiteId}
            onUpdate={handleUpdate}
          />
        )}

        {activeTab === "exclusions" && (
          <ExclusionsSettings
            website={website}
            websiteId={websiteId}
            onUpdate={handleUpdate}
          />
        )}

        {activeTab === "api" && (
          <APISettings
            website={website}
            websiteId={websiteId}
            onUpdate={handleUpdate}
          />
        )}

        {activeTab === "integrations" && (
          <IntegrationsSettings
            website={website}
            websiteId={websiteId}
            onUpdate={handleUpdate}
          />
        )}

        {activeTab === "reports" && (
          <ReportsSettings
            website={website}
            websiteId={websiteId}
            onUpdate={handleUpdate}
          />
        )}

        {activeTab === "import" && (
          <ImportSettings
            website={website}
            websiteId={websiteId}
            onUpdate={handleUpdate}
          />
        )}

        {activeTab === "widgets" && (
          <WidgetsSettings
            website={website}
            websiteId={websiteId}
            onUpdate={handleUpdate}
          />
        )}

        {activeTab !== "general" &&
          activeTab !== "revenue" &&
          activeTab !== "team" &&
          activeTab !== "security" &&
          activeTab !== "exclusions" &&
          activeTab !== "api" &&
          activeTab !== "integrations" &&
          activeTab !== "reports" &&
          activeTab !== "import" &&
          activeTab !== "widgets" && (
            <div className="text-stone-500 text-center py-8">
              This section is coming soon. Check back later for more features.
            </div>
          )}
      </div>
    </div>
  );
}
