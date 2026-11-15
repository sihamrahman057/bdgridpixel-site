"use client";

import { useActionState } from "react";
import { updateHeroAction } from "@/lib/actions";
import type { EventSettings, FormState } from "@/lib/types";
import { formatBangladeshStamp, toBangladeshLocalInput } from "@/lib/time-bd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty: FormState = {};

export function HeroEditor({ settings, canEdit }: { settings: EventSettings; canEdit: boolean }) {
  const [state, action, pending] = useActionState(updateHeroAction, empty);
  if (!canEdit) return <p className="text-sm text-muted-foreground">Only an owner or manager can change the race HUD readouts.</p>;
  return (
    <form action={action} className="grid max-w-xl gap-4" key={settings.updatedAt}>
      <Field id="event-name" name="eventName" label="Event name" defaultValue={settings.eventName} />
      <Field id="event-date" name="eventDate" label="Date readout" defaultValue={settings.eventDate} />
      <Field id="event-place" name="eventPlace" label="Place readout" defaultValue={settings.eventPlace} />
      <Field
        id="event-status"
        name="eventStatus"
        label="Status"
        defaultValue={settings.eventStatus}
        hint='Include the word open while registration should stay open before the timer ends.'
      />
      <div className="grid gap-1.5">
        <Label htmlFor="hero-closes-at">Registration closes (Bangladesh time)</Label>
        <Input
          id="hero-closes-at"
          name="closesAtLocal"
          type="datetime-local"
          defaultValue={toBangladeshLocalInput(settings.registrationClosesAt)}
          className="h-10"
        />
        <p className="text-xs text-muted-foreground">
          Same timer as on Form. {settings.registrationClosesAt
            ? `Closes ${formatBangladeshStamp(settings.registrationClosesAt)}.`
            : "No timer set."}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="clearTimer" value="yes" className="size-4 accent-primary" />
        Clear the timer
      </label>
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-primary" role="status">{state.ok}</p> : null}
      <Button type="submit" className="h-10 w-fit" disabled={pending}>{pending ? "Saving…" : "Save readouts"}</Button>
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
