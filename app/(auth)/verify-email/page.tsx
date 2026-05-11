"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailQuery = searchParams.get("email") ?? "";
  const [linkStatus, setLinkStatus] = useState<"idle" | "loading" | "success" | "error">(token ? "loading" : "idle");
  const [linkMessage, setLinkMessage] = useState<string | null>(token ? "Verifying your email link..." : null);

  useEffect(() => {
    async function verifyEmailLink() {
      if (!token) {
        setLinkStatus("idle");
        setLinkMessage(null);
        return;
      }

      setLinkStatus("loading");
      setLinkMessage("Verifying your email link...");

      try {
        await api.post("/api/v1/auth/verify-email", { token });
        setLinkStatus("success");
        setLinkMessage("Email verified. You can now log in.");
      } catch (error) {
        setLinkStatus("error");
        setLinkMessage(getApiErrorMessage(error, "That verification link is invalid or expired."));
      }
    }

    void verifyEmailLink();
  }, [token]);

  return (
    <AuthShell
      badge="Email Verification"
      title="Confirm your email before the first login"
      description="Sprint 1 uses a token-based verification link. If the link is missing or expired, request a fresh verification email and keep the backend auth flow unchanged."
      sideNote={emailQuery ? `Verification is being completed for ${emailQuery}.` : "Open this page from the verification email to complete activation."}
      footer={
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <Link className="font-medium text-slate-950 transition-colors hover:text-slate-700" href="/resend-verification">
            Resend verification email
          </Link>
          <Link className="transition-colors hover:text-slate-950" href="/login">
            Back to login
          </Link>
        </div>
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Account Activation</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Verify email</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Open the link from your inbox to activate the account.</p>
      </div>
      <div className="mt-8 space-y-5">
        {linkMessage ? (
          <FormAlert tone={linkStatus === "error" ? "error" : linkStatus === "success" ? "success" : "info"}>
            {linkMessage}
          </FormAlert>
        ) : null}
        {linkStatus === "success" ? (
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">Go to login</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/forgot-password">Need password help?</Link>
            </Button>
          </div>
        ) : null}
        {linkStatus !== "success" ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-600">
            <p className="font-medium text-slate-950">If the link no longer works</p>
            <p className="mt-2">
              Request a new verification email, then reopen the latest message. No client-side token storage is required for
              this step.
            </p>
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading...</main>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
