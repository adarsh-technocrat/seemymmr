import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchWebsites = createAsyncThunk(
  "websites/fetchWebsites",
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
  }
);

export const fetchWebsiteById = createAsyncThunk(
  "websites/fetchWebsiteById",
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
  }
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

interface WebsitesState {
  websites: Website[];
  currentWebsite: Website | null;
  loading: boolean;
  error: string | null;
}

const initialState: WebsitesState = {
  websites: [],
  currentWebsite: null,
  loading: false,
  error: null,
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWebsites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWebsites.fulfilled, (state, action) => {
        state.loading = false;
        state.websites = action.payload;
        state.error = null;
      })
      .addCase(fetchWebsites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWebsiteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWebsiteById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWebsite = action.payload;
        state.error = null;
      })
      .addCase(fetchWebsiteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentWebsite, clearWebsites } = websitesSlice.actions;
export default websitesSlice.reducer;
