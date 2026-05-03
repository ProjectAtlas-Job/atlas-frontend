"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
});

type FormValues = z.infer<typeof schema>;

export default function ResendVerificationPage() {
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
      await api.post("/api/v1/auth/resend-verification", { email: values.email });
      setMessage("If your account exists and is not yet verified, a new verification email has been sent.");
    } catch (error: unknown) {
      const status = typeof error === "object" && error && "response" in error ? (error as { response?: { status?: number } }).response?.status : undefined;
      if (status === 400) {
        setErrorMessage("This email is already verified.");
        return;
      }
      setErrorMessage("Unable to resend verification email right now.");
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-10">
      <Card className="w-full max-w-md rounded-[2rem] border-0 shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
        <CardHeader>
          <CardTitle className="text-3xl">Resend verification</CardTitle>
          <CardDescription>Request a fresh verification email.</CardDescription>
        </CardHeader>
        <CardContent>
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
              {message ? <p className="text-sm font-medium text-slate-700">{message}</p> : null}
              {errorMessage ? <p className="text-sm font-medium text-destructive">{errorMessage}</p> : null}
              <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? "Sending..." : "Resend verification"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
