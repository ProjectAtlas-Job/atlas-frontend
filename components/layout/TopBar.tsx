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
    <header className="flex flex-col gap-4 rounded-[2rem] border border-slate-900/10 bg-white/88 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Authenticated Area</p>
        <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">{user?.email ?? "Signed-in account"}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
            {getInitials(user?.full_name)}
          </div>
          <div className="hidden pr-2 sm:block">
            <p className="text-sm font-medium text-slate-950">{user?.full_name || "Project Atlas user"}</p>
            <p className="text-xs text-slate-500">Protected session</p>
          </div>
        </div>
        <button
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:-translate-y-px hover:bg-slate-100 hover:text-slate-950 active:translate-y-0"
          onClick={logout}
          type="button"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
