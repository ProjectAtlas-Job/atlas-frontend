"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { JobCard } from "@/components/jobs/JobCard";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/button";
import { JobFilters, type JobFilterState } from "@/components/jobs/JobFilters";
import { FormAlert } from "@/components/ui/form-alert";
import { fetchJobs, jobsQueryKey, runAllJobBoardScrapers } from "@/lib/jobs";

const PAGE_SIZE = 20;

type JobsTab = "all" | "matches";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
}

function isJobsTab(value: string | null): value is JobsTab {
  return value === "all" || value === "matches";
}

export default function JobsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const tabParam = searchParams.get("tab");
  const tab: JobsTab = isJobsTab(tabParam) ? tabParam : "all";
  const [filters, setFilters] = useState<JobFilterState>({
    source: "",
    workType: "",
    location: "",
    search: "",
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 400);

  useEffect(() => {
    if (isJobsTab(tabParam)) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "all");
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams, tabParam]);

  const normalizedFilters = useMemo(
    () => ({
      source: filters.source || undefined,
      workType: filters.workType || undefined,
      location: filters.location.trim() || undefined,
      search: debouncedSearch || undefined,
    }),
    [debouncedSearch, filters.location, filters.source, filters.workType],
  );

  const jobsQuery = useInfiniteQuery({
    enabled: tab === "all",
    initialPageParam: 0,
    queryKey: [...jobsQueryKey, normalizedFilters],
    queryFn: ({ pageParam }) =>
      fetchJobs({
        ...normalizedFilters,
        skip: pageParam,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => {
      const nextSkip = lastPage.skip + lastPage.items.length;
      return nextSkip < lastPage.total ? nextSkip : undefined;
    },
  });

  const runAllMutation = useMutation({
    mutationFn: runAllJobBoardScrapers,
    onSuccess: async (response) => {
      showToast(`Queued job searches for ${response.queued_count} boards.`, "success");
      await queryClient.invalidateQueries({ queryKey: jobsQueryKey });
    },
    onError: () => {
      showToast("Unable to trigger all job board searches right now.", "error");
    },
  });

  useEffect(() => {
    if (tab !== "all") {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || !jobsQuery.hasNextPage || jobsQuery.isFetchingNextPage) {
          return;
        }

        void jobsQuery.fetchNextPage();
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [jobsQuery, tab]);

  const jobs = jobsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const total = jobsQuery.data?.pages[0]?.total ?? 0;

  const setTab = (nextTab: JobsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sprint 3</p>
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Jobs</h2>
        <p className="text-sm text-slate-600">Browse the global jobs feed now. Match ranking arrives in Sprint 4.</p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={runAllMutation.isPending}
          onClick={() => runAllMutation.mutate()}
          type="button"
        >
          {runAllMutation.isPending ? "Queuing Searches..." : "Search All Job Boards"}
        </Button>
        <p className="text-sm text-slate-600">Manually queue scraping across all configured job sources.</p>
      </div>

      <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
        <button
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            tab === "all" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
          }`}
          onClick={() => setTab("all")}
          type="button"
        >
          All Jobs
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            tab === "matches" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
          }`}
          onClick={() => setTab("matches")}
          type="button"
        >
          My Matches
        </button>
      </div>

      {tab === "matches" ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-sm text-slate-600">
          Matching coming in Sprint 4.
        </div>
      ) : (
        <div className="space-y-4">
          <JobFilters filters={filters} onChange={setFilters} />

          {jobsQuery.isLoading ? <p className="text-sm text-slate-600">Loading jobs...</p> : null}

          {jobsQuery.isError ? <FormAlert tone="error">Unable to load jobs right now.</FormAlert> : null}

          {jobs.length > 0 ? (
            <>
              <p className="text-sm text-slate-600">{total} active jobs found.</p>
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <JobCard job={job} key={job.id} />
                ))}
              </div>
            </>
          ) : null}

          {!jobsQuery.isLoading && !jobsQuery.isError && jobs.length === 0 ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 px-6 py-8 text-sm text-slate-600">
              No jobs match your current filters.
            </div>
          ) : null}

          <div className="flex min-h-10 items-center justify-center" ref={sentinelRef}>
            {jobsQuery.isFetchingNextPage ? <p className="text-sm text-slate-600">Loading more jobs...</p> : null}
            {!jobsQuery.hasNextPage && jobs.length > 0 ? (
              <p className="text-sm text-slate-500">You&apos;ve reached the end of the list.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
