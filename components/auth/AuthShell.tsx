"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  sideNote?: ReactNode;
  className?: string;
};

export function AuthShell({
  badge,
  title,
  description,
  children,
  footer,
  sideNote,
  className,
}: AuthShellProps) {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,#f7f7f2_0%,#eef2ec_52%,#f6f4ee_100%)] px-4 py-6 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-7rem] h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="absolute right-[-4rem] top-20 h-64 w-64 rounded-full bg-amber-200/45 blur-3xl" />
        <div className="absolute bottom-[-7rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-200/35 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[0.96fr_1.04fr]">
        <section className="flex flex-col justify-between rounded-[2rem] border border-slate-900/8 bg-slate-950 px-6 py-7 text-slate-50 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:px-8 sm:py-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/88">{badge}</p>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">{description}</p>
          </div>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Secure</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">JWT access tokens with refresh-cookie recovery.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Verified</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">Email confirmation and reset links stay on the same path.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Deployed</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">Frontend stays Vercel-first while backend points at AWS HTTPS.</p>
              </div>
            </div>
            {sideNote ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/7 p-4 text-sm leading-6 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                {sideNote}
              </div>
            ) : null}
          </div>
        </section>

        <section
          className={cn(
            "flex flex-col justify-center rounded-[2rem] border border-slate-900/10 bg-white/88 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-6",
            className,
          )}
        >
          <div className="rounded-[1.75rem] border border-slate-200/85 bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:p-8">
            {children}
            {footer ? <div className="mt-7 border-t border-slate-200 pt-5">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
