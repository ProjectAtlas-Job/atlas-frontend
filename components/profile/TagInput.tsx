"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TagInputProps = {
  id: string;
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  maxItems?: number;
  helperText?: string;
};

export function TagInput({ id, label, placeholder, values, onChange, maxItems, helperText }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const trimmedDraft = draft.trim();
  const canAdd = Boolean(trimmedDraft) && (maxItems === undefined || values.length < maxItems);

  function addValue() {
    if (!canAdd) {
      return;
    }

    if (values.includes(trimmedDraft)) {
      setDraft("");
      return;
    }

    onChange([...values, trimmedDraft]);
    setDraft("");
  }

  function removeValue(valueToRemove: string) {
    onChange(values.filter((value) => value !== valueToRemove));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700" htmlFor={id}>
          {label}
        </label>
        {maxItems !== undefined ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            {values.length}/{maxItems}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue();
            }
          }}
          placeholder={placeholder}
          value={draft}
        />
        <Button disabled={!canAdd} onClick={addValue} type="button" variant="outline">
          Add
        </Button>
      </div>

      {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}

      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700",
              "hover:border-slate-300 hover:bg-slate-100",
            )}
            key={value}
            onClick={() => removeValue(value)}
            type="button"
          >
            <span>{value}</span>
            <span className="text-slate-400">×</span>
          </button>
        ))}
        {values.length === 0 ? <p className="text-sm text-slate-500">No entries added yet.</p> : null}
      </div>
    </div>
  );
}
