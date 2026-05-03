"use client";

import { create } from "zustand";

import type { UserRead } from "@/lib/types";

let authNavigate: ((path: string) => void) | null = null;

export function setAuthNavigate(handler: ((path: string) => void) | null) {
  authNavigate = handler;
}

type AuthState = {
  accessToken: string | null;
  user: UserRead | null;
  setToken: (token: string | null) => void;
  setUser: (user: UserRead | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  logout: () => {
    set({ accessToken: null, user: null });
    if (authNavigate) {
      authNavigate("/login");
      return;
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
}));
