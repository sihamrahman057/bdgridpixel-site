"use client";

import { useActionState, useEffect, useState } from "react";
import { registerAction } from "@/lib/actions";
import type { FormField, RegisterResult } from "@/lib/types";
import { isRegistrationOpen } from "@/lib/time-bd";
import { RegistrationCountdown } from "@/components/registration-countdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RegisterForm({
  fields,
  closesAt,
  statusText,
}: {
  fields: FormField[];
  closesAt: string | null;
  statusText: string;
}) {
  const [formKey, setFormKey] = useState(0);
  const [open, setOpen] = useState(() => isRegistrationOpen(closesAt, statusText));

  useEffect(() => {
    const tick = () => setOpen(isRegistrationOpen(closesAt, statusText));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [closesAt, statusText]);

  if (fields.length === 0) {
    return (
      <section id="register" className="mx-auto w-full max-w-xl px-4 pt-10 pb-4">
        <div className="console rounded-3xl p-6 text-center">
          <h2 className="font-display text-3xl">Registration is closed</h2>
          <p className="mt-2 text-muted-foreground">The host has not published a form yet.</p>
        </div>
      </section>
    );
  }

  if (!open) {
    return (
      <section id="register" className="mx-auto w-full max-w-xl px-4 pt-10 pb-4">
        <div className="console rounded-3xl p-6 text-center md:p-8" role="status">
          <p className="font-mono text-xs tracking-[0.2em] text-destructive uppercase">Closed</p>
          <h2 className="mt-2 font-display text-4xl">Registration is off</h2>
          <p className="mt-3 text-muted-foreground">
            The event timer ended or the host turned registration off. New entries are not accepted.
          </p>
          {closesAt ? (
            <div className="mx-auto mt-5 max-w-sm text-left">
              <RegistrationCountdown closesAt={closesAt} />
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return <RegisterFields key={formKey} fields={fields} closesAt={closesAt} onReset={() => setFormKey((key) => key + 1)} />;
}

const emptyRegisterState: RegisterResult = { ok: false, message: "", fieldErrors: {} };

function RegisterFields({
  fields,
  closesAt,
  onReset,
}: {
  fields: FormField[];
  closesAt: string | null;
  onReset: () => void;
}) {
  const [state, action, pending] = useActionState(registerAction, emptyRegisterState);

  if (state.ok) {
    return (
      <section id="register" className="mx-auto w-full max-w-xl px-4 pt-10 pb-4">
        <div className="console rounded-3xl p-6 text-center md:p-8" role="status">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">Saved</p>
          <h2 className="mt-2 font-display text-4xl">You&apos;re on the list</h2>
          <p className="mt-3 text-muted-foreground">
            We saved {state.name}. The host can see this registration.
          </p>
          <Button type="button" className="mt-6 h-11 px-5" onClick={onReset}>
            Register someone else
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section id="register" className="mx-auto w-full max-w-xl px-4 pt-10 pb-4">
      <form action={action} className="console rounded-3xl p-6 md:p-8" noValidate>
        <div className="mb-6 grid gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">Guest console</p>
            <h2 className="mt-2 font-display text-4xl leading-none">Tell the host you&apos;re coming</h2>
          </div>
          {closesAt ? <RegistrationCountdown closesAt={closesAt} /> : null}
        </div>
        <div className="grid gap-4">
          {fields.map((field) => (
            <FieldControl key={field.id} field={field} error={state.fieldErrors[field.id]} />
          ))}
        </div>
        {state.message ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}
        <Button type="submit" className="mt-6 h-11 w-full text-base" disabled={pending}>
          {pending ? "Saving your place…" : "Register"}
        </Button>
      </form>
    </section>
  );
}

function FieldControl({ field, error }: { field: FormField; error?: string }) {
  const id = `field-${field.id}`;
  const name = `f_${field.id}`;
  const describedBy = error ? `${id}-error` : undefined;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        <span>{field.label}</span>{" "}
        {field.required ? <span className="text-primary">Required</span> : <span className="text-muted-foreground">Optional</span>}
      </Label>
      {field.fieldType === "textarea" ? (
        <Textarea
          id={id}
          name={name}
          placeholder={field.placeholder}
          required={field.required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="min-h-28"
        />
      ) : field.fieldType === "select" ? (
        <select
          id={id}
          name={name}
          required={field.required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          defaultValue=""
          className="h-11 w-full rounded-lg border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="" disabled>
            {field.placeholder || "Choose one"}
          </option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.fieldType === "boolean" ? (
        <select
          id={id}
          name={name}
          required={field.required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          defaultValue=""
          className="h-11 w-full rounded-lg border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="" disabled>
            Choose
          </option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      ) : (
        <Input
          id={id}
          name={name}
          type={field.fieldType === "email" ? "email" : "text"}
          inputMode={field.fieldType === "phone" ? "tel" : field.fieldType === "email" ? "email" : "text"}
          autoComplete={field.fieldType === "email" ? "email" : field.fieldType === "phone" ? "tel" : field.fieldType === "text" ? "name" : "off"}
          placeholder={field.placeholder}
          required={field.required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="h-11"
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
