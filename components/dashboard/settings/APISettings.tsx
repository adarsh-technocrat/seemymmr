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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApiKey {
  _id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  createdAt: string;
}

interface APISettingsProps {
  website: {
    _id: string;
    domain: string;
    name: string;
  } | null;
  websiteId: string;
  onUpdate: () => void;
}

export function APISettings({
  website,
  websiteId,
  onUpdate,
}: APISettingsProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keyName, setKeyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<{
    key: string;
    name: string;
  } | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  // Fetch API keys
  useEffect(() => {
    const fetchApiKeys = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/websites/${websiteId}/api-keys`);
        if (response.ok) {
          const data = await response.json();
          setApiKeys(data.apiKeys || []);
        }
      } catch (error) {
        console.error("Error fetching API keys:", error);
      } finally {
        setLoading(false);
      }
    };

    if (websiteId) {
      fetchApiKeys();
    }
  }, [websiteId]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await fetch(`/api/websites/${websiteId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName.trim() || "Unnamed Key",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewKey({
          key: data.apiKey.key,
          name: data.apiKey.name,
        });
        setShowKeyDialog(true);
        setKeyName("");
        // Refresh the list
        const listResponse = await fetch(`/api/websites/${websiteId}/api-keys`);
        if (listResponse.ok) {
          const listData = await listResponse.json();
          setApiKeys(listData.apiKeys || []);
        }
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      alert("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/websites/${websiteId}/api-keys/${keyId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setApiKeys(apiKeys.filter((key) => key._id !== keyId));
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete API key");
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      alert("Failed to delete API key");
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  const handleRollKey = async (keyId: string) => {
    // TODO: Implement roll/regenerate key functionality
    alert("Roll functionality not yet implemented");
  };

  return (
    <section className="space-y-8">
      {/* New API Key */}
      <Card className="custom-card bg-base-100">
        <CardHeader>
          <CardTitle>New API Key</CardTitle>
          <CardDescription>
            Generate a new API key to access the{" "}
            <Link
              href="/docs/api-introduction"
              target="_blank"
              className="link text-base-content"
            >
              DataFast API
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateKey} className="space-y-4">
            <div className="form-control">
              <Label className="label pt-0">
                <span className="label-text">Key name (optional)</span>
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="e.g., Prod Key"
                  className="input input-sm input-bordered w-full"
                  maxLength={100}
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  disabled={creating}
                />
                <Button type="submit" size="sm" disabled={creating}>
                  Create Key
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-textSecondary">
            Loading API keys...
          </div>
        ) : (
          <div className="overflow-x-auto">
            {apiKeys.length === 0 ? (
              <p className="text-base-secondary py-4 text-center text-sm opacity-80">
                No API keys created yet.
              </p>
            ) : (
              <table className="table table-sm w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Token</th>
                    <th>Last used</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((apiKey) => (
                    <tr key={apiKey._id} className="hover">
                      <td className="font-medium">{apiKey.name}</td>
                      <td className="font-mono text-xs">
                        {apiKey.keyPrefix}...
                      </td>
                      <td>
                        {apiKey.lastUsedAt
                          ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRollKey(apiKey._id)}
                          >
                            Roll
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteKey(apiKey._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* New Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Save this key now - it won't be shown again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Your API Key</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  readOnly
                  value={newKey?.key || ""}
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => newKey && handleCopyKey(newKey.key)}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-base-200 p-3">
              <p className="text-xs text-textSecondary">
                <strong>Important:</strong> Copy this key and store it securely.
                You won't be able to see it again after closing this dialog.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>
              I've saved it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
