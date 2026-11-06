"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FormState } from "../model";

export function Field({
  name,
  label,
  hint,
  state,
  ...inputProps
}: Omit<React.ComponentProps<"input">, "name"> & {
  name: string;
  label: string;
  hint?: string;
  state: FormState;
}) {
  const error = state.status === "error" ? state.fieldErrors?.[name] : undefined;
  const id = `field-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <Input
        id={id}
        name={name}
        className="h-10 bg-background"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-error`} className="m-0 text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="m-0 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Shows the form's outcome. Errors tied to one field appear beside that field,
 * so this only repeats the message when no field is showing it.
 */
export function FormMessage({ state, className }: { state: FormState; className?: string }) {
  if (state.status === "idle") return null;

  if (state.status === "error") {
    if (Object.keys(state.fieldErrors ?? {}).length) return null;

    return (
      <p
        role="alert"
        className={cn("m-0 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive", className)}
      >
        {state.message}
      </p>
    );
  }

  return (
    <p
      role="status"
      className={cn("m-0 rounded-xl bg-[var(--brand-50)] px-3.5 py-2.5 text-sm text-foreground", className)}
    >
      {state.message}
    </p>
  );
}

export function SubmitButton({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      aria-busy={pending}
      className={cn("h-10 px-5", className)}
    >
      {children}
    </Button>
  );
}
