"use client";

import { api } from "@/lib/api";
import type {
  CreateJobSavePayload,
  JobListResponse,
  JobMatchListResponse,
  JobPostingRead,
  JobSaveStatus,
  JobWorkType,
  SavedJobsResponse,
  ScraperRunAllResponse,
  UpdateJobSavePayload,
  UserJobSaveRead,
} from "@/lib/types";

export const jobsQueryKey = ["jobs"] as const;
export const jobDetailQueryKey = (id: number) => ["job", id] as const;
export const jobMatchesQueryKey = (userId: number) => ["job-matches", userId] as const;
export const savedJobsQueryKey = (userId: number, status?: JobSaveStatus | "active") =>
  ["saved-jobs", userId, status ?? "active"] as const;

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

function normalizeJobSave(save: UserJobSaveRead): UserJobSaveRead {
  return {
    ...save,
    notes: save.notes ?? null,
    match_score: typeof save.match_score === "number" ? save.match_score : null,
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

export async function runAllJobBoardScrapers(): Promise<ScraperRunAllResponse> {
  const response = await api.post<ScraperRunAllResponse>("/api/v1/scraper/run-all");
  return response.data;
}

export async function fetchJobMatches(): Promise<JobMatchListResponse> {
  const response = await api.get<JobMatchListResponse>("/api/v1/jobs/matches");
  return {
    ...response.data,
    items: response.data.items.map((item) => ({
      ...item,
      job: normalizeJobPosting(item.job),
    })),
  };
}

export async function createJobSave(jobId: number, payload: CreateJobSavePayload): Promise<UserJobSaveRead> {
  const response = await api.post<UserJobSaveRead>(`/api/v1/jobs/${jobId}/save`, payload);
  return normalizeJobSave(response.data);
}

export async function updateJobSave(jobId: number, payload: UpdateJobSavePayload): Promise<UserJobSaveRead> {
  const response = await api.put<UserJobSaveRead>(`/api/v1/jobs/${jobId}/save`, payload);
  return normalizeJobSave(response.data);
}

export async function deleteJobSave(jobId: number): Promise<void> {
  await api.delete(`/api/v1/jobs/${jobId}/save`);
}

export async function fetchSavedJobs(status?: JobSaveStatus): Promise<SavedJobsResponse> {
  const params = new URLSearchParams();
  if (status) {
    params.set("status", status);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await api.get<SavedJobsResponse>(`/api/v1/jobs/saved${suffix}`);
  return {
    items: response.data.items.map((item) => ({
      save: normalizeJobSave(item.save),
      job: normalizeJobPosting(item.job),
    })),
  };
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
    scraper: "Scraper",
    glassdoor: "Glassdoor",
    indeed: "Indeed",
    unstop: "Unstop",
    cutshort: "Cutshort",
    iimjobs: "IIMJobs",
    hirist: "Hirist",
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
