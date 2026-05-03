"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { UserRead } from "@/lib/types";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useAuthStore } from "@/stores/auth.store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function ensureSession() {
      try {
        let token = accessToken;
        if (!token) {
          const refreshResponse = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });

          if (!refreshResponse.ok) {
            if (!cancelled) {
              logout();
            }
            return;
          }

          const refreshData = (await refreshResponse.json()) as { access_token: string };
          token = refreshData.access_token;
          if (!cancelled) {
            setToken(token);
          }
        }

        if (!user) {
          const meResponse = await api.get<UserRead>("/api/v1/auth/me");
          if (!cancelled) {
            setUser(meResponse.data);
          }
        }

        if (!cancelled) {
          setIsReady(true);
        }
      } catch {
        if (!cancelled) {
          logout();
          router.push("/login");
        }
      }
    }

    void ensureSession();

    return () => {
      cancelled = true;
    };
  }, [accessToken, logout, router, setToken, setUser, user]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-medium text-slate-600">
        Preparing your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <TopBar />
          <div className="rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
