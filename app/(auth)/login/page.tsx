"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "@/lib/api";
import type { TokenResponse, UserRead } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth.store";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
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
      params.set("username", values.email);
      params.set("password", values.password);

      const tokenResponse = await api.post<TokenResponse>("/api/v1/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      setToken(tokenResponse.data.access_token);

      const userResponse = await api.get<UserRead>("/api/v1/auth/me");
      setUser(userResponse.data);
      router.push("/dashboard");
    } catch (error: unknown) {
      const status = typeof error === "object" && error && "response" in error ? (error as { response?: { status?: number } }).response?.status : undefined;
      if (status === 403) {
        setErrorMessage("Email not verified.");
        return;
      }
      if (status === 401) {
        setErrorMessage("Invalid email or password.");
        return;
      }
      setErrorMessage("Unable to sign in right now.");
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_35%),linear-gradient(160deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-10">
      <Card className="w-full max-w-md rounded-[2rem] border-0 shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
        <CardHeader>
          <CardTitle className="text-3xl">Log in</CardTitle>
          <CardDescription>Use your Project Atlas account to continue.</CardDescription>
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
              {errorMessage ? <p className="text-sm font-medium text-destructive">{errorMessage}</p> : null}
              <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? "Signing in..." : "Log in"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
            <Link className="hover:text-slate-950" href="/forgot-password">
              Forgot password?
            </Link>
            <Link className="hover:text-slate-950" href="/register">
              Create account
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
