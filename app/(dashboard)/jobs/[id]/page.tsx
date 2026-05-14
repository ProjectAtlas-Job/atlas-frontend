"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { fetchJob } from "@/lib/jobs";

function JobDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = Number(params.id);

  const jobQuery = useQuery({
    enabled: Number.isFinite(jobId),
    queryKey: ["job", jobId],
    queryFn: () => fetchJob(jobId),
  });

  if (jobQuery.isLoading) {
    return <p className="text-sm text-slate-600">Loading job details...</p>;
  }

  if (jobQuery.isError || !jobQuery.data) {
    return <FormAlert tone="error">Unable to load this job right now.</FormAlert>;
  }

  const job = jobQuery.data;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950" href="/jobs">
          Back to jobs
        </Link>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{job.source}</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">{job.title}</h2>
          <p className="text-sm text-slate-600">{job.company_name_raw}</p>
        </div>
        <Button asChild>
          <a href={job.source_url} rel="noreferrer" target="_blank">
            Open source listing
          </a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <JobDetailRow label="Location" value={job.location || "Not specified"} />
        <JobDetailRow label="Work Type" value={job.work_type.length > 0 ? job.work_type.join(", ") : "Not specified"} />
        <JobDetailRow
          label="Salary Range"
          value={
            job.salary_min !== null || job.salary_max !== null
              ? `${job.salary_min ?? "?"} - ${job.salary_max ?? "?"}`
              : "Not specified"
          }
        />
        <JobDetailRow label="Experience" value={job.experience_required || "Not specified"} />
        <JobDetailRow label="Skills" value={job.skills_required.length > 0 ? job.skills_required.join(", ") : "Not specified"} />
        <JobDetailRow label="Posted At" value={job.posted_at ? new Date(job.posted_at).toLocaleString() : "Not specified"} />
        <JobDetailRow label="Scraped At" value={new Date(job.scraped_at).toLocaleString()} />
        <JobDetailRow label="Status" value={job.is_active ? "Active" : "Inactive"} />
      </div>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description</p>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{job.description}</div>
      </section>
    </div>
  );
}
