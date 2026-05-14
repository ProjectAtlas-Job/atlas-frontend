export type UserRead = {
  id: number;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_email_verified: boolean;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_username: string | null;
  portfolio_url: string | null;
  experience_level: string | null;
  target_work_types: string[] | null;
  target_roles: string[] | null;
  target_locations: string[] | null;
  skills: string[] | null;
  github_metadata: Record<string, unknown> | unknown[] | null;
  has_completed_onboarding: boolean;
  profile_completeness: number;
  created_at: string;
  updated_at: string | null;
};

export type UserUpdatePayload = {
  full_name?: string | null;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  experience_level?: "fresher" | "junior" | "mid" | "senior" | "lead" | null;
  target_work_types?: ("full_time" | "part_time" | "internship" | "contract" | "freelance")[] | null;
  target_roles?: string[] | null;
  target_locations?: string[] | null;
  skills?: string[] | null;
};

export type ProfileCompletenessMissingField = {
  field: string;
  points: number;
  action_url: string;
};

export type ProfileCompletenessRead = {
  score: number;
  missing: ProfileCompletenessMissingField[];
};

export type TokenResponse = {
  access_token: string;
  token_type?: string;
};

export type JobWorkType = "full_time" | "part_time" | "internship" | "contract" | "freelance";

export type JobPostingRead = {
  id: number;
  company_id: number | null;
  company_name_raw: string;
  title: string;
  description: string;
  location: string | null;
  work_type: string[];
  salary_min: number | null;
  salary_max: number | null;
  experience_required: string | null;
  skills_required: string[];
  source: string;
  source_url: string;
  is_active: boolean;
  posted_at: string | null;
  scraped_at: string;
};

export type JobListResponse = {
  total: number;
  items: JobPostingRead[];
  skip: number;
  limit: number;
};
