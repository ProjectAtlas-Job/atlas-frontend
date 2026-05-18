"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-error";
import { deleteResume, resumesQueryKey, updateResume, type ResumeRecord } from "@/lib/resumes";
import { cn } from "@/lib/utils";

type ResumeCardProps = {
  resume: ResumeRecord;
};

function formatAtsScore(value: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-- / 100";
  }

  return `${Math.round(Math.max(0, Math.min(100, value)))} / 100`;
}

function ScoreBar({ value }: { value: number | null }) {
  const normalizedValue = value === null ? 0 : Math.max(0, Math.min(1, value));

  return (
    <div className="space-y-1">
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-slate-900 transition-[width]" style={{ width: `${normalizedValue * 100}%` }} />
      </div>
      <p className="text-xs text-slate-500">{normalizedValue.toFixed(2)}</p>
    </div>
  );
}

function Badge({ children, tone = "default" }: { children: string; tone?: "default" | "accent" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
        tone === "accent" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700",
      )}
    >
      {children}
    </span>
  );
}

export function ResumeCard({ resume }: ResumeCardProps) {
  const queryClient = useQueryClient();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(resume.label ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const invalidateResumes = async () => {
    await queryClient.invalidateQueries({ queryKey: resumesQueryKey });
  };

  const editLabelMutation = useMutation({
    mutationFn: async () => {
      await updateResume(resume.id, { label: labelDraft.trim() || null });
    },
    onSuccess: async () => {
      setErrorMessage(null);
      setIsEditingLabel(false);
      await invalidateResumes();
    },
    onError: (error: unknown) => {
      setErrorMessage(getApiErrorMessage(error, "Could not update the label."));
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async () => {
      await updateResume(resume.id, { is_primary: true });
    },
    onMutate: async () => {
      setErrorMessage(null);
      await queryClient.cancelQueries({ queryKey: resumesQueryKey });
      const previous = queryClient.getQueryData<ResumeRecord[]>(resumesQueryKey);

      queryClient.setQueryData<ResumeRecord[]>(resumesQueryKey, (current = []) =>
        current.map((item) =>
          item.id === resume.id ? { ...item, isPrimary: true } : { ...item, isPrimary: false },
        ),
      );

      return { previous };
    },
    onError: (error: unknown, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(resumesQueryKey, context.previous);
      }
      setErrorMessage(getApiErrorMessage(error, "Could not set this resume as primary."));
    },
    onSettled: async () => {
      await invalidateResumes();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteResume(resume.id);
    },
    onSuccess: async () => {
      setErrorMessage(null);
      await invalidateResumes();
    },
    onError: (error: unknown) => {
      setErrorMessage(getApiErrorMessage(error, "Could not delete this resume."));
    },
  });

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle>{resume.filename}</CardTitle>
            <div className="flex flex-wrap gap-2">
              {resume.format ? <Badge>{resume.format}</Badge> : null}
              {resume.isPrimary ? <Badge tone="accent">Primary</Badge> : null}
              <Badge>{resume.status}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Label</p>
          {isEditingLabel ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input onChange={(event) => setLabelDraft(event.target.value)} value={labelDraft} />
              <div className="flex gap-2">
                <Button disabled={editLabelMutation.isPending} onClick={() => editLabelMutation.mutate()} type="button">
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setLabelDraft(resume.label ?? "");
                    setIsEditingLabel(false);
                  }}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-700">{resume.label ?? "No label set"}</p>
          )}
        </div>

        {resume.status === "completed" ? (
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">ATS Score</p>
              <p className="text-lg font-semibold text-slate-950">{formatAtsScore(resume.atsScore)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Structural Score</p>
              <ScoreBar value={resume.structuralScore} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Semantic Score</p>
              <ScoreBar value={resume.semanticScore} />
            </div>
          </div>
        ) : null}

        {errorMessage ? <FormAlert tone="error">{errorMessage}</FormAlert> : null}
      </CardContent>

      <CardFooter className="flex flex-wrap justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {!isEditingLabel ? (
            <Button onClick={() => setIsEditingLabel(true)} type="button" variant="outline">
              Edit label
            </Button>
          ) : null}
          <Button
            disabled={resume.isPrimary || setPrimaryMutation.isPending}
            onClick={() => setPrimaryMutation.mutate()}
            type="button"
            variant="outline"
          >
            {resume.isPrimary ? "Primary resume" : "Set as primary"}
          </Button>
        </div>
        <Button
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (window.confirm("Delete this resume?")) {
              deleteMutation.mutate();
            }
          }}
          type="button"
          variant="destructive"
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
