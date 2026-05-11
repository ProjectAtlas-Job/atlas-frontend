"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { AuthShell } from "@/components/auth/AuthShell";
import type { TokenResponse, UserRead } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth.store";

const schema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  password: z.string().min(1, "Password is required."),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.set("username", values.email.trim().toLowerCase());
      params.set("password", values.password);

      const tokenResponse = await api.post<TokenResponse>("/api/v1/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      setToken(tokenResponse.data.access_token);

      const userResponse = await api.get<UserRead>("/api/v1/auth/me");
      setUser(userResponse.data);
      router.push("/dashboard");
    } catch (error: unknown) {
      const status =
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 403) {
        setErrorMessage("Email not verified.");
        return;
      }
      if (status === 401) {
        setErrorMessage("Invalid email or password.");
        return;
      }
      setErrorMessage(getApiErrorMessage(error, "Unable to sign in right now."));
    }
  });

  return (
    <AuthShell
      badge="Sprint 1 Auth"
      title="Sign in to Project Atlas"
      description="Use the verified account linked to your dashboard. The frontend keeps access tokens in memory and restores sessions through the server-side refresh route."
      sideNote="If login fails with a 403, the backend is rejecting the session because the email still needs verification or the account is inactive."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <Link className="transition-colors hover:text-slate-950" href="/forgot-password">
            Forgot password?
          </Link>
          <Link className="transition-colors hover:text-slate-950" href="/register">
            Create account
          </Link>
          <Link
            className="transition-colors hover:text-slate-950"
            href={`/verify-email?email=${encodeURIComponent(form.watch("email") ?? "")}`}
          >
            Verify email
          </Link>
        </div>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Account Access</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Log in</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use your Project Atlas account to continue.</p>
      </div>
      <div className="mt-8">
          <Form {...form}>
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input autoComplete="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input autoComplete="current-password" placeholder="Your password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {errorMessage ? <FormAlert tone="error">{errorMessage}</FormAlert> : null}
              <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? "Signing in..." : "Log in"}
              </Button>
            </form>
          </Form>
      </div>
    </AuthShell>
  );
}
