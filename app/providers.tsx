"use client";

import { AuthProvider } from "@/lib/firebase/auth-context";
import { Provider } from "react-redux";
import { getStore } from "@/store/store";
import { useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => getStore(), []);

  return (
    <Provider store={store}>
      <AuthProvider>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </AuthProvider>
    </Provider>
  );
}
