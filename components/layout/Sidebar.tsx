"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <aside className="flex w-full flex-col gap-4 rounded-[2rem] border border-black/10 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:w-72">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Project Atlas</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Workspace</h2>
      </div>
      <nav className="flex flex-col gap-2">
        {links.map((label) => {
          const href = label === "Jobs" ? "/dashboard" : `/dashboard/${slugify(label)}`;
          const isActive = pathname === href;

          return (
            <Link
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                isActive ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )}
              href={href}
              key={label}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
