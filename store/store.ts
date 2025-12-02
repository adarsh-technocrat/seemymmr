import { configureStore } from "@reduxjs/toolkit";
import analyticsReducer from "./slices/analyticsSlice";
import websitesReducer from "./slices/websitesSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    analytics: analyticsReducer,
    websites: websitesReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
