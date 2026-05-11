"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120, "Keep your name under 120 characters."),
  email: z.email("Enter a valid email address.").trim(),
  subject: z.string().trim().min(1, "Subject is required.").max(180, "Keep the subject under 180 characters."),
  message: z
    .string()
    .trim()
    .min(10, "Please share a little more detail.")
    .max(4000, "Keep your message under 4000 characters."),
});

type FormValues = z.infer<typeof schema>;

export default function ContactSupportPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await api.post("/api/v1/auth/contact-support", {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        subject: values.subject.trim(),
        message: values.message.trim(),
      });
      setSuccessMessage("Your message was sent to support. We will follow up at the email address you provided.");
      form.reset();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to send your message right now."));
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_34%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-10">
      <Card className="w-full max-w-2xl rounded-[2rem] border-0 shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
        <CardHeader>
          <CardTitle className="text-3xl">Contact support</CardTitle>
          <CardDescription>Send a message if you are blocked on verification, password recovery, or account access.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
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
              </div>
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="What do you need help with?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Share the issue, what you expected, and what happened instead." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {successMessage ? <FormAlert tone="success">{successMessage}</FormAlert> : null}
              {errorMessage ? <FormAlert tone="error">{errorMessage}</FormAlert> : null}
              <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? "Sending..." : "Send message"}
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-sm text-slate-600">
            Back to{" "}
            <Link className="font-medium text-slate-950" href="/login">
              login
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
