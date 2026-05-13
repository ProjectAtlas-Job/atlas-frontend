import * as React from "react";

import { cn } from "@/lib/utils";

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition-colors focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select }
