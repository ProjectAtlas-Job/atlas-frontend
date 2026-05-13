"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { TagInput } from "@/components/profile/TagInput";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { getPublicApiBaseUrl } from "@/lib/env";
import {
  currentUserQueryKey,
  fetchCurrentUser,
  fetchGithubScan,
  fetchProfileCompleteness,
  githubScanQueryKey,
  profileCompletenessQueryKey,
  updateCurrentUser,
} from "@/lib/profile";
import type { UserRead, UserUpdatePayload } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

const experienceOptions = [
  { label: "Fresher", value: "fresher" },
  { label: "Junior", value: "junior" },
  { label: "Mid", value: "mid" },
  { label: "Senior", value: "senior" },
  { label: "Lead", value: "lead" },
] as const;

const workTypeOptions = [
  { label: "Full Time", value: "full_time" },
  { label: "Part Time", value: "part_time" },
  { label: "Internship", value: "internship" },
  { label: "Contract", value: "contract" },
  { label: "Freelance", value: "freelance" },
] as const;

type WorkType = NonNullable<UserUpdatePayload["target_work_types"]>[number];

type ProfileFormState = {
  full_name: string;
  phone: string;
  location: string;
  bio: string;
  linkedin_url: string;
  portfolio_url: string;
  experience_level: "" | "fresher" | "junior" | "mid" | "senior" | "lead";
  target_work_types: WorkType[];
  target_roles: string[];
  target_locations: string[];
  skills: string[];
};

function toFormState(user: UserRead): ProfileFormState {
  return {
    full_name: user.full_name ?? "",
    phone: user.phone ?? "",
    location: user.location ?? "",
    bio: user.bio ?? "",
    linkedin_url: user.linkedin_url ?? "",
    portfolio_url: user.portfolio_url ?? "",
    experience_level:
      user.experience_level === "fresher" ||
      user.experience_level === "junior" ||
      user.experience_level === "mid" ||
      user.experience_level === "senior" ||
      user.experience_level === "lead"
        ? user.experience_level
        : "",
    target_work_types: user.target_work_types ?? [],
    target_roles: user.target_roles ?? [],
    target_locations: user.target_locations ?? [],
    skills: user.skills ?? [],
  };
}

function toPayload(form: ProfileFormState): UserUpdatePayload {
  return {
    full_name: form.full_name.trim() || undefined,
    phone: form.phone.trim() || undefined,
    location: form.location.trim() || undefined,
    bio: form.bio.trim() || undefined,
    linkedin_url: form.linkedin_url.trim() || undefined,
    portfolio_url: form.portfolio_url.trim() || undefined,
    experience_level: form.experience_level || undefined,
    target_work_types: form.target_work_types.length > 0 ? form.target_work_types : undefined,
    target_roles: form.target_roles.length > 0 ? form.target_roles : undefined,
    target_locations: form.target_locations.length > 0 ? form.target_locations : undefined,
    skills: form.skills.length > 0 ? form.skills : undefined,
  };
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);
  const { showToast } = useToast();
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentUserQuery = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
  });
  const completenessQuery = useQuery({
    queryKey: profileCompletenessQueryKey,
    queryFn: fetchProfileCompleteness,
  });
  const githubScanQuery = useQuery({
    queryKey: githubScanQueryKey,
    queryFn: fetchGithubScan,
  });

  useEffect(() => {
    if (!currentUserQuery.data) {
      return;
    }
    setForm(toFormState(currentUserQuery.data));
    setUser(currentUserQuery.data);
  }, [currentUserQuery.data, setUser]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("github") === "connected") {
      showToast("GitHub connected. Repo scan metadata is now available on your profile.", "success");
      void queryClient.invalidateQueries({ queryKey: githubScanQueryKey });
      void queryClient.invalidateQueries({ queryKey: profileCompletenessQueryKey });
    }
  }, [queryClient, showToast]);

  const githubConnectUrl = useMemo(() => `${getPublicApiBaseUrl()}/api/v1/auth/github/connect`, []);

  const updateField = <Key extends keyof ProfileFormState,>(field: Key, value: ProfileFormState[Key]) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const mutation = useMutation({
    mutationFn: async (payload: UserUpdatePayload) => updateCurrentUser(payload),
    onMutate: async (payload) => {
      setErrorMessage(null);
      await queryClient.cancelQueries({ queryKey: currentUserQueryKey });
      const previousUser = queryClient.getQueryData<UserRead>(currentUserQueryKey) ?? authUser;

      if (previousUser) {
        const optimisticUser: UserRead = {
          ...previousUser,
          ...payload,
          target_work_types: payload.target_work_types ?? previousUser.target_work_types,
          target_roles: payload.target_roles ?? previousUser.target_roles,
          target_locations: payload.target_locations ?? previousUser.target_locations,
          skills: payload.skills ?? previousUser.skills,
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData(currentUserQueryKey, optimisticUser);
        setUser(optimisticUser);
      }

      return { previousUser };
    },
    onError: (error: unknown, _payload, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(currentUserQueryKey, context.previousUser);
        setUser(context.previousUser);
        setForm(toFormState(context.previousUser));
      }
      setErrorMessage(getApiErrorMessage(error, "Unable to save profile updates."));
      showToast("Profile update failed. Your previous values were restored.", "error");
    },
    onSuccess: async (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      setUser(user);
      setForm(toFormState(user));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileCompletenessQueryKey }),
        queryClient.invalidateQueries({ queryKey: githubScanQueryKey }),
      ]);
      const completeness = await queryClient.fetchQuery({
        queryKey: profileCompletenessQueryKey,
        queryFn: fetchProfileCompleteness,
      });
      setUser({ ...user, profile_completeness: completeness.score });
      showToast("Profile saved successfully.", "success");
    },
  });

  if (currentUserQuery.isLoading || form === null) {
    return <p className="text-sm text-slate-600">Loading your profile...</p>;
  }

  if (currentUserQuery.isError) {
    return <FormAlert tone="error">Unable to load your profile right now.</FormAlert>;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sprint 2</p>
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Profile editor</h2>
        <p className="text-sm text-slate-600">Complete your public profile fields and keep your readiness score current.</p>
      </section>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Edit your profile</CardTitle>
          <CardDescription>
            Changes save back to `PUT /api/v1/users/me` and refresh profile completeness immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMessage ? <FormAlert tone="error">{errorMessage}</FormAlert> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2" id="full-name">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" onChange={(event) => updateField("full_name", event.target.value)} value={form.full_name} />
            </div>
            <div className="space-y-2" id="phone">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" onChange={(event) => updateField("phone", event.target.value)} value={form.phone} />
            </div>
            <div className="space-y-2" id="location">
              <Label htmlFor="location">Location</Label>
              <Input id="location" onChange={(event) => updateField("location", event.target.value)} value={form.location} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience_level">Experience level</Label>
              <Select
                id="experience_level"
                onChange={(event) =>
                  updateField("experience_level", event.target.value as ProfileFormState["experience_level"])
                }
                value={form.experience_level}
              >
                <option value="">Select a level</option>
                {experienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2" id="bio">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" onChange={(event) => updateField("bio", event.target.value)} value={form.bio} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2" id="linkedin">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                onChange={(event) => updateField("linkedin_url", event.target.value)}
                value={form.linkedin_url}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio_url">Portfolio URL</Label>
              <Input
                id="portfolio_url"
                onChange={(event) => updateField("portfolio_url", event.target.value)}
                value={form.portfolio_url}
              />
            </div>
          </div>

          <div className="space-y-3" id="target-work-types">
            <Label>Target work types</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {workTypeOptions.map((option) => {
                const checked = form.target_work_types.includes(option.value);

                return (
                  <label
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors",
                      checked ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-700",
                    )}
                    key={option.value}
                  >
                    <input
                      checked={checked}
                      className="h-4 w-4"
                      onChange={(event) =>
                        updateField(
                          "target_work_types",
                          event.target.checked
                            ? [...form.target_work_types, option.value]
                            : form.target_work_types.filter((item) => item !== option.value),
                        )
                      }
                      type="checkbox"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </div>

          <TagInput
            helperText="Type a role and press Enter. Maximum 10 roles."
            id="target-roles"
            label="Target roles"
            maxItems={10}
            onChange={(target_roles) => updateField("target_roles", target_roles)}
            placeholder="Add a target role"
            values={form.target_roles}
          />

          <TagInput
            helperText="Add as many skills as you need. Backend normalization will lowercase them."
            id="skills"
            label="Skills"
            onChange={(skills) => updateField("skills", skills)}
            placeholder="Add a skill"
            values={form.skills}
          />

          <TagInput
            helperText="Track locations you are open to."
            id="target-locations"
            label="Target locations"
            onChange={(target_locations) => updateField("target_locations", target_locations)}
            placeholder="Add a location"
            values={form.target_locations}
          />

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
            <div>
              <p className="text-sm font-medium text-slate-950">Save profile changes</p>
              <p className="text-sm text-slate-600">We’ll refresh your completeness score right after the update finishes.</p>
            </div>
            <Button disabled={mutation.isPending} onClick={() => mutation.mutate(toPayload(form))} type="button">
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Profile completeness</CardTitle>
            <CardDescription>These missing actions map directly to the Sprint 2 completeness score.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current score</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                {completenessQuery.data?.score ?? currentUserQuery.data.profile_completeness}/100
              </p>
            </div>
            {completenessQuery.data && completenessQuery.data.missing.length > 0 ? (
              <div className="space-y-3">
                {completenessQuery.data.missing.map((item) => (
                  <a
                    className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
                    href={item.action_url}
                    key={item.field}
                  >
                    <span className="font-medium capitalize text-slate-950">{item.field.replaceAll("_", " ")}</span>
                    <span className="ml-2 text-slate-500">+{item.points} points</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">Your Sprint 2 profile fields are complete.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle>GitHub connect</CardTitle>
              <CardDescription>
                Connect GitHub to scan recent repositories and store languages, topics, and top repos in your profile metadata.
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <a href={githubConnectUrl}>
                {githubScanQuery.data?.status === "connected" ? "Reconnect GitHub" : "Connect GitHub"}
              </a>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {githubScanQuery.isLoading ? <p className="text-sm text-slate-600">Loading GitHub scan status...</p> : null}
            {githubScanQuery.data?.status === "not_connected" ? (
              <p className="text-sm text-slate-600">GitHub is not connected yet.</p>
            ) : null}
            {githubScanQuery.data?.status === "connected" ? (
              <>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-medium text-slate-950">@{githubScanQuery.data.github_username ?? "unknown"}</p>
                  <p className="mt-1 text-sm text-slate-600">Total stars: {githubScanQuery.data.metadata.total_stars}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Languages</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(githubScanQuery.data.metadata.languages).map(([language, count]) => (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700" key={language}>
                        {language} · {count}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Topics</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {githubScanQuery.data.metadata.topics.length > 0 ? (
                      githubScanQuery.data.metadata.topics.map((topic) => (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700" key={topic}>
                          {topic}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No topics found.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top repositories</p>
                  {githubScanQuery.data.metadata.top_repos.map((repo) => (
                    <div className="rounded-2xl border border-slate-200 px-4 py-3" key={repo.name}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-slate-950">{repo.name}</p>
                        <span className="text-sm text-slate-500">{repo.stars} stars</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{repo.description ?? "No description provided."}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{repo.language ?? "Unknown language"}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
