"use client";

import { useActionState } from "react";
import { clearRegistrationsAction } from "@/lib/actions";
import type { FormState } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

const empty: FormState = {};

export function ClearDialog() {
  const [state, action, pending] = useActionState(clearRegistrationsAction, empty);

  return (
    <details className="justify-self-start">
      <summary className={cn(buttonVariants({ variant: "destructive" }), "h-9 cursor-pointer list-none")}>
        Clear all registrations
      </summary>
      <form action={action} className="mt-3 grid w-full max-w-sm gap-3 rounded-xl border border-destructive/40 bg-card p-4">
        <div>
          <p className="font-medium">Remove every registration</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This deletes the guest list for the finished event. It cannot be undone. Type CLEAR to confirm.
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirm-clear">Confirmation</Label>
          <Input id="confirm-clear" name="confirm" autoComplete="off" className="h-10" />
        </div>
        {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-primary" role="status">{state.ok}</p> : null}
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Removing…" : "Delete every registration"}
        </Button>
      </form>
    </details>
  );
}
