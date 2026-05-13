"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { fetchProfileCompleteness, profileCompletenessQueryKey } from "@/lib/profile";
import { cn } from "@/lib/utils";

const links = [
  "Jobs",
  "Companies",
  "Applications",
  "Contacts",
  "Templates",
  "Resumes",
  "Forum",
  "Referrals",
  "Logs",
  "Settings",
  "Profile",
];

function slugify(label: string) {
  return label.toLowerCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const completenessQuery = useQuery({
    queryKey: profileCompletenessQueryKey,
    queryFn: fetchProfileCompleteness,
  });

  return (
    <aside className="flex w-full flex-col gap-6 rounded-[2rem] border border-slate-900/10 bg-slate-950 p-5 text-slate-50 shadow-[0_26px_80px_rgba(15,23,42,0.18)] md:w-72">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/85">Project Atlas</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Workspace</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Sprint 2 dashboard with profile editing, GitHub connect, and resume parsing.</p>
      </div>
      <nav className="flex flex-col gap-2">
        {links.map((label) => {
          const href =
            label === "Jobs"
              ? "/dashboard"
              : label === "Profile"
                ? "/profile"
                : label === "Resumes"
                  ? "/resumes"
                  : `/dashboard/${slugify(label)}`;
          const isActive = pathname === href;

          return (
            <Link
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-white text-slate-950 shadow-[0_12px_32px_rgba(255,255,255,0.12)]"
                  : "text-slate-300 hover:bg-white/8 hover:text-white",
              )}
              href={href}
              key={label}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/85">Profile completeness</p>
        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
          {completenessQuery.data ? `${completenessQuery.data.score}/100` : "--"}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {completenessQuery.data
            ? `${completenessQuery.data.missing.length} remaining actions from Sprint 2 profile setup.`
            : "Fetching your latest completion score..."}
        </p>
      </div>
      <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm leading-6 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        Backend deployment is temporarily AWS-based. Frontend route protection remains unchanged while the host infrastructure swaps later.
      </div>
    </aside>
  );
}
