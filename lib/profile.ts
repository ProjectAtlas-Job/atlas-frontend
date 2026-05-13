"use client";

import { api } from "@/lib/api";
import type { ProfileCompletenessRead, UserRead, UserUpdatePayload } from "@/lib/types";

export const currentUserQueryKey = ["current-user"];
export const profileCompletenessQueryKey = ["profile-completeness"];

export async function fetchCurrentUser() {
  const response = await api.get<UserRead>("/api/v1/users/me");
  return response.data;
}

export async function updateCurrentUser(payload: UserUpdatePayload) {
  const response = await api.put<UserRead>("/api/v1/users/me", payload);
  return response.data;
}

export async function fetchProfileCompleteness() {
  const response = await api.get<ProfileCompletenessRead>("/api/v1/users/me/profile-completeness");
  return response.data;
}
