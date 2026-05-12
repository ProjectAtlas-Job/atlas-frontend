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
  id?: number;
  resume_id?: number;
  resume?: {
    id?: number;
  };
};

type ResumeStatusResponse = {
  status?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeStatus(value: unknown): ResumeStatus {
  const normalized = readString(value)?.toLowerCase();

  if (normalized === "processing" || normalized === "completed" || normalized === "error") {
    return normalized;
  }

  return "pending";
}

function inferFormat(filename: string, explicitFormat: string | null) {
  if (explicitFormat) {
    return explicitFormat.toUpperCase();
  }

  const extension = filename.split(".").pop()?.trim();
  return extension ? extension.toUpperCase() : null;
}

function normalizeResume(item: unknown): ResumeRecord | null {
  if (!isRecord(item)) {
    return null;
  }

  const id = readNumber(item.id);
  const filename =
    readString(item.filename) ??
    readString(item.file_name) ??
    readString(item.original_filename) ??
    readString(item.name);

  if (id === null || !filename) {
    return null;
  }

  const format = inferFormat(
    filename,
    readString(item.format) ?? readString(item.file_type) ?? readString(item.mime_type),
  );

  return {
    id,
    filename,
    label: readString(item.label),
    format,
    isPrimary: readBoolean(item.is_primary),
    status: normalizeStatus(item.status),
    structuralScore: readNumber(item.structural_score),
    semanticScore: readNumber(item.semantic_score),
    atsScore: readNumber(item.ats_score),
  };
}

function normalizeResumeList(payload: unknown): ResumeRecord[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizeResume).filter((item): item is ResumeRecord => item !== null);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const nested =
    (Array.isArray(payload.items) && payload.items) ||
    (Array.isArray(payload.results) && payload.results) ||
    (Array.isArray(payload.data) && payload.data) ||
    [];

  return nested.map(normalizeResume).filter((item): item is ResumeRecord => item !== null);
}

export async function fetchResumes(): Promise<ResumeRecord[]> {
  const response = await api.get<unknown>(`${resumesBasePath}/`);
  return normalizeResumeList(response.data);
}

export async function uploadResume(file: File, label: string | null): Promise<number> {
  const formData = new FormData();
  formData.append("file", file);

  const trimmedLabel = label?.trim();
  if (trimmedLabel) {
    formData.append("label", trimmedLabel);
  }

  const response = await api.post<ResumeUploadResponse>(`${resumesBasePath}/upload`, formData);

  const resumeId = response.data.id ?? response.data.resume_id ?? response.data.resume?.id;
  if (typeof resumeId !== "number") {
    throw new Error("Upload completed but no resume id was returned.");
  }

  return resumeId;
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
