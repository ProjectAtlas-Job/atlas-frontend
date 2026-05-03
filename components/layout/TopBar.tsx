"use client";

import { useAuthStore } from "@/stores/auth.store";

function getInitials(fullName: string | null | undefined) {
  if (!fullName) {
    return "PA";
  }

  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TopBar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="flex items-center justify-between rounded-[2rem] border border-black/10 bg-white/80 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Authenticated Area</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-950">Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
          {getInitials(user?.full_name)}
        </div>
        <button
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
          onClick={logout}
          type="button"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
