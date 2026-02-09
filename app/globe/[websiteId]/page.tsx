"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PublicRealtimeGlobe } from "@/components/dashboard/analytics/PublicRealtimeGlobe";

export default function PublicGlobePage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const searchParams = useSearchParams();
  const shareId = searchParams.get("shareId");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [websiteName, setWebsiteName] = useState<string>("PostMetric");

  useEffect(() => {
    if (!shareId) {
      setIsValid(false);
      return;
    }

    // Validate shareId on client side
    const validateShareId = async () => {
      try {
        // Use unified endpoint to validate shareId and get website info
        const response = await fetch(
          `/api/websites/${websiteId}/realtime/visitors?shareId=${shareId}`,
        );
        if (response.ok) {
          // Fetch website name from unified endpoint
          const websiteResponse = await fetch(
            `/api/websites/${websiteId}/realtime?shareId=${shareId}`,
            {
              headers: {
                Accept: "application/json",
              },
            },
          );
          if (websiteResponse.ok) {
            const data = await websiteResponse.json();
            setWebsiteName(data.websiteName || "PostMetric");
          }
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (error) {
        setIsValid(false);
      }
    };

    validateShareId();
  }, [websiteId, shareId]);

  if (isValid === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isValid || !shareId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            This realtime globe is not publicly available or the share link is
            invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PublicRealtimeGlobe
      websiteId={websiteId}
      shareId={shareId}
      websiteName={websiteName}
    />
  );
}
