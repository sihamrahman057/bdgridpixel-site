"use client";

import { useActionState, useState } from "react";
import { registerAction } from "@/lib/actions";
import type { FormField, RegisterResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RegisterForm({ fields }: { fields: FormField[] }) {
  const [formKey, setFormKey] = useState(0);
  return <RegisterFields key={formKey} fields={fields} onReset={() => setFormKey((key) => key + 1)} />;
}

const emptyRegisterState: RegisterResult = { ok: false, message: "", fieldErrors: {} };

function RegisterFields({ fields, onReset }: { fields: FormField[]; onReset: () => void }) {
  const [state, action, pending] = useActionState(registerAction, emptyRegisterState);

  if (fields.length === 0) {
    return (
      <section id="register" className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="console rounded-3xl border border-border p-6 text-center">
          <h2 className="font-display text-3xl">Registration is closed</h2>
          <p className="mt-2 text-muted-foreground">The host has not published a form yet.</p>
        </div>
      </section>
    );
  }

  if (state.ok) {
    return (
      <section id="register" className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="console rounded-3xl border border-border p-6 text-center md:p-8" role="status">
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
    <section id="register" className="mx-auto w-full max-w-xl px-4 py-10">
      <form action={action} className="console rounded-3xl border border-border p-6 md:p-8" noValidate>
        <div className="mb-6">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">Guest console</p>
          <h2 className="mt-2 font-display text-4xl leading-none">Tell the host you&apos;re coming</h2>
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
        {field.label}
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
