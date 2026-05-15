"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-alert";
import { getApiErrorMessage } from "@/lib/api-error";
import { createJobSave, formatJobSource, formatJobWorkType, formatRelativeTime } from "@/lib/jobs";
import type { JobPostingRead, UserJobSaveRead } from "@/lib/types";

type JobCardProps = {
  job: JobPostingRead;
  matchScore?: number | null;
  context?: "all" | "matches" | "saved";
  saveRecord?: UserJobSaveRead | null;
  onDismissOptimistic?: (jobId: number) => (() => void) | void;
  onSaveRecordChange?: (save: UserJobSaveRead | null) => void;
  onSavedJobsChanged?: () => void | Promise<void>;
  detailsSlot?: ReactNode;
  footerSlot?: ReactNode;
  showDefaultActions?: boolean;
};

function formatMatchScore(matchScore: number): string {
  const displayValue = matchScore <= 1 ? Math.round(matchScore * 100) : Math.round(matchScore);
  return `${displayValue}% match`;
}

function getMatchBadgeClasses(matchScore: number): string {
  const displayValue = matchScore <= 1 ? matchScore * 100 : matchScore;
  if (displayValue >= 80) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (displayValue >= 65) {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-slate-100 text-slate-700";
}

export function JobCard({
  job,
  matchScore,
  context = "all",
  saveRecord = null,
  onDismissOptimistic,
  onSaveRecordChange,
  onSavedJobsChanged,
  detailsSlot,
  footerSlot,
  showDefaultActions = true,
}: JobCardProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localSaveRecord, setLocalSaveRecord] = useState<UserJobSaveRead | null>(saveRecord);

  useEffect(() => {
    setLocalSaveRecord(saveRecord);
  }, [saveRecord]);

  const saveMutation = useMutation({
    mutationFn: () => createJobSave(job.id, { status: "saved" }),
    onSuccess: async (save) => {
      setErrorMessage(null);
      setLocalSaveRecord(save);
      onSaveRecordChange?.(save);
      await onSavedJobsChanged?.();
    },
    onError: (error: unknown) => {
      setErrorMessage(getApiErrorMessage(error, "Could not save this job."));
    },
  });

  const dismissMutation = useMutation({
    mutationFn: () => createJobSave(job.id, { status: "dismissed" }),
    onMutate: () => {
      setErrorMessage(null);
      return { rollback: onDismissOptimistic?.(job.id) };
    },
    onSuccess: async (save) => {
      setLocalSaveRecord(save);
      onSaveRecordChange?.(save);
      await onSavedJobsChanged?.();
    },
    onError: (error: unknown, _variables, contextValue) => {
      contextValue?.rollback?.();
      setErrorMessage(getApiErrorMessage(error, "Could not dismiss this job."));
    },
  });

  const isSaved = localSaveRecord?.status === "saved" || localSaveRecord?.status === "applied";

  return (
    <Card className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl tracking-[-0.03em] text-slate-950">
              <Link className="transition-colors hover:text-slate-700" href={`/jobs/${job.id}`}>
                {job.title}
              </Link>
            </CardTitle>
            <p className="text-sm font-medium text-slate-700">{job.company_name_raw}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
              {formatJobSource(job.source)}
            </span>
            {typeof matchScore === "number" ? (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getMatchBadgeClasses(matchScore)}`}>
                {formatMatchScore(matchScore)}
              </span>
            ) : null}
            {context === "saved" && localSaveRecord ? (
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase text-sky-800">
                {localSaveRecord.status}
              </span>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <span>{job.location || "Location not specified"}</span>
          <span>Posted {formatRelativeTime(job.posted_at)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {job.work_type.map((workType) => (
            <span
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
              key={workType}
            >
              {formatJobWorkType(workType)}
            </span>
          ))}
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p>

        {detailsSlot}
        {errorMessage ? <FormAlert tone="error">{errorMessage}</FormAlert> : null}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        {showDefaultActions ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="sm">
              <Link href={`/jobs/${job.id}`}>View details</Link>
            </Button>
            <Button
              disabled={isSaved || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              size="sm"
              type="button"
              variant="outline"
            >
              {isSaved ? "Saved" : saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
            {context === "matches" ? (
              <Button
                disabled={dismissMutation.isPending}
                onClick={() => dismissMutation.mutate()}
                size="sm"
                type="button"
                variant="ghost"
              >
                {dismissMutation.isPending ? "Dismissing..." : "Dismiss"}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="sm">
              <Link href={`/jobs/${job.id}`}>View details</Link>
            </Button>
          </div>
        )}

        {footerSlot}
      </CardFooter>
    </Card>
  );
}
