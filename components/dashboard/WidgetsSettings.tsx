"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CodeBlock } from "@/components/ui/code-block";

interface WidgetsSettingsProps {
  website: {
    _id: string;
    domain: string;
    name: string;
  } | null;
  websiteId: string;
  onUpdate: () => void;
}

export function WidgetsSettings({
  website,
  websiteId,
  onUpdate,
}: WidgetsSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<"realtime" | "preview" | "chart">(
    "preview"
  );
  const [revenueColor, setRevenueColor] = useState("#e78468");
  const [visitorsColor, setVisitorsColor] = useState("#8dcdff");
  const [theme, setTheme] = useState("system");
  const [codeFormat, setCodeFormat] = useState<"html" | "jsx">("html");

  const widgetUrl = `/widgets/${websiteId}/analytics?mainTextSize=16&primaryColor=${encodeURIComponent(
    revenueColor
  )}&secondaryColor=${encodeURIComponent(visitorsColor)}`;

  const generateEmbedCode = () => {
    const iframeCode = `<iframe
  src="${
    typeof window !== "undefined" ? window.location.origin : "https://datafa.st"
  }${widgetUrl}"
  style="background: transparent !important; border: none; width: 100%; height: 180px;"
  frameborder="0"
  allowtransparency="true"
  title="DataFast Widget"
  loading="lazy"
></iframe>`;

    if (codeFormat === "jsx") {
      return iframeCode
        .replace(/frameborder/g, "frameBorder")
        .replace(/allowtransparency/g, "allowTransparency");
    }

    return iframeCode;
  };

  return (
    <section className="space-y-4">
      <div className="custom-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-1.5">
            <h2 className="font-medium">Widgets</h2>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        {!enabled && (
          <p className="text-base-secondary px-4 pb-4 text-sm">
            Enable this to display public widgets showing aggregated metrics
            like total visitor count and page views. No sensitive or personal
            data will be shared.
          </p>
        )}
      </div>

      {enabled && (
        <>
          <div className="custom-card relative overflow-hidden bg-base-200">
            <div
              className="absolute inset-0 text-base-content opacity-[0.08]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='currentColor' fill-opacity='1' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative">
              <div className="tabs tabs-md w-full border-b border-base-content/10 bg-transparent">
                <button
                  onClick={() => setActiveTab("realtime")}
                  className={`tab tabs-lg flex-1 font-medium transition-all ${
                    activeTab === "realtime"
                      ? "rounded-none! border-b-2 border-b-base-content text-base-content"
                      : "text-base-secondary opacity-60 hover:opacity-100"
                  }`}
                >
                  Realtime
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`tab tabs-lg flex-1 font-medium transition-all ${
                    activeTab === "preview"
                      ? "rounded-none! border-b-2 border-b-base-content text-base-content"
                      : "text-base-secondary opacity-60 hover:opacity-100"
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab("chart")}
                  className={`tab tabs-lg flex-1 font-medium transition-all ${
                    activeTab === "chart"
                      ? "rounded-none! border-b-2 border-b-base-content text-base-content"
                      : "text-base-secondary opacity-60 hover:opacity-100"
                  }`}
                >
                  Chart
                </button>
              </div>
              <div className="flex items-center justify-center p-6">
                <div data-theme={theme} className="w-full bg-transparent!">
                  <iframe
                    title="DataFast Widget"
                    className="h-[400px] w-full"
                    src={widgetUrl}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="custom-card">
            <div className="custom-card-head">
              <h3 className="custom-card-title">Embed code</h3>
            </div>
            <div className="custom-card-body space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-base-secondary text-xs font-medium">
                    Revenue color
                  </Label>
                  <Input
                    type="color"
                    value={revenueColor}
                    onChange={(e) => setRevenueColor(e.target.value)}
                    className="input input-sm h-8 w-full cursor-pointer rounded-md p-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base-secondary text-xs font-medium">
                    Visitors color
                  </Label>
                  <Input
                    type="color"
                    value={visitorsColor}
                    onChange={(e) => setVisitorsColor(e.target.value)}
                    className="input input-sm h-8 w-full cursor-pointer rounded-md p-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base-secondary text-xs font-medium">
                    Theme
                  </Label>
                  <select
                    className="select select-sm w-full border-base-content/10"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <option value="system">🤖 System</option>
                    <option value="light">🌞 Light</option>
                    <option value="dark">🌙 Dark</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-base-secondary text-sm">
                    Add this snippet to your website:
                  </p>
                  <select
                    className="select select-xs border-base-content/10"
                    value={codeFormat}
                    onChange={(e) =>
                      setCodeFormat(e.target.value as "html" | "jsx")
                    }
                  >
                    <option value="html">HTML</option>
                    <option value="jsx">JSX</option>
                  </select>
                </div>
                <CodeBlock
                  code={generateEmbedCode()}
                  language={codeFormat === "jsx" ? "jsx" : "markup"}
                  showCopyButton={true}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
