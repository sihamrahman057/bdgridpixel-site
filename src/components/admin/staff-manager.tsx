"use client";

import { useActionState } from "react";
import { inviteStaffAction, removeStaffAction } from "@/lib/actions";
import type { FormState, Staff } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty: FormState = {};

export function StaffManager({ staff, currentId }: { staff: Staff[]; currentId: string }) {
  const [state, action, pending] = useActionState(inviteStaffAction, empty);
  return (
    <div className="grid gap-4">
      <form action={action} className="grid gap-3 rounded-xl border border-border bg-card p-4">
        <h2 className="font-display text-2xl">Give someone access</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="staff-name">Name</Label>
            <Input id="staff-name" name="name" required className="h-10" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="staff-email">Email</Label>
            <Input id="staff-email" name="email" type="email" required className="h-10" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="staff-password">Temporary password</Label>
            <Input id="staff-password" name="password" type="text" required minLength={8} autoComplete="off" className="h-10" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="staff-role">Access</Label>
            <select id="staff-role" name="role" defaultValue="assistant" className="h-10 rounded-lg border border-input bg-input/30 px-3 text-sm">
              <option value="manager">Manager — edit the page and remove a guest</option>
              <option value="assistant">Assistant — view and export the list</option>
            </select>
          </div>
        </div>
        {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-primary" role="status">{state.ok}</p> : null}
        <Button type="submit" className="h-10 w-fit" disabled={pending}>{pending ? "Saving…" : "Save access"}</Button>
      </form>
      <ul className="grid gap-2">
        {staff.map((person) => (
          <li key={person.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{person.name}</p>
              <p className="text-sm text-muted-foreground">{person.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{person.role}</Badge>
              {person.id === currentId ? <span className="text-xs text-muted-foreground">You</span> : null}
              {person.role !== "owner" ? (
                <form action={removeStaffAction}>
                  <input type="hidden" name="id" value={person.id} />
                  <Button type="submit" variant="destructive" size="sm">Remove access</Button>
                </form>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
