"use client";

import { api } from "@/lib/api";
import type { JobListResponse, JobPostingRead, JobWorkType } from "@/lib/types";

export const jobsQueryKey = ["jobs"] as const;

export type JobListFilters = {
  source?: string;
  workType?: JobWorkType;
  location?: string;
  search?: string;
  skip?: number;
  limit?: number;
};

function normalizeJobPosting(job: JobPostingRead): JobPostingRead {
  return {
    ...job,
    work_type: Array.isArray(job.work_type) ? job.work_type : [],
    skills_required: Array.isArray(job.skills_required) ? job.skills_required : [],
  };
}

export async function fetchJobs(filters: JobListFilters = {}): Promise<JobListResponse> {
  const params = new URLSearchParams();

  if (filters.source) {
    params.set("source", filters.source);
  }
  if (filters.workType) {
    params.set("work_type", filters.workType);
  }
  if (filters.location) {
    params.set("location", filters.location);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }
  params.set("skip", String(filters.skip ?? 0));
  params.set("limit", String(Math.min(filters.limit ?? 20, 50)));

  const response = await api.get<JobListResponse>(`/api/v1/jobs/?${params.toString()}`);

  return {
    ...response.data,
    items: response.data.items.map(normalizeJobPosting),
  };
}

export async function fetchJob(id: number): Promise<JobPostingRead> {
  const response = await api.get<JobPostingRead>(`/api/v1/jobs/${id}`);
  return normalizeJobPosting(response.data);
}

export function formatJobSource(source: string): string {
  const normalized = source.trim().toLowerCase();
  const map: Record<string, string> = {
    naukri: "Naukri",
    linkedin: "LinkedIn",
    internshala: "Internshala",
    wellfound: "Wellfound",
    hackernews: "HackerNews",
    manual: "Manual",
  };

  return map[normalized] ?? source;
}

export function formatJobWorkType(workType: string): string {
  switch (workType) {
    case "full_time":
      return "Full Time";
    case "part_time":
      return "Part Time";
    case "internship":
      return "Internship";
    case "contract":
      return "Contract";
    case "freelance":
      return "Freelance";
    default:
      return workType
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

export function formatRelativeTime(value: string | null): string {
  if (!value) {
    return "Date unavailable";
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "Date unavailable";
  }

  const diffMs = timestamp - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return formatter.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return formatter.format(diffMonths, "month");
  }

  const diffYears = Math.round(diffMonths / 12);
  return formatter.format(diffYears, "year");
}
