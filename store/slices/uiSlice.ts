import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UIState {
  selectedPeriod: string;
  selectedGranularity: "Hourly" | "Daily" | "Weekly" | "Monthly";
  selectedSourceTab: "Channel" | "Referrer" | "Campaign" | "Keyword";
  selectedPathTab: "Hostname" | "Page" | "Entry page" | "Exit link";
  selectedLocationTab: "Map" | "Country" | "Region" | "City";
  selectedSystemTab: "Browser" | "OS" | "Device";
  selectedGoalTab: "Goal" | "Funnel" | "Journey";
  showMentionsOnChart: boolean;
}

const initialState: UIState = {
  selectedPeriod: "Last 30 days",
  selectedGranularity: "Daily",
  selectedSourceTab: "Channel",
  selectedPathTab: "Page",
  selectedLocationTab: "Country",
  selectedSystemTab: "Browser",
  selectedGoalTab: "Goal",
  showMentionsOnChart: true,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSelectedPeriod: (state, action: PayloadAction<string>) => {
      state.selectedPeriod = action.payload;
    },
    setSelectedGranularity: (
      state,
      action: PayloadAction<"Hourly" | "Daily" | "Weekly" | "Monthly">
    ) => {
      state.selectedGranularity = action.payload;
    },
    setSelectedSourceTab: (
      state,
      action: PayloadAction<"Channel" | "Referrer" | "Campaign" | "Keyword">
    ) => {
      state.selectedSourceTab = action.payload;
    },
    setSelectedPathTab: (
      state,
      action: PayloadAction<"Hostname" | "Page" | "Entry page" | "Exit link">
    ) => {
      state.selectedPathTab = action.payload;
    },
    setSelectedLocationTab: (
      state,
      action: PayloadAction<"Map" | "Country" | "Region" | "City">
    ) => {
      state.selectedLocationTab = action.payload;
    },
    setSelectedSystemTab: (
      state,
      action: PayloadAction<"Browser" | "OS" | "Device">
    ) => {
      state.selectedSystemTab = action.payload;
    },
    setSelectedGoalTab: (
      state,
      action: PayloadAction<"Goal" | "Funnel" | "Journey">
    ) => {
      state.selectedGoalTab = action.payload;
    },
    setShowMentionsOnChart: (state, action: PayloadAction<boolean>) => {
      state.showMentionsOnChart = action.payload;
    },
  },
});

export const {
  setSelectedPeriod,
  setSelectedGranularity,
  setSelectedSourceTab,
  setSelectedPathTab,
  setSelectedLocationTab,
  setSelectedSystemTab,
  setSelectedGoalTab,
  setShowMentionsOnChart,
} = uiSlice.actions;
export default uiSlice.reducer;
