import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FormAlertProps = {
  children: ReactNode;
  tone?: "success" | "error" | "info";
};

const toneClasses: Record<NonNullable<FormAlertProps["tone"]>, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function FormAlert({ children, tone = "info" }: FormAlertProps) {
  return (
    <div
      aria-live="polite"
      className={cn("rounded-2xl border px-4 py-3 text-sm font-medium", toneClasses[tone])}
      role="status"
    >
      {children}
    </div>
  );
}
