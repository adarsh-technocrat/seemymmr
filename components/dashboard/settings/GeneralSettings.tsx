"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store/hooks";
import {
  updateWebsiteSettingsAndConfiguration,
  deleteWebsiteById,
} from "@/store/slices/websitesSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CodeBlock } from "@/components/ui/code-block";

const COLOR_OPTIONS = [
  "#EF4444", // red
  "#E78468", // orange (primary)
  "#EC4899", // pink
  "#F59E0B", // amber
  "#10B981", // green
  "#14B8A6", // teal
  "#3B82F6", // blue
  "#6366F1", // indigo
  "#8B5CF6", // purple
  "#64748B", // slate
];

interface GeneralSettingsProps {
  website: {
    _id: string;
    domain: string;
    name: string;
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
  websiteId: string;
  onUpdate: () => void;
}

export function GeneralSettings({
  website,
  websiteId,
  onUpdate,
}: GeneralSettingsProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [domain, setDomain] = useState("");
  const [nickname, setNickname] = useState("");
  const [timezone, setTimezone] = useState("Asia/Calcutta");
  const [colorScheme, setColorScheme] = useState("#E78468");
  const [publicDashboard, setPublicDashboard] = useState(false);
  const [allowLocalhost, setAllowLocalhost] = useState(false);
  const [additionalDomain, setAdditionalDomain] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize from website data
  useEffect(() => {
    if (website) {
      setDomain(website.domain || "");
      setNickname(website.settings?.nickname || "");
      setTimezone(website.settings?.timezone || "Asia/Calcutta");
      setColorScheme(website.settings?.colorScheme || "#E78468");
      setPublicDashboard(website.settings?.publicDashboard?.enabled || false);
    }
  }, [website]);

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(
        updateWebsiteSettingsAndConfiguration({
          websiteId,
          updates: { domain },
        })
      ).unwrap();
      onUpdate();
    } catch (error) {
      console.error("Error updating domain:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(
        updateWebsiteSettingsAndConfiguration({
          websiteId,
          updates: {
            settings: {
              ...website?.settings,
              nickname,
            },
          },
        })
      ).unwrap();
      onUpdate();
    } catch (error) {
      console.error("Error updating nickname:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTimezone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(
        updateWebsiteSettingsAndConfiguration({
          websiteId,
          updates: {
            settings: {
              ...website?.settings,
              timezone,
            },
          },
        })
      ).unwrap();
      onUpdate();
    } catch (error) {
      console.error("Error updating timezone:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveColorScheme = async (color: string) => {
    setColorScheme(color);
    setLoading(true);
    try {
      await dispatch(
        updateWebsiteSettingsAndConfiguration({
          websiteId,
          updates: {
            settings: {
              ...website?.settings,
              colorScheme: color,
            },
          },
        })
      ).unwrap();
      onUpdate();
    } catch (error) {
      console.error("Error updating color scheme:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublicDashboard = async (checked: boolean) => {
    setPublicDashboard(checked);
    try {
      await dispatch(
        updateWebsiteSettingsAndConfiguration({
          websiteId,
          updates: {
            settings: {
              ...website?.settings,
              publicDashboard: {
                enabled: checked,
                shareId:
                  checked && !website?.settings?.publicDashboard?.shareId
                    ? `share_${websiteId}_${Date.now()}`
                    : website?.settings?.publicDashboard?.shareId,
              },
            },
          },
        })
      ).unwrap();
      onUpdate();
    } catch (error) {
      console.error("Error updating public dashboard:", error);
    }
  };

  // Ensure tracking code always has pmid_ prefix when displaying
  const getTrackingCodeForDisplay = () => {
    const code =
      website?.trackingCode || websiteId || "pmid_" + websiteId?.slice(0, 20);
    // Add prefix if it doesn't already have it
    if (code && !code.startsWith("pmid_")) {
      return "pmid_" + code;
    }
    return code;
  };

  const trackingCode = getTrackingCodeForDisplay();

  return (
    <section className="space-y-4">
      {/* Analytics Script */}
      <Card className="custom-card">
        <CardHeader>
          <CardTitle>Analytics script</CardTitle>
          <CardDescription>
            Paste this snippet in the &lt;head&gt; of your website. If you need
            more help, see our{" "}
            <Link
              href="/docs/installation-tutorials"
              className="link hover:text-base-content"
              target="_blank"
            >
              installation guides
            </Link>
            . If you need to customize the script, see the{" "}
            <Link
              href="/docs/script-configuration"
              className="link hover:text-base-content"
              target="_blank"
            >
              script configuration reference
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-xs rounded"
              checked={allowLocalhost}
              onChange={(e) => setAllowLocalhost(e.target.checked)}
            />
            <label className="text-sm text-textSecondary cursor-pointer">
              Allow localhost debugging{" "}
              <span
                className="group -m-1 cursor-pointer p-1 inline-flex items-center"
                title="DataFast does not set the cookie on localhost to avoid polluting your own data. To override this for debugging, check this box."
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-3 opacity-60 duration-100 group-hover:opacity-100"
                >
                  <path
                    fillRule="evenodd"
                    d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </label>
          </div>
          <CodeBlock
            code={`<script
  defer
  data-website-id="${trackingCode}"
  data-domain="${domain}"${
              allowLocalhost ? '\n  data-allow-localhost="true"' : ""
            }
  src="${
    typeof window !== "undefined" ? window.location.origin : ""
  }/js/script.js"
></script>`}
            language="markup"
          />
          <p className="text-xs text-textSecondary">
            Tip:{" "}
            <Link
              href="/docs/proxy-guide"
              target="_blank"
              className="link hover:text-base-content"
            >
              proxy the script through your own domain
            </Link>{" "}
            to avoid ad blockers.
          </p>
        </CardContent>
      </Card>

      {/* Domain */}
      <Card className="custom-card">
        <form onSubmit={handleSaveDomain}>
          <CardHeader>
            <CardTitle>Domain</CardTitle>
            <CardDescription>
              Your main website domain for analytics tracking. All subdomains
              will be tracked automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              required
              className="input-sm w-full border-base-content/10 placeholder:opacity-60"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <div className="flex justify-between items-top">
              <p className="text-xs text-textSecondary">
                Your public DataFast ID is{" "}
                <span className="link-hover link font-medium text-base-content">
                  {trackingCode}
                </span>
                .
              </p>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Additional Domains */}
      <Card className="custom-card">
        <CardHeader>
          <CardTitle>Additional domains</CardTitle>
          <CardDescription>
            Other domains than{" "}
            <span className="font-medium text-base-content">{domain}</span> that
            can send data to this website.{" "}
            <Link
              href="/docs/cross-domain-tracking"
              target="_blank"
              className="link"
            >
              Learn more.
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex gap-2">
            <Input
              placeholder="e.g., anotherdomain.com"
              className="input-sm flex-1 border-base-content/10 placeholder:opacity-60"
              value={additionalDomain}
              onChange={(e) => setAdditionalDomain(e.target.value)}
            />
            <Button type="submit" variant="ghost" size="sm">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card className="custom-card overflow-visible">
        <form onSubmit={handleSaveTimezone}>
          <CardHeader>
            <CardTitle>Timezone</CardTitle>
            <CardDescription>
              This defines what "today" means in your reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="input-sm w-full border-base-content/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Calcutta">Asia - Calcutta</SelectItem>
                <SelectItem value="America/New_York">
                  America - New York
                </SelectItem>
                <SelectItem value="America/Los_Angeles">
                  America - Los Angeles
                </SelectItem>
                <SelectItem value="Europe/London">Europe - London</SelectItem>
                <SelectItem value="Europe/Paris">Europe - Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia - Tokyo</SelectItem>
                <SelectItem value="Australia/Sydney">
                  Australia - Sydney
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Color Scheme */}
      <Card className="custom-card">
        <CardHeader>
          <CardTitle>Color scheme</CardTitle>
          <CardDescription>
            Choose the main color for revenue/goal bars in your analytics charts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2.5 p-4 md:grid-cols-6">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleSaveColorScheme(color)}
                className="group relative flex h-8 w-full duration-150 ease-in-out"
              >
                <div
                  className={`flex h-8 w-full items-center justify-center rounded-lg duration-150 ${
                    colorScheme === color
                      ? "ring-2 ring-neutral ring-offset-2 ring-offset-base-100"
                      : "group-hover:ring-2 group-hover:ring-neutral/50 group-hover:ring-offset-2 group-hover:ring-offset-base-100"
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {colorScheme === color && (
                    <div className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-neutral text-neutral-content shadow-md">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="size-3"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* #1 KPI */}
      <Card className="custom-card overflow-visible">
        <form>
          <CardHeader>
            <CardTitle>#1 KPI</CardTitle>
            <CardDescription>
              What's your most important goal for {domain}?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select defaultValue="revenue">
              <SelectTrigger className="input-sm w-full border-base-content/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="visitors">Visitors</SelectItem>
                <SelectItem value="conversions">Conversions</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-between">
              <Link
                href="/docs/custom-goals"
                target="_blank"
                className="text-xs text-textSecondary opacity-80 duration-100 hover:link hover:text-base-content hover:opacity-100 inline-flex items-center gap-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-3"
                >
                  <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                </svg>
                <span>Add goals</span>
              </Link>
              <Button type="submit" variant="ghost" size="sm">
                Save
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Website Nickname */}
      <Card className="custom-card">
        <form onSubmit={handleSaveNickname}>
          <CardHeader>
            <CardTitle>Website nickname</CardTitle>
            <CardDescription>
              Give your website a friendly nickname to easily identify it!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              className="input-sm w-full border-base-content/10 placeholder:opacity-60"
              placeholder="e.g., Unicorn"
              maxLength={32}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Public Dashboard */}
      <Card className="custom-card">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-textPrimary">
                Public dashboard
              </h3>
              <p className="text-sm text-textSecondary mt-1">
                Share your analytics with a public link
              </p>
            </div>
            <Switch
              checked={publicDashboard}
              onCheckedChange={handleTogglePublicDashboard}
            />
          </div>
        </div>
      </Card>

      {/* Delete Button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-error/20 hover:text-error"
          onClick={async () => {
            if (
              confirm(
                "Are you sure you want to delete this website? This action cannot be undone."
              )
            ) {
              try {
                await dispatch(deleteWebsiteById(websiteId)).unwrap();
                router.push("/dashboard");
              } catch (error) {
                console.error("Error deleting website:", error);
              }
            }
          }}
        >
          Delete
        </Button>
      </div>
    </section>
  );
}
