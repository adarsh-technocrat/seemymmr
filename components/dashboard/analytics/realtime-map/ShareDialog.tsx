"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  websiteId,
}: ShareDialogProps) {
  const [enabled, setEnabled] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch current sharing status
  useEffect(() => {
    if (open && websiteId) {
      fetchSharingStatus();
    }
  }, [open, websiteId]);

  const fetchSharingStatus = async () => {
    try {
      // Fetch website settings to check current sharing status
      const response = await fetch(`/api/websites/${websiteId}`);
      if (response.ok) {
        const data = await response.json();
        const isEnabled =
          data.website?.settings?.publicRealtimeGlobe?.enabled || false;
        setEnabled(isEnabled);
        if (isEnabled) {
          const shareId = data.website?.settings?.publicRealtimeGlobe?.shareId;
          if (shareId) {
            const baseUrl = window.location.origin;
            setShareUrl(`${baseUrl}/globe/${websiteId}?shareId=${shareId}`);
          }
        } else {
          setShareUrl("");
        }
      } else {
        setEnabled(false);
        setShareUrl("");
      }
    } catch (error) {
      setEnabled(false);
      setShareUrl("");
    }
  };

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/websites/${websiteId}/realtime/public`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ enabled: checked }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setEnabled(data.publicRealtimeGlobe.enabled);
        if (data.publicRealtimeGlobe.url) {
          setShareUrl(data.publicRealtimeGlobe.url);
        } else {
          setShareUrl("");
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to update sharing settings");
      }
    } catch (error) {
      alert("Failed to update sharing settings");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert("Failed to copy URL to clipboard");
    }
  }, [shareUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Realtime Globe</DialogTitle>
          <DialogDescription>
            Generate a public link to share your realtime visitor globe. Anyone
            with the link can view it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-toggle">Enable public sharing</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone with the link to view your realtime globe
              </p>
            </div>
            <Switch
              id="share-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
          </div>

          {enabled && shareUrl && (
            <div className="space-y-2">
              <Label htmlFor="share-url">Share URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="share-url"
                  readOnly
                  value={shareUrl}
                  className="font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy this link to share your realtime globe publicly
              </p>
            </div>
          )}

          {enabled && !shareUrl && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Generating share URL...
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
