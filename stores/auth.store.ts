"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getPublicApiBaseUrl } from "@/lib/env";
import type { UserRead } from "@/lib/types";

let authNavigate: ((path: string) => void) | null = null;

export function setAuthNavigate(handler: ((path: string) => void) | null) {
  authNavigate = handler;
}

type AuthState = {
  accessToken: string | null;
  user: UserRead | null;
  hasHydrated: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: UserRead | null) => void;
  setHydrated: (hydrated: boolean) => void;
  clearAuth: () => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      setToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      setHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      clearAuth: () => set({ accessToken: null, user: null }),
      logout: () => {
        if (typeof window !== "undefined") {
          const accessToken = get().accessToken;
          void fetch(`${getPublicApiBaseUrl()}/api/v1/auth/logout`, {
            method: "POST",
            credentials: "include",
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          }).catch(() => undefined);
        }
        get().clearAuth();
        if (authNavigate) {
          authNavigate("/login");
          return;
        }
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },
    }),
    {
      name: "atlas-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
