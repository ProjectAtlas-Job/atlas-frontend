"use client";

import { api } from "@/lib/api";
import type { ProfileCompletenessRead, UserRead, UserUpdatePayload } from "@/lib/types";

export const currentUserQueryKey = ["current-user"] as const;
export const profileCompletenessQueryKey = ["profile-completeness"] as const;
export const githubScanQueryKey = ["github-scan"] as const;

export type GitHubRepoSummary = {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
};

export type GitHubMetadata = {
  languages: Record<string, number>;
  topics: string[];
  top_repos: GitHubRepoSummary[];
  total_stars: number;
};

export type GitHubScanResponse =
  | {
      status: "not_connected";
      github_username: string | null;
      metadata?: null;
    }
  | {
      status: "connected";
      github_username: string | null;
      metadata: GitHubMetadata;
    };

export async function fetchCurrentUser(): Promise<UserRead> {
  const response = await api.get<UserRead>("/api/v1/users/me");
  return response.data;
}

export async function updateCurrentUser(payload: UserUpdatePayload): Promise<UserRead> {
  const response = await api.put<UserRead>("/api/v1/users/me", payload);
  return response.data;
}

export async function fetchProfileCompleteness(): Promise<ProfileCompletenessRead> {
  const response = await api.get<ProfileCompletenessRead>("/api/v1/users/me/profile-completeness");
  return response.data;
}

export async function fetchGithubScan(): Promise<GitHubScanResponse> {
  const response = await api.get<GitHubScanResponse>("/api/v1/users/me/github-scan");
  return response.data;
}
