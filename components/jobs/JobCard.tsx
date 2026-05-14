"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatJobSource, formatJobWorkType, formatRelativeTime } from "@/lib/jobs";
import type { JobPostingRead } from "@/lib/types";

type JobCardProps = {
  job: JobPostingRead;
  matchScore?: number | null;
};

function formatMatchScore(matchScore: number): string {
  const displayValue = matchScore <= 1 ? Math.round(matchScore * 100) : Math.round(matchScore);
  return `${displayValue}% match`;
}

export function JobCard({ job, matchScore }: JobCardProps) {
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
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                {formatMatchScore(matchScore)}
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

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="sm">
            <Link href={`/jobs/${job.id}`}>View details</Link>
          </Button>
          <Button disabled size="sm" title="Save coming soon" variant="outline">
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
