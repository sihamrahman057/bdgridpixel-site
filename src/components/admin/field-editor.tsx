"use client";

import { useActionState } from "react";
import { createFieldAction, deleteFieldAction, moveFieldAction, updateFieldAction } from "@/lib/actions";
import { FIELD_TYPE_LABELS, FIELD_TYPES, type FormField, type FormState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const empty: FormState = {};

export function FieldEditor({ fields, canEdit }: { fields: FormField[]; canEdit: boolean }) {
  if (!canEdit) {
    return <p className="text-sm text-muted-foreground">You can view the form, but only an owner or manager can change it.</p>;
  }
  return (
    <div className="grid gap-4">
      <AddField />
      {fields.map((field, index) => (
        <FieldCard key={field.id} field={field} isFirst={index === 0} isLast={index === fields.length - 1} />
      ))}
    </div>
  );
}

function AddField() {
  const [state, action, pending] = useActionState(createFieldAction, empty);
  return (
    <form action={action} className="grid gap-3 rounded-xl border border-border bg-card p-4">
      <h2 className="font-display text-2xl">Add a field</h2>
      <FieldInputs />
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-primary" role="status">{state.ok}</p> : null}
      <Button type="submit" className="h-10 w-fit" disabled={pending}>{pending ? "Adding…" : "Add field"}</Button>
    </form>
  );
}

function FieldCard({ field, isFirst, isLast }: { field: FormField; isFirst: boolean; isLast: boolean }) {
  const [state, action, pending] = useActionState(updateFieldAction, empty);
  const [removeState, removeAction, removing] = useActionState(deleteFieldAction, empty);
  return (
    <article className="grid gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl">{field.label}</h2>
        <form action={moveFieldAction} className="flex gap-2">
          <input type="hidden" name="id" value={field.id} />
          <Button type="submit" name="direction" value="up" variant="outline" size="sm" disabled={isFirst}>Move up</Button>
          <Button type="submit" name="direction" value="down" variant="outline" size="sm" disabled={isLast}>Move down</Button>
        </form>
      </div>
      <form action={action} className="grid gap-3">
        <input type="hidden" name="id" value={field.id} />
        <FieldInputs field={field} />
        {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-primary" role="status">{state.ok}</p> : null}
        <Button type="submit" variant="secondary" className="h-10 w-fit" disabled={pending}>{pending ? "Saving…" : "Save field"}</Button>
      </form>
      <form action={removeAction}>
        <input type="hidden" name="id" value={field.id} />
        {removeState.error ? <p className="mb-2 text-sm text-destructive" role="alert">{removeState.error}</p> : null}
        <Button type="submit" variant="destructive" size="sm" disabled={removing}>{removing ? "Removing…" : "Remove field"}</Button>
      </form>
    </article>
  );
}

function FieldInputs({ field }: { field?: FormField }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`${field?.id ?? "new"}-label`}>Label</Label>
          <Input id={`${field?.id ?? "new"}-label`} name="label" defaultValue={field?.label ?? ""} required className="h-10" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${field?.id ?? "new"}-type`}>Type</Label>
          <select
            id={`${field?.id ?? "new"}-type`}
            name="fieldType"
            defaultValue={field?.fieldType ?? "text"}
            className="h-10 rounded-lg border border-input bg-input/30 px-3 text-sm"
          >
            {FIELD_TYPES.map((type) => (
              <option key={type} value={type}>{FIELD_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${field?.id ?? "new"}-placeholder`}>Placeholder</Label>
        <Input id={`${field?.id ?? "new"}-placeholder`} name="placeholder" defaultValue={field?.placeholder ?? ""} className="h-10" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${field?.id ?? "new"}-options`}>Dropdown options</Label>
        <Textarea id={`${field?.id ?? "new"}-options`} name="options" defaultValue={field?.options.join("\n") ?? ""} placeholder={"One option per line\nGuest\nSpeaker"} />
        <p className="text-xs text-muted-foreground">Used only when the type is a dropdown.</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="required" value="yes" defaultChecked={field?.required ?? false} className="size-4 accent-primary" />
        Required
      </label>
    </>
  );
}
