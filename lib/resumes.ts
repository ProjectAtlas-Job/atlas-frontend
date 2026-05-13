import { api } from "@/lib/api";

export const resumesQueryKey = ["resumes"] as const;

const resumesBasePath = "/api/v1/resumes";

export type ResumeStatus = "pending" | "processing" | "completed" | "error";

export type ResumeRecord = {
  id: number;
  filename: string;
  label: string | null;
  format: string | null;
  isPrimary: boolean;
  status: ResumeStatus;
  structuralScore: number | null;
  semanticScore: number | null;
  atsScore: number | null;
};

type ResumeUploadResponse = {
  id: number;
};

type ResumeStatusResponse = {
  status: string;
  structural_score: number | null;
  semantic_score: number | null;
  ats_score: number | null;
};

function normalizeStatus(value: unknown): ResumeStatus {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : null;

  if (normalized === "processing" || normalized === "completed" || normalized === "error") {
    return normalized;
  }

  return "pending";
}

type ResumeListItemResponse = {
  id: number;
  filename: string;
  label: string | null;
  format: string;
  is_primary: boolean;
  status: string;
  structural_score: number | null;
  semantic_score: number | null;
  ats_score: number | null;
};

function normalizeResume(item: ResumeListItemResponse): ResumeRecord {
  return {
    id: item.id,
    filename: item.filename,
    label: item.label,
    format: item.format.toUpperCase(),
    isPrimary: item.is_primary,
    status: normalizeStatus(item.status),
    structuralScore: item.structural_score,
    semanticScore: item.semantic_score,
    atsScore: item.ats_score,
  };
}

export async function fetchResumes(): Promise<ResumeRecord[]> {
  const response = await api.get<ResumeListItemResponse[]>(`${resumesBasePath}/`);
  return response.data.map(normalizeResume);
}

export async function uploadResume(file: File, label: string | null): Promise<number> {
  const formData = new FormData();
  formData.append("resume_file", file);

  const trimmedLabel = label?.trim();
  if (trimmedLabel) {
    formData.append("label", trimmedLabel);
  }

  const response = await api.post<ResumeUploadResponse>(`${resumesBasePath}/upload`, formData);
  return response.data.id;
}

export async function fetchResumeStatus(resumeId: number): Promise<ResumeStatus> {
  const response = await api.get<ResumeStatusResponse>(`${resumesBasePath}/${resumeId}/status`);
  return normalizeStatus(response.data.status);
}

export async function updateResume(
  resumeId: number,
  payload: { label?: string | null; is_primary?: boolean },
): Promise<void> {
  await api.put(`${resumesBasePath}/${resumeId}`, payload);
}

export async function deleteResume(resumeId: number): Promise<void> {
  await api.delete(`${resumesBasePath}/${resumeId}`);
}
