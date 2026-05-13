"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyboardEvent, useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/ToastProvider";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  currentUserQueryKey,
  fetchCurrentUser,
  fetchProfileCompleteness,
  profileCompletenessQueryKey,
  updateCurrentUser,
} from "@/lib/profile";
import type { UserRead, UserUpdatePayload } from "@/lib/types";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

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

type ProfileFormState = {
  full_name: string;
  phone: string;
  location: string;
  bio: string;
  linkedin_url: string;
  portfolio_url: string;
  experience_level: string;
  target_work_types: string[];
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
    experience_level: user.experience_level ?? "",
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
    experience_level: form.experience_level ? (form.experience_level as UserUpdatePayload["experience_level"]) : undefined,
    target_work_types: form.target_work_types.length > 0 ? (form.target_work_types as NonNullable<UserUpdatePayload["target_work_types"]>) : undefined,
    target_roles: form.target_roles.length > 0 ? form.target_roles : undefined,
    target_locations: form.target_locations.length > 0 ? form.target_locations : undefined,
    skills: form.skills.length > 0 ? form.skills : undefined,
  };
}

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function TagInput({
  id,
  label,
  helper,
  tags,
  setTags,
  limit,
  countLabel,
}: {
  id: string;
  label: string;
  helper: string;
  tags: string[];
  setTags: (updater: (current: string[]) => string[]) => void;
  limit?: number;
  countLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  const hasReachedLimit = limit !== undefined && tags.length >= limit;

  const addTag = () => {
    const normalized = normalizeTag(draft);
    if (!normalized) {
      setDraft("");
      return;
    }
    if (hasReachedLimit || tags.includes(normalized)) {
      setDraft("");
      return;
    }
    setTags((current) => [...current, normalized]);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    addTag();
  };

  return (
    <div className="space-y-3" id={id}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`${id}-input`}>{label}</Label>
        {countLabel ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{countLabel}</span>
        ) : null}
      </div>
      <Input
        id={`${id}-input`}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type and press Enter"
        value={draft}
      />
      <p className="text-sm text-slate-500">{helper}</p>
      {limit !== undefined && hasReachedLimit ? (
        <FormAlert tone="info">You can add up to {limit} entries here.</FormAlert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
            key={tag}
            onClick={() => setTags((current) => current.filter((item) => item !== tag))}
            type="button"
          >
            {tag} x
          </button>
        ))}
      </div>
    </div>
  );
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

  useEffect(() => {
    if (currentUserQuery.data) {
      setForm(toFormState(currentUserQuery.data));
      setUser(currentUserQuery.data);
    }
  }, [currentUserQuery.data, setUser]);

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
      }
      setErrorMessage(getApiErrorMessage(error, "Unable to save profile updates."));
      showToast("Profile update failed. Your previous values were restored.", "error");
    },
    onSuccess: async (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      setUser(user);
      setForm(toFormState(user));
      await queryClient.invalidateQueries({ queryKey: profileCompletenessQueryKey });
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
          <CardDescription>Changes save back to `PUT /api/v1/users/me` and refresh profile completeness immediately.</CardDescription>
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
                onChange={(event) => updateField("experience_level", event.target.value)}
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
            countLabel={`${form.target_roles.length}/10 roles`}
            helper="Add up to ten target roles."
            id="target-roles"
            label="Target roles"
            limit={10}
            setTags={(updater) => updateField("target_roles", updater(form.target_roles))}
            tags={form.target_roles}
          />

          <TagInput
            helper="Add as many skills as you need. Backend normalization will lowercase them."
            id="skills"
            label="Skills"
            setTags={(updater) => updateField("skills", updater(form.skills))}
            tags={form.skills}
          />

          <TagInput
            helper="Track locations you are open to."
            id="target-locations"
            label="Target locations"
            setTags={(updater) => updateField("target_locations", updater(form.target_locations))}
            tags={form.target_locations}
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
    </div>
  );
}
