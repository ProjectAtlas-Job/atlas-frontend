"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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

const schema = z.object({
  email: z.email("Enter a valid email address.").trim(),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage(null);
    setErrorMessage(null);

    try {
      await api.post("/api/v1/auth/forgot-password", { email: values.email.trim().toLowerCase() });
      setMessage("If that email is registered, you will receive a reset link.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to send a reset link right now."));
    }
  });

  return (
    <AuthShell
      badge="Account Recovery"
      title="Reset access without exposing account state"
      description="This page preserves the backend rule from Sprint 1: it always returns the same success message so the app never leaks whether an email exists."
      footer={
        <p className="text-sm text-slate-600">
          Back to{" "}
          <Link className="font-medium text-slate-950 transition-colors hover:text-slate-700" href="/login">
            login
          </Link>
          .
        </p>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Password Reset</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Forgot password</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">We will send you a reset link if the account exists.</p>
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
              {message ? <FormAlert tone="success">{message}</FormAlert> : null}
              {errorMessage ? <FormAlert tone="error">{errorMessage}</FormAlert> : null}
              <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          </Form>
      </div>
    </AuthShell>
  );
}
