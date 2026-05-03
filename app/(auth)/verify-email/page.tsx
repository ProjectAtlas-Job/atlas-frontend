"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        return;
      }

      try {
        await api.post("/api/v1/auth/verify-email", { token });
        setStatus("success");
      } catch {
        setStatus("error");
      }
    }

    void verifyEmail();
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.18),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-10">
      <Card className="w-full max-w-lg rounded-[2rem] border-0 shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
        <CardHeader>
          <CardTitle className="text-3xl">Verify email</CardTitle>
          <CardDescription>Confirm your Project Atlas account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-700">
          {status === "loading" ? <p>Verifying your email...</p> : null}
          {status === "success" ? (
            <p>
              Email verified. You can now{" "}
              <Link className="font-medium text-slate-950" href="/login">
                log in
              </Link>
              .
            </p>
          ) : null}
          {status === "error" ? (
            <p>
              Invalid or expired link.{" "}
              <Link className="font-medium text-slate-950" href="/resend-verification">
                Resend verification
              </Link>
              .
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading...</main>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
