"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWebsiteDetailsById } from "@/store/slices/websitesSlice";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Settings,
  DollarSign,
  Users,
  Download,
  BarChart,
  Smartphone,
  Link as LinkIcon,
  Plug,
  XCircle,
  Lock,
  ChevronLeft,
} from "lucide-react";
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
  { id: "general", label: "General", icon: Settings },
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "team", label: "Team", icon: Users },
  { id: "import", label: "Import", icon: Download },
  { id: "reports", label: "Reports", icon: BarChart },
  { id: "widgets", label: "Widgets", icon: Smartphone },
  { id: "integrations", label: "Integrations", icon: LinkIcon },
  { id: "api", label: "API", icon: Plug },
  { id: "exclusions", label: "Exclusions", icon: XCircle },
  { id: "security", label: "Security", icon: Lock },
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

  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (websiteId) {
      dispatch(fetchWebsiteDetailsById(websiteId));
    }
  }, [websiteId, dispatch]);

  const handleUpdate = () => {
    dispatch(fetchWebsiteDetailsById(websiteId));
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-32 md:px-8 bg-background">
      <section className="mb-8 space-y-2">
        <Link
          href={`/dashboard/${websiteId}`}
          className="btn btn-ghost btn-sm inline-flex items-center gap-2"
        >
          <ChevronLeft className="size-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-textPrimary">
          Settings for {website?.domain || website?.name || "Loading..."}
        </h1>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row">
        <nav className="overflow-x-auto lg:w-52 lg:overflow-x-visible">
          <ul className="flex gap-2 lg:flex-col">
            {SETTINGS_TABS.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full select-none items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 duration-200 ${
                      activeTab === tab.id
                        ? "bg-neutral text-neutral-content shadow"
                        : "bg-base-300 hover:bg-neutral hover:text-neutral-content"
                    }`}
                  >
                    <IconComponent className="size-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
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
