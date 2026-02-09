"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAllTeamMembersForWebsite,
  inviteTeamMemberToWebsite,
  updateTeamMemberRoleForWebsite,
  removeTeamMemberFromWebsite,
} from "@/store/slices/websitesSlice";
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
  const dispatch = useAppDispatch();
  const { teamMembers, teamOwner, teamLoading, teamError } = useAppSelector(
    (state) => state.websites,
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor" | "admin">(
    "viewer",
  );
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
    if (websiteId) {
      dispatch(fetchAllTeamMembersForWebsite(websiteId));
    }
  }, [websiteId, dispatch]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setError("Email is required");
      return;
    }

    setInviting(true);
    setError(null);
    try {
      await dispatch(
        inviteTeamMemberToWebsite({
          websiteId,
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      ).unwrap();
      setInviteEmail("");
      setInviteRole("viewer");
      // Refresh team members
      await dispatch(fetchAllTeamMembersForWebsite(websiteId));
      onUpdate();
    } catch (error: any) {
      setError(error || "Failed to invite team member");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) {
      return;
    }

    try {
      await dispatch(
        removeTeamMemberFromWebsite({
          websiteId,
          memberId,
        }),
      ).unwrap();
      // Refresh team members
      await dispatch(fetchAllTeamMembersForWebsite(websiteId));
      onUpdate();
    } catch (error) {
      // Error removing team member
    }
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: "viewer" | "editor" | "admin",
  ) => {
    try {
      await dispatch(
        updateTeamMemberRoleForWebsite({
          websiteId,
          memberId,
          role: newRole,
        }),
      ).unwrap();
      // Refresh team members
      await dispatch(fetchAllTeamMembersForWebsite(websiteId));
      onUpdate();
    } catch (error) {
      // Error updating role
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
          {teamLoading ? (
            <div className="text-center py-8 text-textSecondary">
              Loading team members...
            </div>
          ) : !teamOwner && teamMembers.length === 0 ? (
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
                {teamOwner && (
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={teamOwner.avatarUrl}
                            alt={teamOwner.name || teamOwner.email}
                          />
                          <AvatarFallback
                            email={teamOwner.email}
                            name={teamOwner.name}
                          >
                            {teamOwner.name?.charAt(0).toUpperCase() ||
                              teamOwner.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium capitalize">
                            {teamOwner.name || teamOwner.email.split("@")[0]}
                          </span>
                          <span className="text-xs text-textSecondary">
                            {teamOwner.email}
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
                    teamOwner &&
                    String(member.userId._id) === String(teamOwner._id);
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
                            <AvatarFallback
                              email={member.userId.email}
                              name={member.userId.name}
                            >
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
