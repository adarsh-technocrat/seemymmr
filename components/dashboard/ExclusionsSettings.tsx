"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ExclusionsSettingsProps {
  website: {
    _id: string;
    domain: string;
    name: string;
    settings?: {
      excludeIps?: string[];
      excludePaths?: string[];
      excludeHostnames?: string[];
      excludeCountries?: string[];
    };
  } | null;
  websiteId: string;
  onUpdate: () => void;
}

// List of countries for the dropdown
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "GR", name: "Greece" },
  { code: "RU", name: "Russia" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "TR", name: "Turkey" },
  { code: "ID", name: "Indonesia" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "PH", name: "Philippines" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "NZ", name: "New Zealand" },
];

export function ExclusionsSettings({
  website,
  websiteId,
  onUpdate,
}: ExclusionsSettingsProps) {
  const [excludeIps, setExcludeIps] = useState<string[]>([]);
  const [excludePaths, setExcludePaths] = useState<string[]>([]);
  const [excludeHostnames, setExcludeHostnames] = useState<string[]>([]);
  const [excludeCountries, setExcludeCountries] = useState<string[]>([]);
  const [currentIp, setCurrentIp] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Form inputs
  const [ipInput, setIpInput] = useState("");
  const [pathInput, setPathInput] = useState("");
  const [hostnameInput, setHostnameInput] = useState("");
  const [countryInput, setCountryInput] = useState("");

  // Initialize from website data
  useEffect(() => {
    if (website) {
      setExcludeIps(website.settings?.excludeIps || []);
      setExcludePaths(website.settings?.excludePaths || []);
      setExcludeHostnames(website.settings?.excludeHostnames || []);
      setExcludeCountries(website.settings?.excludeCountries || []);
    }
  }, [website]);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => {
        if (data.ip) {
          setCurrentIp(data.ip);
        }
      })
      .catch(() => {
        // Silently fail if IP detection doesn't work
      });
  }, []);

  const updateSettings = async (updates: {
    excludeIps?: string[];
    excludePaths?: string[];
    excludeHostnames?: string[];
    excludeCountries?: string[];
  }) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...website?.settings,
            ...updates,
          },
        }),
      });
      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating exclusions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput.trim()) return;

    const newIps = [...excludeIps, ipInput.trim()];
    setExcludeIps(newIps);
    setIpInput("");
    await updateSettings({ excludeIps: newIps });
  };

  const handleRemoveIp = async (ip: string) => {
    const newIps = excludeIps.filter((i) => i !== ip);
    setExcludeIps(newIps);
    await updateSettings({ excludeIps: newIps });
  };

  const handleAddPath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pathInput.trim()) return;

    const newPaths = [...excludePaths, pathInput.trim()];
    setExcludePaths(newPaths);
    setPathInput("");
    await updateSettings({ excludePaths: newPaths });
  };

  const handleRemovePath = async (path: string) => {
    const newPaths = excludePaths.filter((p) => p !== path);
    setExcludePaths(newPaths);
    await updateSettings({ excludePaths: newPaths });
  };

  const handleAddHostname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostnameInput.trim()) return;

    const newHostnames = [...excludeHostnames, hostnameInput.trim()];
    setExcludeHostnames(newHostnames);
    setHostnameInput("");
    await updateSettings({ excludeHostnames: newHostnames });
  };

  const handleRemoveHostname = async (hostname: string) => {
    const newHostnames = excludeHostnames.filter((h) => h !== hostname);
    setExcludeHostnames(newHostnames);
    await updateSettings({ excludeHostnames: newHostnames });
  };

  const handleAddCountry = async () => {
    if (!countryInput) return;

    const newCountries = [...excludeCountries, countryInput];
    setExcludeCountries(newCountries);
    setCountryInput("");
    await updateSettings({ excludeCountries: newCountries });
  };

  const handleRemoveCountry = async (country: string) => {
    const newCountries = excludeCountries.filter((c) => c !== country);
    setExcludeCountries(newCountries);
    await updateSettings({ excludeCountries: newCountries });
  };

  return (
    <section className="space-y-4">
      {/* Exclude IP addresses */}
      <Card className="custom-card">
        <CardHeader>
          <CardTitle>Exclude IP addresses</CardTitle>
          <CardDescription>
            Add IP addresses to exclude from tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddIp} className="form-control w-full">
            <div className="label">
              <Label className="label-text text-xs">IP Address</Label>
            </div>
            <div className="flex gap-2">
              <Input
                className="input input-sm input-bordered flex-1 border-base-content/10 placeholder:opacity-60"
                placeholder="192.168.1.1"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={loading || !ipInput.trim()}
              >
                Add
              </Button>
            </div>
            {currentIp && (
              <div className="label">
                <span className="label-text-alt">
                  <span className="text-base-secondary text-xs">
                    Your current IP address:
                  </span>
                  <span
                    className="ml-1 cursor-pointer text-xs text-base-content underline"
                    onClick={() => setIpInput(currentIp)}
                  >
                    {currentIp}
                  </span>
                </span>
              </div>
            )}
          </form>

          {excludeIps.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {excludeIps.map((ip) => (
                <div
                  key={ip}
                  className="badge badge-outline flex items-center gap-1"
                >
                  {ip}
                  <button
                    type="button"
                    onClick={() => handleRemoveIp(ip)}
                    className="ml-1 hover:text-destructive"
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exclude paths */}
      <Card className="custom-card">
        <CardHeader>
          <CardTitle>Exclude paths</CardTitle>
          <CardDescription>
            Add URL paths to exclude from tracking. Use{" "}
            <span className="rounded border border-base-content/5 bg-base-300 px-1 font-mono">
              *
            </span>{" "}
            as a wildcard to match multiple paths (
            <Link
              href="/docs/excluding-analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="link hover:text-base-content"
            >
              more here
            </Link>
            ).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddPath} className="form-control w-full">
            <div className="label">
              <Label className="label-text text-xs">Path</Label>
            </div>
            <div className="flex gap-2">
              <Input
                className="input input-sm flex-1 border-base-content/10 placeholder:opacity-60"
                placeholder="/admin or /admin/*"
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={loading || !pathInput.trim()}
              >
                Add
              </Button>
            </div>
          </form>

          {excludePaths.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {excludePaths.map((path) => (
                <div
                  key={path}
                  className="badge badge-outline flex items-center gap-1"
                >
                  {path}
                  <button
                    type="button"
                    onClick={() => handleRemovePath(path)}
                    className="ml-1 hover:text-destructive"
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exclude hostnames */}
      <Card className="custom-card">
        <CardHeader>
          <CardTitle>Exclude hostnames</CardTitle>
          <CardDescription>
            Add hostnames to exclude from tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddHostname} className="form-control w-full">
            <div className="label">
              <Label className="label-text text-xs">Hostname</Label>
            </div>
            <div className="flex gap-2">
              <Input
                className="input input-sm flex-1 border-base-content/10 placeholder:opacity-60"
                placeholder="subdomain.example.com"
                value={hostnameInput}
                onChange={(e) => setHostnameInput(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={loading || !hostnameInput.trim()}
              >
                Add
              </Button>
            </div>
          </form>

          {excludeHostnames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {excludeHostnames.map((hostname) => (
                <div
                  key={hostname}
                  className="badge badge-outline flex items-center gap-1"
                >
                  {hostname}
                  <button
                    type="button"
                    onClick={() => handleRemoveHostname(hostname)}
                    className="ml-1 hover:text-destructive"
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exclude countries */}
      <Card className="custom-card overflow-visible">
        <CardHeader>
          <CardTitle>Exclude countries</CardTitle>
          <CardDescription>
            Add countries to exclude from tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="form-control w-full">
            <div className="label">
              <Label className="label-text text-xs">Country</Label>
            </div>
            <div className="relative w-full">
              <Select value={countryInput} onValueChange={setCountryInput}>
                <SelectTrigger className="input input-sm flex w-full cursor-pointer items-center justify-between border-base-content/10 duration-100">
                  <SelectValue placeholder="Select a country to exclude..." />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {countryInput && (
              <Button
                type="button"
                size="sm"
                className="mt-2"
                onClick={handleAddCountry}
                disabled={loading}
              >
                Add
              </Button>
            )}
          </div>

          {excludeCountries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {excludeCountries.map((countryCode) => {
                const country = COUNTRIES.find((c) => c.code === countryCode);
                return (
                  <div
                    key={countryCode}
                    className="badge badge-outline flex items-center gap-1"
                  >
                    {country?.name || countryCode}
                    <button
                      type="button"
                      onClick={() => handleRemoveCountry(countryCode)}
                      className="ml-1 hover:text-destructive"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
