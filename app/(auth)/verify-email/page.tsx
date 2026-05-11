"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const emailSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
});

const otpSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  otp: z.string().trim().length(6, "Enter the 6-digit code."),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailQuery = searchParams.get("email") ?? "";
  const [linkStatus, setLinkStatus] = useState<"idle" | "loading" | "success" | "error">(token ? "loading" : "idle");
  const [linkMessage, setLinkMessage] = useState<string | null>(token ? "Verifying your email link..." : null);
  const [otpRequestMessage, setOtpRequestMessage] = useState<string | null>(null);
  const [otpRequestError, setOtpRequestError] = useState<string | null>(null);
  const [otpVerifyMessage, setOtpVerifyMessage] = useState<string | null>(null);
  const [otpVerifyError, setOtpVerifyError] = useState<string | null>(null);

  const requestOtpForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: emailQuery },
  });
  const verifyOtpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: emailQuery, otp: "" },
  });

  useEffect(() => {
    requestOtpForm.setValue("email", emailQuery);
    verifyOtpForm.setValue("email", emailQuery);
  }, [emailQuery, requestOtpForm, verifyOtpForm]);

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

  const requestOtp = requestOtpForm.handleSubmit(async (values) => {
    setOtpRequestMessage(null);
    setOtpRequestError(null);

    try {
      await api.post("/api/v1/auth/request-email-otp", {
        email: values.email.trim().toLowerCase(),
      });
      verifyOtpForm.setValue("email", values.email.trim().toLowerCase());
      setOtpRequestMessage("If that account exists and still needs verification, a code is on the way.");
    } catch (error) {
      setOtpRequestError(getApiErrorMessage(error, "Unable to send a verification code right now."));
    }
  });

  const verifyOtp = verifyOtpForm.handleSubmit(async (values) => {
    setOtpVerifyMessage(null);
    setOtpVerifyError(null);

    try {
      await api.post("/api/v1/auth/verify-email-otp", {
        email: values.email.trim().toLowerCase(),
        otp: values.otp.trim(),
      });
      setLinkStatus("success");
      setOtpVerifyMessage("Your email has been verified. You can log in now.");
      verifyOtpForm.reset({ email: values.email.trim().toLowerCase(), otp: "" });
    } catch (error) {
      setOtpVerifyError(getApiErrorMessage(error, "Unable to verify that code right now."));
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.18),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[2rem] border-0 shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
          <CardHeader>
            <CardTitle className="text-3xl">Verify email</CardTitle>
            <CardDescription>Use your email link or request a fresh OTP code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {linkMessage ? <FormAlert tone={linkStatus === "error" ? "error" : linkStatus === "success" ? "success" : "info"}>{linkMessage}</FormAlert> : null}
            {linkStatus === "success" ? (
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/login">Go to login</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/resend-verification">Resend verification email</Link>
                </Button>
              </div>
            ) : null}
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Request a one-time code</h2>
              <p className="mt-1 text-sm text-slate-600">We will email a 6-digit code that expires in 10 minutes.</p>
              <Form {...requestOtpForm}>
                <form className="mt-4 space-y-4" onSubmit={requestOtp}>
                  <FormField
                    control={requestOtpForm.control}
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
                  {otpRequestMessage ? <FormAlert tone="success">{otpRequestMessage}</FormAlert> : null}
                  {otpRequestError ? <FormAlert tone="error">{otpRequestError}</FormAlert> : null}
                  <Button className="w-full sm:w-auto" disabled={requestOtpForm.formState.isSubmitting} type="submit">
                    {requestOtpForm.formState.isSubmitting ? "Sending code..." : "Send verification code"}
                  </Button>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-0 shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
          <CardHeader>
            <CardTitle className="text-3xl">Enter OTP</CardTitle>
            <CardDescription>Already have a code? Confirm it here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...verifyOtpForm}>
              <form className="space-y-5" onSubmit={verifyOtp}>
                <FormField
                  control={verifyOtpForm.control}
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
                  control={verifyOtpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification code</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" maxLength={6} placeholder="123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {otpVerifyMessage ? <FormAlert tone="success">{otpVerifyMessage}</FormAlert> : null}
                {otpVerifyError ? <FormAlert tone="error">{otpVerifyError}</FormAlert> : null}
                <Button className="w-full" disabled={verifyOtpForm.formState.isSubmitting} type="submit">
                  {verifyOtpForm.formState.isSubmitting ? "Verifying..." : "Verify code"}
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-sm text-slate-600">
              Need another link?{" "}
              <Link className="font-medium text-slate-950" href="/resend-verification">
                Resend verification email
              </Link>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Still stuck?{" "}
              <Link className="font-medium text-slate-950" href="/contact-support">
                Contact support
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
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
