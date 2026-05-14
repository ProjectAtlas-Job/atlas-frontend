"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { JobWorkType } from "@/lib/types";

export type JobFilterState = {
  source: string;
  workType: "" | JobWorkType;
  location: string;
  search: string;
};

type JobFiltersProps = {
  filters: JobFilterState;
  onChange: (next: JobFilterState) => void;
};

const sourceOptions = [
  { label: "All", value: "" },
  { label: "Naukri", value: "naukri" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "Internshala", value: "internshala" },
  { label: "Wellfound", value: "wellfound" },
  { label: "HackerNews", value: "hackernews" },
  { label: "Manual", value: "manual" },
] as const;

const workTypeOptions = [
  { label: "All", value: "" },
  { label: "Full Time", value: "full_time" },
  { label: "Part Time", value: "part_time" },
  { label: "Internship", value: "internship" },
  { label: "Contract", value: "contract" },
  { label: "Freelance", value: "freelance" },
] as const;

export function JobFilters({ filters, onChange }: JobFiltersProps) {
  return (
    <div className="sticky top-0 z-10 rounded-[1.75rem] border border-slate-200 bg-white/92 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Source</span>
          <Select
            onChange={(event) => onChange({ ...filters, source: event.target.value })}
            value={filters.source}
          >
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Work Type</span>
          <Select
            onChange={(event) =>
              onChange({
                ...filters,
                workType: event.target.value as JobFilterState["workType"],
              })
            }
            value={filters.workType}
          >
            {workTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Location</span>
          <Input
            onChange={(event) => onChange({ ...filters, location: event.target.value })}
            placeholder="Search location"
            value={filters.location}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</span>
          <Input
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder="Role, company, keyword"
            value={filters.search}
          />
        </label>
      </div>
    </div>
  );
}
