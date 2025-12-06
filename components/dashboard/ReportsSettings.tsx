"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/firebase/auth-context";

interface ReportsSettingsProps {
  website: {
    _id: string;
    domain: string;
    name: string;
  } | null;
  websiteId: string;
  onUpdate: () => void;
}

export function ReportsSettings({
  website,
  websiteId,
  onUpdate,
}: ReportsSettingsProps) {
  const { user: firebaseUser } = useAuth();
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [trafficSpike, setTrafficSpike] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/websites/${websiteId}/notifications`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.notification) {
            setWeeklySummary(data.notification.weeklySummary || false);
            setTrafficSpike(data.notification.trafficSpike || false);
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    if (websiteId) {
      fetchNotifications();
    }
  }, [websiteId]);

  const handleToggle = async (
    type: "weeklySummary" | "trafficSpike",
    value: boolean
  ) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/websites/${websiteId}/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeklySummary: type === "weeklySummary" ? value : weeklySummary,
          trafficSpike: type === "trafficSpike" ? value : trafficSpike,
        }),
      });

      if (response.ok) {
        if (type === "weeklySummary") {
          setWeeklySummary(value);
        } else {
          setTrafficSpike(value);
        }
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update notification settings");
      }
    } catch (error) {
      console.error("Error updating notifications:", error);
      alert("Failed to update notification settings");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-textSecondary">
        Loading notification settings...
      </div>
    );
  }

  return (
    <div>
      <p className="text-base-secondary mb-2 text-sm">
        We'll email you at{" "}
        <span className="font-medium text-base-content">
          {firebaseUser?.email || "your email"}
        </span>{" "}
        for the following events:
      </p>
      <Card className="custom-card">
        <div className="flex items-center justify-between gap-2 p-4">
          <h2 className="font-medium">Weekly summary</h2>
          <Switch
            checked={weeklySummary}
            onCheckedChange={(checked) =>
              handleToggle("weeklySummary", checked)
            }
            disabled={updating}
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-base-content/5 p-4">
          <h2 className="font-medium">Traffic spike</h2>
          <Switch
            checked={trafficSpike}
            onCheckedChange={(checked) => handleToggle("trafficSpike", checked)}
            disabled={updating}
          />
        </div>
      </Card>
    </div>
  );
}
