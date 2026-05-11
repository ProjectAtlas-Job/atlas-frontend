"use client";

import { Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!token) {
      form.setError("newPassword", { message: "Missing reset token." });
      return;
    }

    try {
      await api.post("/api/v1/auth/reset-password", {
        token,
        new_password: values.newPassword,
      });
      setSuccessMessage("Password updated. Redirecting you to login...");
      window.setTimeout(() => router.push("/login"), 900);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to reset password with this link."));
    }
  });

  return (
    <AuthShell
      badge="Account Recovery"
      title="Choose a new password"
      description="The backend accepts a signed reset token, updates the stored password hash, and clears the reset fields in one pass."
      footer={
        <p className="text-sm text-slate-600">
          Need a new reset link?{" "}
          <Link className="font-medium text-slate-950 transition-colors hover:text-slate-700" href="/forgot-password">
            Request one again
          </Link>
          .
        </p>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Password Update</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Reset password</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Choose a new password for your account.</p>
      </div>
      <div className="mt-8">
          <Form {...form}>
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input autoComplete="new-password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input autoComplete="new-password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {successMessage ? <FormAlert tone="success">{successMessage}</FormAlert> : null}
              {errorMessage ? <FormAlert tone="error">{errorMessage}</FormAlert> : null}
              <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          </Form>
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading...</main>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
