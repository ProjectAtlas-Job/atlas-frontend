"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";

import { ParseProgress } from "@/components/resumes/ParseProgress";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-error";
import { resumesQueryKey, uploadResume, type ResumeRecord } from "@/lib/resumes";
import { cn } from "@/lib/utils";

const maxFileSize = 10 * 1024 * 1024;

const acceptedFiles = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getDefaultLabel(filename: string) {
  return filename.replace(/\.[^.]+$/, "");
}

function getDropErrorMessage(rejections: FileRejection[]) {
  const firstError = rejections[0]?.errors[0];

  if (!firstError) {
    return "This file cannot be uploaded.";
  }

  if (firstError.code === "file-too-large") {
    return "File is too large. Maximum size is 10 MB.";
  }

  if (firstError.code === "file-invalid-type") {
    return "Unsupported file type. Upload a PDF, DOCX, TXT, or Markdown file.";
  }

  return firstError.message;
}

export function UploadZone() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeResumeId, setActiveResumeId] = useState<number | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("Choose a file before uploading.");
      }

      return uploadResume(selectedFile, label);
    },
    onSuccess: async (resumeId) => {
      const uploadedFile = selectedFile;
      const uploadedLabel = label.trim() || null;

      setErrorMessage(null);
      setActiveResumeId(resumeId);
      setSelectedFile(null);
      setLabel("");

      if (uploadedFile) {
        queryClient.setQueryData<ResumeRecord[]>(resumesQueryKey, (current = []) => {
          const nextItem: ResumeRecord = {
            id: resumeId,
            filename: uploadedFile.name,
            label: uploadedLabel,
            format: uploadedFile.name.split(".").pop()?.toUpperCase() ?? null,
            isPrimary: false,
            status: "pending",
            structuralScore: null,
            semanticScore: null,
            atsScore: null,
          };

          return current.some((item) => item.id === resumeId) ? current : [nextItem, ...current];
        });
      }

      await queryClient.invalidateQueries({ queryKey: resumesQueryKey });
    },
    onError: (error: unknown) => {
      setActiveResumeId(null);
      setErrorMessage(getApiErrorMessage(error, "Upload failed. Try again."));
      void queryClient.invalidateQueries({ queryKey: resumesQueryKey });
    },
  });

  const onDropAccepted = (files: File[]) => {
    const file = files[0];
    if (!file) {
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setLabel(getDefaultLabel(file.name));
  };

  const onDropRejected = (rejections: FileRejection[]) => {
    setSelectedFile(null);
    setLabel("");
    setErrorMessage(getDropErrorMessage(rejections));
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: acceptedFiles,
    maxFiles: 1,
    maxSize: maxFileSize,
    multiple: false,
    noClick: true,
    onDropAccepted,
    onDropRejected,
  });

  const fileSummary = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return `${selectedFile.name} • ${formatFileSize(selectedFile.size)}`;
  }, [selectedFile]);

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "rounded-[1.75rem] border-2 border-dashed px-6 py-8 transition-colors",
          isDragActive ? "border-slate-950 bg-slate-100" : "border-slate-300 bg-slate-50/80",
        )}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Resume Upload</p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Drop a resume here</h2>
            <p className="text-sm leading-6 text-slate-600">
              Accepted formats: PDF, DOCX, TXT, and Markdown. Maximum file size is 10 MB.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={open} type="button" variant="outline">
              Choose file
            </Button>
            {selectedFile ? (
              <Button disabled={uploadMutation.isPending} onClick={() => uploadMutation.mutate()} type="button">
                {uploadMutation.isPending ? "Uploading..." : "Upload resume"}
              </Button>
            ) : null}
          </div>
          <p className="text-sm text-slate-600">
            {isDragActive ? "Release to upload your resume." : "Drag and drop a file here or browse from your device."}
          </p>
          {fileSummary ? <p className="text-sm font-medium text-slate-950">{fileSummary}</p> : null}
        </div>
      </div>

      {selectedFile ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="resume-label">
            Label
          </label>
          <Input
            id="resume-label"
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Resume label"
            value={label}
          />
        </div>
      ) : null}

      {errorMessage ? <FormAlert tone="error">{errorMessage}</FormAlert> : null}
      {activeResumeId !== null ? <ParseProgress resume_id={activeResumeId} /> : null}
    </div>
  );
}
