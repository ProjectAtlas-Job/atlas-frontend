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

const schema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required."),
    email: z.email("Enter a valid email address.").trim(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setRegisteredEmail(null);
    setErrorMessage(null);

    try {
      await api.post("/api/v1/auth/register", {
        full_name: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      setRegisteredEmail(values.email.trim().toLowerCase());
      form.reset();
    } catch (error: unknown) {
      const status =
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 409) {
        setErrorMessage("An account with that email already exists.");
        return;
      }
      setErrorMessage(getApiErrorMessage(error, "Unable to create your account right now."));
    }
  });

  return (
    <AuthShell
      badge="Sprint 1 Auth"
      title="Create your Project Atlas account"
      description="Registration writes the user record and default user settings in one transaction, then sends the verification email needed before the first login."
      sideNote="This flow intentionally stops after registration. The next step is email verification, not an automatic sign-in."
      footer={
        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-medium text-slate-950 transition-colors hover:text-slate-700" href="/login">
            Log in
          </Link>
        </p>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">New Account</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Create account</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Start your Project Atlas profile.</p>
      </div>
      <div className="mt-8">
          <Form {...form}>
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Chaitanya Bansal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input autoComplete="new-password" placeholder="Minimum 8 characters" type="password" {...field} />
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
                        <Input autoComplete="new-password" placeholder="Repeat password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {registeredEmail ? (
                <FormAlert tone="success">
                  Check your inbox at {registeredEmail}. Verify your email before logging in.
                </FormAlert>
              ) : null}
              {errorMessage ? <FormAlert tone="error">{errorMessage}</FormAlert> : null}
              <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? "Creating account..." : "Create account"}
              </Button>
              {registeredEmail ? (
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}>Open verification page</Link>
                </Button>
              ) : null}
            </form>
          </Form>
      </div>
    </AuthShell>
  );
}
