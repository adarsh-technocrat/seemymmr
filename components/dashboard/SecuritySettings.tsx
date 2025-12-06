"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SecuritySettingsProps {
  website: {
    _id: string;
    domain: string;
    name: string;
    settings?: {
      attackMode?: {
        enabled: boolean;
        autoActivate: boolean;
        threshold?: number;
        activatedAt?: Date;
      };
    };
  } | null;
  websiteId: string;
  onUpdate: () => void;
}

export function SecuritySettings({
  website,
  websiteId,
  onUpdate,
}: SecuritySettingsProps) {
  const [attackModeEnabled, setAttackModeEnabled] = useState(false);
  const [autoActivate, setAutoActivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAutoActivate, setPendingAutoActivate] = useState(false);

  // Initialize from website data
  useEffect(() => {
    if (website) {
      setAttackModeEnabled(website.settings?.attackMode?.enabled || false);
      setAutoActivate(website.settings?.attackMode?.autoActivate || false);
    }
  }, [website]);

  const handleToggleAttackMode = async (checked: boolean) => {
    setAttackModeEnabled(checked);
    setLoading(true);
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...website?.settings,
            attackMode: {
              enabled: checked,
              autoActivate:
                website?.settings?.attackMode?.autoActivate || false,
              threshold: website?.settings?.attackMode?.threshold || 1000,
            },
          },
        }),
      });
      if (response.ok) {
        onUpdate();
      } else {
        // Revert on error
        setAttackModeEnabled(!checked);
      }
    } catch (error) {
      console.error("Error updating attack mode:", error);
      setAttackModeEnabled(!checked);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoActivate = (checked: boolean) => {
    if (checked) {
      // Show confirmation dialog when enabling
      setPendingAutoActivate(true);
      setShowConfirmDialog(true);
    } else {
      // Disable immediately without confirmation
      updateAutoActivate(false);
    }
  };

  const updateAutoActivate = async (checked: boolean) => {
    setAutoActivate(checked);
    setLoading(true);
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...website?.settings,
            attackMode: {
              enabled: website?.settings?.attackMode?.enabled || false,
              autoActivate: checked,
              threshold: website?.settings?.attackMode?.threshold || 1000,
            },
          },
        }),
      });
      if (response.ok) {
        onUpdate();
      } else {
        // Revert on error
        setAutoActivate(!checked);
      }
    } catch (error) {
      console.error("Error updating auto-activate:", error);
      setAutoActivate(!checked);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAutoActivate = () => {
    setShowConfirmDialog(false);
    updateAutoActivate(true);
    setPendingAutoActivate(false);
  };

  const handleCancelAutoActivate = () => {
    setShowConfirmDialog(false);
    setPendingAutoActivate(false);
  };

  return (
    <section className="space-y-4">
      {/* Attack Mode */}
      <Card className="custom-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attack mode</CardTitle>
              <CardDescription className="mt-1">
                Enable enhanced protection against traffic spikes and potential
                attacks
              </CardDescription>
            </div>
            <div className="[&>button]:h-4 [&>button]:w-7 [&>button>span]:h-3 [&>button>span]:w-3 [&>button[data-state=checked]>span]:translate-x-3">
              <Switch
                checked={attackModeEnabled}
                onCheckedChange={handleToggleAttackMode}
                disabled={loading}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-1 md:items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-corner-down-right text-textSecondary size-3.5 shrink-0 max-md:mt-0.5"
              >
                <polyline points="15 10 20 15 15 20"></polyline>
                <path d="M4 4v7a4 4 0 0 0 4 4h12"></path>
              </svg>
              <p className="text-textSecondary text-sm">
                Activate automatically when traffic spike is detected
              </p>
            </div>
            <div className="[&>button]:h-4 [&>button]:w-7 [&>button>span]:h-3 [&>button>span]:w-3 [&>button[data-state=checked]>span]:translate-x-3">
              <Switch
                checked={autoActivate}
                onCheckedChange={handleToggleAutoActivate}
                disabled={loading}
              />
            </div>
          </div>

          {website?.settings?.attackMode?.activatedAt && (
            <div className="rounded-lg bg-base-200 p-3">
              <p className="text-xs text-textSecondary">
                Last activated:{" "}
                {new Date(
                  website.settings.attackMode.activatedAt
                ).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle className="font-bold">
              Auto-enable attack mode on viral traffic?
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="btn btn-square btn-ghost btn-sm h-8 w-8 p-0"
              onClick={handleCancelAutoActivate}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"></path>
              </svg>
            </Button>
          </div>
          <section className="mb-6">
            <div className="space-y-2 text-sm">
              <p>
                When a viral traffic spike is detected, attack mode will
                automatically activate.
              </p>
              <p>
                This helps prevent spam if the spike is from an attacker or fake
                traffic, protecting your analytics data in real-time.
              </p>
            </div>
          </section>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelAutoActivate}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmAutoActivate}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
