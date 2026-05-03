"use client";

import axios from "axios";

import { useAuthStore } from "@/stores/auth.store";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    const status = error.response?.status as number | undefined;

    if (status === 401 && originalRequest && !originalRequest._retry && originalRequest.url !== "/api/auth/refresh") {
      originalRequest._retry = true;
      try {
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!refreshResponse.ok) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        const refreshData = (await refreshResponse.json()) as { access_token: string };
        useAuthStore.getState().setToken(refreshData.access_token);
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${refreshData.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
