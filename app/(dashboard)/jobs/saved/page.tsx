"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { JobCard } from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api-error";
import { deleteJobSave, fetchSavedJobs, savedJobsQueryKey, updateJobSave } from "@/lib/jobs";
import type { JobSaveStatus, SavedJobItem } from "@/lib/types";
import { useAuthStore } from "@/stores/auth.store";

type SavedTab = "saved" | "applied" | "dismissed";

const tabs: { label: string; value: SavedTab }[] = [
  { label: "Saved", value: "saved" },
  { label: "Applied", value: "applied" },
  { label: "Dismissed", value: "dismissed" },
];

function SavedJobCard({
  item,
  userId,
}: {
  item: SavedJobItem;
  userId: number;
}) {
  const queryClient = useQueryClient();
  const [statusValue, setStatusValue] = useState<JobSaveStatus>(item.save.status);
  const [notesValue, setNotesValue] = useState(item.save.notes ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const invalidateSavedJobs = async () => {
    await queryClient.invalidateQueries({ queryKey: ["saved-jobs", userId] });
  };

  const updateMutation = useMutation({
    mutationFn: async () =>
      updateJobSave(item.job.id, {
        status: statusValue,
        notes: notesValue.trim() || null,
      }),
    onSuccess: async (save) => {
      setErrorMessage(null);
      setStatusValue(save.status);
      setNotesValue(save.notes ?? "");
      await invalidateSavedJobs();
    },
    onError: (error: unknown) => {
      setErrorMessage(getApiErrorMessage(error, "Could not update this saved job."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => deleteJobSave(item.job.id),
    onSuccess: async () => {
      setErrorMessage(null);
      await invalidateSavedJobs();
    },
    onError: (error: unknown) => {
      setErrorMessage(getApiErrorMessage(error, "Could not remove this saved job."));
    },
  });

  return (
    <JobCard
      context="saved"
      footerSlot={
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()} size="sm" type="button" variant="outline">
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
          <Button
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm("Remove this saved job?")) {
                deleteMutation.mutate();
              }
            }}
            size="sm"
            type="button"
            variant="destructive"
          >
            {deleteMutation.isPending ? "Removing..." : "Delete"}
          </Button>
        </div>
      }
      job={item.job}
      saveRecord={{
        ...item.save,
        status: statusValue,
        notes: notesValue.trim() || null,
      }}
      showDefaultActions={false}
      detailsSlot={
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`status-${item.save.id}`}>Save status</Label>
              <Select
                id={`status-${item.save.id}`}
                onChange={(event) => setStatusValue(event.target.value as JobSaveStatus)}
                value={statusValue}
              >
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="dismissed">Dismissed</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`match-score-${item.save.id}`}>Match score</Label>
              <Input
                disabled
                id={`match-score-${item.save.id}`}
                value={item.save.match_score !== null ? `${Math.round(item.save.match_score * 100)}%` : "Not captured"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`notes-${item.save.id}`}>Notes</Label>
            <Input
              id={`notes-${item.save.id}`}
              onChange={(event) => setNotesValue(event.target.value)}
              placeholder="Add a quick note about this role"
              value={notesValue}
            />
          </div>

          {errorMessage ? <FormAlert tone="error">{errorMessage}</FormAlert> : null}
        </div>
      }
    />
  );
}

export default function SavedJobsPage() {
  const userId = useAuthStore((state) => state.user?.id ?? 0);
  const [tab, setTab] = useState<SavedTab>("saved");

  const savedJobsQuery = useQuery({
    enabled: userId > 0,
    queryKey: savedJobsQueryKey(userId, tab),
    queryFn: () => fetchSavedJobs(tab),
  });

  const items = savedJobsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sprint 4</p>
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Saved Jobs</h2>
        <p className="text-sm text-slate-600">Track saved roles, applied positions, and dismissed jobs from one place.</p>
      </section>

      <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
        {tabs.map((item) => (
          <button
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
            }`}
            key={item.value}
            onClick={() => setTab(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {savedJobsQuery.isLoading ? <p className="text-sm text-slate-600">Loading saved jobs...</p> : null}
      {savedJobsQuery.isError ? <FormAlert tone="error">Could not load saved jobs. Try again.</FormAlert> : null}

      {!savedJobsQuery.isLoading && !savedJobsQuery.isError && items.length === 0 ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 px-6 py-8 text-sm text-slate-600">
          No jobs in this list yet.
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <SavedJobCard item={item} key={`${item.save.id}-${item.job.id}`} userId={userId} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
