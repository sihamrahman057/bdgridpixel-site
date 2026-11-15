"use client";

import { useActionState } from "react";
import { createNotificationAction, deleteNotificationAction } from "@/lib/actions";
import type { FormState, SiteNotification } from "@/lib/types";
import { formatBangladeshStamp } from "@/lib/time-bd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const empty: FormState = {};

export function NotificationManager({
  notifications,
  canEdit,
}: {
  notifications: SiteNotification[];
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState(createNotificationAction, empty);
  if (!canEdit) {
    return <p className="text-sm text-muted-foreground">Only an owner or manager can post notices.</p>;
  }

  return (
    <div className="grid gap-5">
      <form action={action} className="grid max-w-2xl gap-3 rounded-xl border border-border bg-card p-4">
        <h2 className="font-display text-2xl">Post a notice</h2>
        <p className="text-sm text-muted-foreground">Guests see these under the bell on the public page.</p>
        <div className="grid gap-1.5">
          <Label htmlFor="note-title">Title</Label>
          <Input id="note-title" name="title" required className="h-10" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="note-body">Message</Label>
          <Textarea id="note-body" name="body" required className="min-h-24" />
        </div>
        {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-primary" role="status">{state.ok}</p> : null}
        <Button type="submit" className="h-10 w-fit" disabled={pending}>
          {pending ? "Publishing…" : "Publish notice"}
        </Button>
      </form>

      <ul className="grid gap-3">
        {notifications.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            No notices yet.
          </li>
        ) : (
          notifications.map((note) => (
            <li key={note.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="grid gap-1">
                <p className="font-medium">{note.title}</p>
                <p className="text-sm text-muted-foreground">{note.body}</p>
                <p className="text-xs text-muted-foreground">{formatBangladeshStamp(note.createdAt)}</p>
              </div>
              <form action={deleteNotificationAction}>
                <input type="hidden" name="id" value={note.id} />
                <Button type="submit" variant="outline" className="h-9">
                  Remove
                </Button>
              </form>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
