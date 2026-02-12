"use client";

import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  useWebsiteAnalytics,
  type WebsiteSettings,
} from "@/hooks/use-website-analytics";
import { useConversionMetrics } from "@/hooks/use-conversion-metrics";
import { InsightsFullView } from "@/components/dashboard/analytics/InsightsFullView";

interface InsightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: string;
}

function InsightsDialogContent({ websiteId }: { websiteId: string }) {
  const { website } = useWebsiteAnalytics({ websiteId });
  const { conversionMetrics } = useConversionMetrics(websiteId);
  const currency = (website?.settings as WebsiteSettings)?.currency || "USD";

  return (
    <InsightsFullView
      websiteDomain={website?.domain}
      websiteIconUrl={website?.iconUrl}
      currency={currency}
      conversionMetrics={conversionMetrics}
    />
  );
}

export function InsightsDialog({
  open,
  onOpenChange,
  websiteId,
}: InsightsDialogProps) {
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-content-fullscreen fixed inset-0 max-w-none max-h-none w-screen h-screen p-0 m-0 rounded-none! border-0 bg-background overflow-auto [&>button]:hidden">
        <DialogTitle className="sr-only">
          Analytics Insights - full view
        </DialogTitle>
        <DialogDescription className="sr-only">
          Full-screen view of insights: device and system revenue, visits to
          purchase, location and referrer breakdowns, goals, and conversion
          heatmap.
        </DialogDescription>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 overflow-auto bg-background transition-all">
              <div className="fixed right-2 top-2 z-50 bg-transparent!">
                <Button
                  variant="ghost"
                  size="icon"
                  className="btn btn-circle btn-ghost"
                  onClick={handleClose}
                  aria-label="Close insights"
                >
                  <X className="size-6 drop-shadow-sm" strokeWidth={2} />
                </Button>
              </div>
              {open && <InsightsDialogContent websiteId={websiteId} />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
