"use client";

import { useActionState } from "react";
import { updateHeroAction } from "@/lib/actions";
import type { EventSettings, FormState } from "@/lib/types";
import { formatBangladeshStamp, toBangladeshLocalInput } from "@/lib/time-bd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty: FormState = {};

export function EventSetup({ settings, canEdit }: { settings: EventSettings; canEdit: boolean }) {
  const [state, action, pending] = useActionState(updateHeroAction, empty);
  if (!canEdit) {
    return (
      <p className="text-sm text-muted-foreground">
        Only an owner or manager can set the event and the Bangladesh timer.
      </p>
    );
  }

  return (
    <form action={action} className="grid max-w-2xl gap-4 rounded-xl border border-border bg-card p-4" key={settings.updatedAt}>
      <div>
        <h2 className="font-display text-2xl">Event and timer</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the event guests see, choose which fields to collect below, and pick when registration
          turns off automatically in Bangladesh time (Asia/Dhaka, UTC+6).
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="event-name" name="eventName" label="Event name" defaultValue={settings.eventName} />
        <Field id="event-status" name="eventStatus" label="Status text" defaultValue={settings.eventStatus} hint='Keep the word "open" while registration should stay open before the timer ends.' />
        <Field id="event-date" name="eventDate" label="Date readout" defaultValue={settings.eventDate} />
        <Field id="event-place" name="eventPlace" label="Place readout" defaultValue={settings.eventPlace} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="closes-at">Registration closes (Bangladesh time)</Label>
        <Input
          id="closes-at"
          name="closesAtLocal"
          type="datetime-local"
          defaultValue={toBangladeshLocalInput(settings.registrationClosesAt)}
          className="h-10"
        />
        <p className="text-xs text-muted-foreground">
          Guests cannot register after this moment. Times are Bangladesh Standard Time.
          {settings.registrationClosesAt
            ? ` Current close: ${formatBangladeshStamp(settings.registrationClosesAt)}.`
            : " No timer is set yet."}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="clearTimer" value="yes" className="size-4 accent-primary" />
        Clear the timer (registration follows the status text only)
      </label>
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-primary" role="status">{state.ok}</p> : null}
      <Button type="submit" className="h-10 w-fit" disabled={pending}>
        {pending ? "Saving…" : "Save event and timer"}
      </Button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  defaultValue,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} defaultValue={defaultValue} required className="h-10" />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
