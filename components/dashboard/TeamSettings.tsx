"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  _id: string;
  userId: {
    _id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
  invitedBy: {
    email: string;
    name?: string;
  };
  role: "viewer" | "editor" | "admin";
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  acceptedAt?: string;
}

interface Owner {
  _id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface TeamSettingsProps {
  website: {
    _id: string;
    domain: string;
    userId: string;
  } | null;
  websiteId: string;
  onUpdate: () => void;
}

export function TeamSettings({
  website,
  websiteId,
  onUpdate,
}: TeamSettingsProps) {
  const { user: firebaseUser } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor" | "admin">(
    "viewer"
  );
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("firebaseUser");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUserId(parsed.id || parsed._id || null);
        } catch {
          setCurrentUserId(null);
        }
      }
    }
  }, [firebaseUser]);

  const isOwner =
    website?.userId &&
    currentUserId &&
    String(website.userId) === String(currentUserId);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/websites/${websiteId}/team`);
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.teamMembers || []);
          setOwner(data.owner || null);
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
      } finally {
        setLoading(false);
      }
    };

    if (websiteId) {
      fetchTeamMembers();
    }
  }, [websiteId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setError("Email is required");
      return;
    }

    setInviting(true);
    setError(null);
    try {
      const response = await fetch(`/api/websites/${websiteId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteEmail("");
        setInviteRole("viewer");
        // Refresh team members
        const refreshResponse = await fetch(`/api/websites/${websiteId}/team`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setTeamMembers(refreshData.teamMembers || []);
          setOwner(refreshData.owner || null);
        }
        onUpdate();
      } else {
        setError(data.error || "Failed to invite team member");
      }
    } catch (error: any) {
      setError(error.message || "Failed to invite team member");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/websites/${websiteId}/team/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Refresh team members
        const refreshResponse = await fetch(`/api/websites/${websiteId}/team`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setTeamMembers(refreshData.teamMembers || []);
          setOwner(refreshData.owner || null);
        }
        onUpdate();
      }
    } catch (error) {
      console.error("Error removing team member:", error);
    }
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: "viewer" | "editor" | "admin"
  ) => {
    try {
      const response = await fetch(
        `/api/websites/${websiteId}/team/${memberId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        // Refresh team members
        const refreshResponse = await fetch(`/api/websites/${websiteId}/team`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setTeamMembers(refreshData.teamMembers || []);
          setOwner(refreshData.owner || null);
        }
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  return (
    <section className="space-y-4">
      {/* Invite Team Members */}
      {isOwner && (
        <Card className="custom-card">
          <CardHeader>
            <CardTitle>Invite team members</CardTitle>
            <CardDescription>
              The invited team members will be able to view analytics for this
              website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Select
                value={inviteRole}
                onValueChange={(value) =>
                  setInviteRole(value as "viewer" | "editor" | "admin")
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={inviting} size="sm">
                {inviting ? "Inviting..." : "Invite"}
              </Button>
            </form>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card className="custom-card">
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>
            Manage who has access to this website
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-textSecondary">
              Loading team members...
            </div>
          ) : !owner && teamMembers.length === 0 ? (
            <div className="text-center py-8 text-textSecondary">
              No team members yet. Invite someone to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  {isOwner && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Owner row */}
                {owner && (
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={owner.avatarUrl}
                            alt={owner.name || owner.email}
                          />
                          <AvatarFallback>
                            {owner.name?.charAt(0).toUpperCase() ||
                              owner.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium capitalize">
                            {owner.name || owner.email.split("@")[0]}
                          </span>
                          <span className="text-xs text-textSecondary">
                            {owner.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Owner</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-textSecondary">—</span>
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-right">
                        <span className="text-xs text-textSecondary">
                          Owner
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                )}
                {/* Team members rows */}
                {teamMembers.map((member) => {
                  const isCurrentUser =
                    currentUserId &&
                    String(member.userId._id) === String(currentUserId);
                  const isMemberOwner =
                    owner && String(member.userId._id) === String(owner._id);
                  const canManage = isOwner && !isMemberOwner;

                  return (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={member.userId.avatarUrl}
                              alt={member.userId.name || member.userId.email}
                            />
                            <AvatarFallback>
                              {member.userId.name?.charAt(0).toUpperCase() ||
                                member.userId.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium capitalize">
                              {member.userId.name ||
                                member.userId.email.split("@")[0]}
                            </span>
                            <span className="text-xs text-textSecondary">
                              {member.userId.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isMemberOwner ? (
                          <Badge variant="secondary">Owner</Badge>
                        ) : (
                          <Badge
                            variant={
                              member.role === "admin"
                                ? "default"
                                : member.role === "editor"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {member.role.charAt(0).toUpperCase() +
                              member.role.slice(1)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.status === "accepted"
                              ? "default"
                              : member.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {member.status.charAt(0).toUpperCase() +
                            member.status.slice(1)}
                        </Badge>
                      </TableCell>
                      {isOwner && (
                        <TableCell className="text-right">
                          {canManage ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-4 w-4"
                                  >
                                    <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member._id, "viewer")
                                  }
                                  disabled={member.role === "viewer"}
                                >
                                  Set as Viewer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member._id, "editor")
                                  }
                                  disabled={member.role === "editor"}
                                >
                                  Set as Editor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member._id, "admin")
                                  }
                                  disabled={member.role === "admin"}
                                >
                                  Set as Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRemoveMember(member._id)}
                                  className="text-destructive"
                                >
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-textSecondary">
                              Owner
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
