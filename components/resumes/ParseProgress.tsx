"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { fetchResumeStatus, resumesQueryKey, type ResumeStatus } from "@/lib/resumes";
import { cn } from "@/lib/utils";

type ParseProgressProps = {
  resume_id: number;
};

function Spinner() {
  return <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />;
}

export function ParseProgress({ resume_id }: ParseProgressProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ResumeStatus>("pending");

  useEffect(() => {
    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function pollStatus() {
      try {
        const nextStatus = await fetchResumeStatus(resume_id);
        if (!active) {
          return;
        }

        setStatus(nextStatus);

        if (nextStatus === "completed" || nextStatus === "error") {
          if (intervalId) {
            clearInterval(intervalId);
          }

          if (nextStatus === "completed") {
            void queryClient.invalidateQueries({ queryKey: resumesQueryKey });
          }
        }
      } catch {
        if (!active) {
          return;
        }

        setStatus("error");
        if (intervalId) {
          clearInterval(intervalId);
        }
      }
    }

    void pollStatus();
    intervalId = setInterval(() => {
      void pollStatus();
    }, 3000);

    return () => {
      active = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [queryClient, resume_id]);

  if (status === "completed") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">✓</span>
        Done
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Parse failed. Try uploading again.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium",
        "border-sky-200 bg-sky-50 text-sky-800",
      )}
    >
      <Spinner />
      {status === "processing" ? "Parsing resume..." : "Queued for processing..."}
    </div>
  );
}
