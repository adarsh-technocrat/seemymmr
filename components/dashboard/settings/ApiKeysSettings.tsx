"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
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

export function ApiKeysSettings() {
  const dispatch = useAppDispatch();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keyName, setKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(
    null,
  );
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // TODO: Fetch API keys from global/user-level API
  useEffect(() => {
    // Fetch global API keys
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setApiKeys([]);
      setLoading(false);
    }, 500);
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // TODO: Implement global API key creation
      const mockKey = {
        key: `pm_${Math.random().toString(36).substring(2, 15)}`,
        name: keyName.trim() || "Unnamed Key",
      };
      setNewKey(mockKey);
      setShowKeyDialog(true);
      setKeyName("");
    } catch (error: any) {
      alert(error || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) {
      return;
    }
    // TODO: Implement delete
    setApiKeys(apiKeys.filter((key) => key._id !== keyId));
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  return (
    <section className="space-y-8">
      <Card className="border border-stone-200 rounded-2xl bg-stone-0">
        <CardHeader>
          <CardTitle>New API Key</CardTitle>
          <CardDescription>
            Generate a new API key to access the Postmetric API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateKey} className="space-y-4">
            <div className="space-y-2">
              <Label>Key name (optional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="e.g., Prod Key"
                  maxLength={100}
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  disabled={creating}
                />
                <Button type="submit" disabled={creating}>
                  Create Key
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-stone-500">
            Loading API keys...
          </div>
        ) : apiKeys.length === 0 ? (
          <p className="text-stone-500 py-4 text-center text-sm">
            No API keys created yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-stone-800">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-stone-800">
                    Token
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-stone-800">
                    Last used
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-stone-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((apiKey) => (
                  <tr
                    key={apiKey._id}
                    className="border-b border-stone-100 hover:bg-stone-50"
                  >
                    <td className="py-3 px-4 font-medium">{apiKey.name}</td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {apiKey.keyPrefix}...
                    </td>
                    <td className="py-3 px-4">
                      {apiKey.lastUsedAt
                        ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
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
          </div>
        )}
      </div>

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
            <div className="rounded-lg bg-stone-100 p-3">
              <p className="text-xs text-stone-600">
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
