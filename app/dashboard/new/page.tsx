"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftIcon } from "@/components/icons";
import { useAppDispatch } from "@/store/hooks";
import { createNewWebsiteWithDomain } from "@/store/slices/websitesSlice";
import { DomainLogo } from "@/components/ui/domain-logo";
import { Loader2 } from "lucide-react";

export default function AddSitePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [currentTime, setCurrentTime] = useState("");
  const [domain, setDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Calcutta",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-32 md:px-8 bg-background">
      <div className="mx-auto max-w-2xl pt-8">
        <Link
          href="/dashboard"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "mb-4 text-textPrimary hover:bg-gray-100",
          })}
        >
          <ArrowLeftIcon className="size-4" />
          Dashboard
        </Link>

        <div className="mx-auto mb-4 mt-12 flex flex-col gap-6 max-md:gap-8">
          {/* Progress Steps */}
          <ul className="flex items-center gap-8 max-md:order-last max-md:flex-col max-md:items-start max-md:gap-4">
            <li className="group flex select-none items-center gap-1.5 text-sm font-medium duration-100 text-primary">
              <span className="relative flex size-4 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex size-2.5 rounded-full bg-primary"></span>
              </span>
              <span className="whitespace-nowrap duration-200 text-primary">
                Add site
              </span>
            </li>
            <li className="group flex select-none items-center gap-1.5 text-sm font-medium duration-100 cursor-not-allowed text-textSecondary">
              <span className="flex size-4 items-center justify-center">
                <span className="size-2.5 rounded-full bg-textSecondary/20 duration-200"></span>
              </span>
              <span className="whitespace-nowrap duration-200 text-textSecondary">
                Install script
              </span>
            </li>
            <li className="group flex select-none items-center gap-1.5 text-sm font-medium duration-100 cursor-not-allowed text-textSecondary">
              <span className="flex size-4 items-center justify-center">
                <span className="size-2.5 rounded-full bg-textSecondary/20 duration-200"></span>
              </span>
              <span className="whitespace-nowrap duration-200 text-textSecondary">
                Attribute revenue (optional)
              </span>
            </li>
          </ul>

          {/* Form Card */}
          <div className="w-full">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const domainValue =
                  domain || (formData.get("domain") as string);

                if (!domainValue || typeof domainValue !== "string") return;

                setIsSubmitting(true);
                try {
                  const website = await dispatch(
                    createNewWebsiteWithDomain({
                      domain: domainValue,
                      name: domainValue.replace(/^www\./, "").split(".")[0],
                    }),
                  ).unwrap();
                  toast.success("Website added", {
                    description: "Redirecting to analytics…",
                  });
                  router.push(`/dashboard/${website._id}`);
                } catch (error: unknown) {
                  const message =
                    error instanceof Error
                      ? error.message
                      : "Failed to create website";
                  toast.error("Couldn’t add website", { description: message });
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <Card className="overflow-visible bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-textPrimary">
                    Add a new website
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Domain Input */}
                  <div className="w-full space-y-2">
                    <Label
                      htmlFor="domain"
                      className="text-sm font-medium text-textPrimary"
                    >
                      Domain
                    </Label>
                    <div className="flex w-full items-center rounded-md border border-borderColor overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-colors">
                      <div className="inline-flex select-none items-center justify-center gap-2 border-r border-borderColor bg-gray-50 px-3 py-2.5 text-sm text-textSecondary">
                        {(domain ? (
                          <DomainLogo
                            domain={domain}
                            size={24}
                            className="h-6! w-6! max-w-none! shrink-0 animate-opacity rounded drop-shadow-sm"
                          />
                        ) : null) ?? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="text-textSecondary size-4 shrink-0 opacity-40"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                            />
                          </svg>
                        )}
                        <span className="opacity-90">https://</span>
                      </div>
                      <Input
                        id="domain"
                        type="text"
                        placeholder="example.com"
                        required
                        autoComplete="off"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="flex-1 border-0 rounded-none focus-visible:ring-0 placeholder:opacity-50 h-10 text-sm bg-white text-textPrimary"
                      />
                    </div>
                  </div>

                  {/* Timezone Selector */}
                  <div className="w-full space-y-2">
                    <Label
                      htmlFor="timezone"
                      className="text-sm font-medium text-textPrimary"
                    >
                      Timezone
                    </Label>
                    <div className="relative w-full">
                      <div className="flex h-10 w-full items-center justify-between rounded-md border border-borderColor bg-gray-50 px-3 py-2 text-sm">
                        <div className="flex flex-1 select-none items-center justify-between truncate text-textPrimary">
                          <span className="font-medium">Asia - Calcutta</span>
                          <span className="ml-2 text-textSecondary text-xs">
                            <span className="opacity-70">Current time:</span>{" "}
                            <span className="font-mono">{currentTime}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-textSecondary opacity-70">
                      This defines what "today" means in your reports
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={buttonVariants({
                      size: "default",
                      className:
                        "w-full mt-6 bg-primary hover:bg-primary/90 text-white font-medium shadow-sm disabled:opacity-70 disabled:pointer-events-none",
                    })}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Adding…
                      </>
                    ) : (
                      "Add website"
                    )}
                  </button>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-textSecondary max-md:hidden">
          <span className="opacity-70">Need help? Email</span>{" "}
          <a
            href="mailto:support@postmetric.com?subject=Need help with PostMetric installation"
            target="_blank"
            className="text-primary opacity-70 duration-100 hover:opacity-100 hover:underline"
            rel="noopener noreferrer"
          >
            support@postmetric.com
          </a>
        </div>
      </div>
    </main>
  );
}
