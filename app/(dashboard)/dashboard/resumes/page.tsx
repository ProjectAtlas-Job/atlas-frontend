"use client";

import { useQuery } from "@tanstack/react-query";

import { ResumeCard } from "@/components/resumes/ResumeCard";
import { UploadZone } from "@/components/resumes/UploadZone";
import { FormAlert } from "@/components/ui/form-alert";
import { fetchResumes, resumesQueryKey } from "@/lib/resumes";

export default function ResumesPage() {
  const resumesQuery = useQuery({
    queryKey: resumesQueryKey,
    queryFn: fetchResumes,
  });

  return (
    <div className="space-y-6">
      <UploadZone />

      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resume Library</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Your resumes</h2>
          <p className="text-sm text-slate-600">Manage uploads, labels, primary selection, and parse status.</p>
        </div>

        {resumesQuery.isLoading ? <p className="text-sm text-slate-600">Loading resumes...</p> : null}

        {resumesQuery.isError ? <FormAlert tone="error">Unable to load resumes right now.</FormAlert> : null}

        {resumesQuery.data && resumesQuery.data.length > 0 ? (
          <div className="grid gap-4">
            {resumesQuery.data.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        ) : null}

        {resumesQuery.data && resumesQuery.data.length === 0 && !resumesQuery.isLoading ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 px-6 py-8 text-sm text-slate-600">
            No resumes uploaded yet.
          </div>
        ) : null}
      </section>
    </div>
  );
}
