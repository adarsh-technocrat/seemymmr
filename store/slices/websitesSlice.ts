import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export const fetchAllUserWebsites = createAsyncThunk(
  "websites/fetchAllUserWebsites",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/websites");

      if (!response.ok) {
        throw new Error("Failed to fetch websites");
      }

      const data = await response.json();
      return data.websites || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchWebsiteDetailsById = createAsyncThunk(
  "websites/fetchWebsiteDetailsById",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/websites/${websiteId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch website");
      }

      const data = await response.json();
      return data.website;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateWebsiteSettingsAndConfiguration = createAsyncThunk(
  "websites/updateWebsiteSettingsAndConfiguration",
  async (
    {
      websiteId,
      updates,
    }: {
      websiteId: string;
      updates: any;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update website");
      }

      const data = await response.json();
      return data.website;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const connectStripeRevenue = createAsyncThunk(
  "websites/connectStripeRevenue",
  async (
    { websiteId, apiKey }: { websiteId: string; apiKey: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(
        `/api/websites/${websiteId}/revenue/stripe/connect`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to connect Stripe");
      }

      const data = await response.json();
      return data.website;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const disconnectStripeRevenue = createAsyncThunk(
  "websites/disconnectStripeRevenue",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/api/websites/${websiteId}/revenue/stripe/disconnect`,
        { method: "POST" },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to disconnect Stripe");
      }

      const data = await response.json();
      return data.website;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const createNewWebsiteWithDomain = createAsyncThunk(
  "websites/createNewWebsiteWithDomain",
  async (
    {
      domain,
      name,
      iconUrl,
    }: {
      domain: string;
      name: string;
      iconUrl?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          name,
          iconUrl: iconUrl || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create website");
      }

      const data = await response.json();
      return data.website;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteWebsiteById = createAsyncThunk(
  "websites/deleteWebsiteById",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete website");
      }

      return websiteId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// API Keys Thunks
export const fetchAllApiKeysForWebsite = createAsyncThunk(
  "websites/fetchAllApiKeysForWebsite",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/websites/${websiteId}/api-keys`);

      if (!response.ok) {
        throw new Error("Failed to fetch API keys");
      }

      const data = await response.json();
      return data.apiKeys || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const createNewApiKeyForWebsite = createAsyncThunk(
  "websites/createNewApiKeyForWebsite",
  async (
    {
      websiteId,
      name,
    }: {
      websiteId: string;
      name: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/websites/${websiteId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Unnamed Key",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create API key");
      }

      const data = await response.json();
      return data.apiKey;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteApiKeyByIdFromWebsite = createAsyncThunk(
  "websites/deleteApiKeyByIdFromWebsite",
  async (
    {
      websiteId,
      keyId,
    }: {
      websiteId: string;
      keyId: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(
        `/api/websites/${websiteId}/api-keys/${keyId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete API key");
      }

      return keyId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Team Management Thunks
export const fetchAllTeamMembersForWebsite = createAsyncThunk(
  "websites/fetchAllTeamMembersForWebsite",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/websites/${websiteId}/team`);

      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }

      const data = await response.json();
      return {
        teamMembers: data.teamMembers || [],
        owner: data.owner || null,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const inviteTeamMemberToWebsite = createAsyncThunk(
  "websites/inviteTeamMemberToWebsite",
  async (
    {
      websiteId,
      email,
      role,
    }: {
      websiteId: string;
      email: string;
      role: "viewer" | "editor" | "admin";
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/websites/${websiteId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to invite team member");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateTeamMemberRoleForWebsite = createAsyncThunk(
  "websites/updateTeamMemberRoleForWebsite",
  async (
    {
      websiteId,
      memberId,
      role,
    }: {
      websiteId: string;
      memberId: string;
      role: "viewer" | "editor" | "admin";
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(
        `/api/websites/${websiteId}/team/${memberId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update team member role");
      }

      return { memberId, role };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const removeTeamMemberFromWebsite = createAsyncThunk(
  "websites/removeTeamMemberFromWebsite",
  async (
    {
      websiteId,
      memberId,
    }: {
      websiteId: string;
      memberId: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(
        `/api/websites/${websiteId}/team/${memberId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove team member");
      }

      return memberId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Notifications Thunks
export const fetchNotificationSettingsForWebsite = createAsyncThunk(
  "websites/fetchNotificationSettingsForWebsite",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/websites/${websiteId}/notifications`);

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      return (
        data.notification || {
          weeklySummary: false,
          trafficSpike: false,
        }
      );
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateNotificationSettingsForWebsite = createAsyncThunk(
  "websites/updateNotificationSettingsForWebsite",
  async (
    {
      websiteId,
      weeklySummary,
      trafficSpike,
    }: {
      websiteId: string;
      weeklySummary: boolean;
      trafficSpike: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/websites/${websiteId}/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeklySummary,
          trafficSpike,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Failed to update notification settings",
        );
      }

      const data = await response.json();
      return (
        data.notification || {
          weeklySummary,
          trafficSpike,
        }
      );
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Import Thunk
export const importPlausibleDataForWebsite = createAsyncThunk(
  "websites/importPlausibleDataForWebsite",
  async (
    {
      websiteId,
      file,
    }: {
      websiteId: string;
      file: File;
    },
    { rejectWithValue },
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/websites/${websiteId}/plausible-import`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import data");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export interface Website {
  _id: string;
  domain: string;
  name: string;
  iconUrl?: string;
  userId: string;
  settings?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiKey {
  _id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface TeamMember {
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

interface WebsitesState {
  websites: Website[];
  currentWebsite: Website | null;
  loading: boolean;
  error: string | null;
  // API Keys state
  apiKeys: ApiKey[];
  apiKeysLoading: boolean;
  apiKeysError: string | null;
  // Team state
  teamMembers: TeamMember[];
  teamOwner: any | null;
  teamLoading: boolean;
  teamError: string | null;
  // Notifications state
  notifications: {
    weeklySummary: boolean;
    trafficSpike: boolean;
  } | null;
  notificationsLoading: boolean;
  notificationsError: string | null;
  // Update operation states
  updating: boolean;
  creating: boolean;
}

const initialState: WebsitesState = {
  websites: [],
  currentWebsite: null,
  loading: false,
  error: null,
  apiKeys: [],
  apiKeysLoading: false,
  apiKeysError: null,
  teamMembers: [],
  teamOwner: null,
  teamLoading: false,
  teamError: null,
  notifications: null,
  notificationsLoading: false,
  notificationsError: null,
  updating: false,
  creating: false,
};

const websitesSlice = createSlice({
  name: "websites",
  initialState,
  reducers: {
    setCurrentWebsite: (state, action) => {
      state.currentWebsite = action.payload;
    },
    clearWebsites: (state) => {
      state.websites = [];
      state.currentWebsite = null;
      state.error = null;
    },
    clearApiKeys: (state) => {
      state.apiKeys = [];
      state.apiKeysError = null;
    },
    clearTeam: (state) => {
      state.teamMembers = [];
      state.teamOwner = null;
      state.teamError = null;
    },
    clearNotifications: (state) => {
      state.notifications = null;
      state.notificationsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All User Websites
      .addCase(fetchAllUserWebsites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUserWebsites.fulfilled, (state, action) => {
        state.loading = false;
        state.websites = action.payload;
        state.error = null;
      })
      .addCase(fetchAllUserWebsites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Website Details By ID
      .addCase(fetchWebsiteDetailsById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWebsiteDetailsById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWebsite = action.payload;
        state.error = null;
      })
      .addCase(fetchWebsiteDetailsById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Website Settings And Configuration
      .addCase(updateWebsiteSettingsAndConfiguration.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(
        updateWebsiteSettingsAndConfiguration.fulfilled,
        (state, action) => {
          state.updating = false;
          state.currentWebsite = action.payload;
          // Update in websites array if it exists
          const index = state.websites.findIndex(
            (w) => w._id === action.payload._id,
          );
          if (index !== -1) {
            state.websites[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(
        updateWebsiteSettingsAndConfiguration.rejected,
        (state, action) => {
          state.updating = false;
          state.error = action.payload as string;
        },
      )
      // Connect Stripe Revenue
      .addCase(connectStripeRevenue.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(connectStripeRevenue.fulfilled, (state, action) => {
        state.updating = false;
        state.currentWebsite = action.payload;
        const index = state.websites.findIndex(
          (w) => w._id === action.payload._id,
        );
        if (index !== -1) {
          state.websites[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(connectStripeRevenue.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      // Disconnect Stripe Revenue
      .addCase(disconnectStripeRevenue.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(disconnectStripeRevenue.fulfilled, (state, action) => {
        state.updating = false;
        state.currentWebsite = action.payload;
        const index = state.websites.findIndex(
          (w) => w._id === action.payload._id,
        );
        if (index !== -1) {
          state.websites[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(disconnectStripeRevenue.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      // Create New Website With Domain
      .addCase(createNewWebsiteWithDomain.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createNewWebsiteWithDomain.fulfilled, (state, action) => {
        state.creating = false;
        state.websites.push(action.payload);
        state.currentWebsite = action.payload;
        state.error = null;
      })
      .addCase(createNewWebsiteWithDomain.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      })
      // Delete Website By ID
      .addCase(deleteWebsiteById.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(deleteWebsiteById.fulfilled, (state, action) => {
        state.updating = false;
        state.websites = state.websites.filter((w) => w._id !== action.payload);
        if (state.currentWebsite?._id === action.payload) {
          state.currentWebsite = null;
        }
        state.error = null;
      })
      .addCase(deleteWebsiteById.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      // Fetch All API Keys For Website
      .addCase(fetchAllApiKeysForWebsite.pending, (state) => {
        state.apiKeysLoading = true;
        state.apiKeysError = null;
      })
      .addCase(fetchAllApiKeysForWebsite.fulfilled, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeys = action.payload;
        state.apiKeysError = null;
      })
      .addCase(fetchAllApiKeysForWebsite.rejected, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeysError = action.payload as string;
      })
      // Create New API Key For Website
      .addCase(createNewApiKeyForWebsite.pending, (state) => {
        state.apiKeysLoading = true;
        state.apiKeysError = null;
      })
      .addCase(createNewApiKeyForWebsite.fulfilled, (state, action) => {
        state.apiKeysLoading = false;
        // Don't add to array since we need to fetch again to get the list
        state.apiKeysError = null;
      })
      .addCase(createNewApiKeyForWebsite.rejected, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeysError = action.payload as string;
      })
      // Delete API Key By ID From Website
      .addCase(deleteApiKeyByIdFromWebsite.pending, (state) => {
        state.apiKeysLoading = true;
        state.apiKeysError = null;
      })
      .addCase(deleteApiKeyByIdFromWebsite.fulfilled, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeys = state.apiKeys.filter(
          (key) => key._id !== action.payload,
        );
        state.apiKeysError = null;
      })
      .addCase(deleteApiKeyByIdFromWebsite.rejected, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeysError = action.payload as string;
      })
      // Fetch All Team Members For Website
      .addCase(fetchAllTeamMembersForWebsite.pending, (state) => {
        state.teamLoading = true;
        state.teamError = null;
      })
      .addCase(fetchAllTeamMembersForWebsite.fulfilled, (state, action) => {
        state.teamLoading = false;
        state.teamMembers = action.payload.teamMembers;
        state.teamOwner = action.payload.owner;
        state.teamError = null;
      })
      .addCase(fetchAllTeamMembersForWebsite.rejected, (state, action) => {
        state.teamLoading = false;
        state.teamError = action.payload as string;
      })
      // Invite Team Member To Website
      .addCase(inviteTeamMemberToWebsite.pending, (state) => {
        state.teamLoading = true;
        state.teamError = null;
      })
      .addCase(inviteTeamMemberToWebsite.fulfilled, (state) => {
        state.teamLoading = false;
        state.teamError = null;
      })
      .addCase(inviteTeamMemberToWebsite.rejected, (state, action) => {
        state.teamLoading = false;
        state.teamError = action.payload as string;
      })
      // Update Team Member Role For Website
      .addCase(updateTeamMemberRoleForWebsite.pending, (state) => {
        state.teamLoading = true;
        state.teamError = null;
      })
      .addCase(updateTeamMemberRoleForWebsite.fulfilled, (state, action) => {
        state.teamLoading = false;
        const member = state.teamMembers.find(
          (m) => m._id === action.payload.memberId,
        );
        if (member) {
          member.role = action.payload.role;
        }
        state.teamError = null;
      })
      .addCase(updateTeamMemberRoleForWebsite.rejected, (state, action) => {
        state.teamLoading = false;
        state.teamError = action.payload as string;
      })
      // Remove Team Member From Website
      .addCase(removeTeamMemberFromWebsite.pending, (state) => {
        state.teamLoading = true;
        state.teamError = null;
      })
      .addCase(removeTeamMemberFromWebsite.fulfilled, (state, action) => {
        state.teamLoading = false;
        state.teamMembers = state.teamMembers.filter(
          (m) => m._id !== action.payload,
        );
        state.teamError = null;
      })
      .addCase(removeTeamMemberFromWebsite.rejected, (state, action) => {
        state.teamLoading = false;
        state.teamError = action.payload as string;
      })
      // Fetch Notification Settings For Website
      .addCase(fetchNotificationSettingsForWebsite.pending, (state) => {
        state.notificationsLoading = true;
        state.notificationsError = null;
      })
      .addCase(
        fetchNotificationSettingsForWebsite.fulfilled,
        (state, action) => {
          state.notificationsLoading = false;
          state.notifications = action.payload;
          state.notificationsError = null;
        },
      )
      .addCase(
        fetchNotificationSettingsForWebsite.rejected,
        (state, action) => {
          state.notificationsLoading = false;
          state.notificationsError = action.payload as string;
        },
      )
      // Update Notification Settings For Website
      .addCase(updateNotificationSettingsForWebsite.pending, (state) => {
        state.notificationsLoading = true;
        state.notificationsError = null;
      })
      .addCase(
        updateNotificationSettingsForWebsite.fulfilled,
        (state, action) => {
          state.notificationsLoading = false;
          state.notifications = action.payload;
          state.notificationsError = null;
        },
      )
      .addCase(
        updateNotificationSettingsForWebsite.rejected,
        (state, action) => {
          state.notificationsLoading = false;
          state.notificationsError = action.payload as string;
        },
      )
      // Import Plausible Data For Website
      .addCase(importPlausibleDataForWebsite.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(importPlausibleDataForWebsite.fulfilled, (state) => {
        state.updating = false;
        state.error = null;
      })
      .addCase(importPlausibleDataForWebsite.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentWebsite,
  clearWebsites,
  clearApiKeys,
  clearTeam,
  clearNotifications,
} = websitesSlice.actions;
export default websitesSlice.reducer;
