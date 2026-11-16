"use client";

import { useState, type ReactNode } from "react";

export type LoginPortal = "admin" | "moderator";

export function SetupForm({
  error,
  requireSetupSecret = false,
}: {
  error?: string;
  requireSetupSecret?: boolean;
}) {
  return (
    <AuthCard
      kicker="First visit"
      title="Create the admin account"
      copy="This happens once. The admin can later invite moderators to help run the event."
    >
      <form action="/api/admin/session" method="post" className="grid gap-4">
        <input type="hidden" name="intent" value="setup" />
        <input type="hidden" name="portal" value="admin" />
        <Field id="setup-name" name="name" label="Name" autoComplete="name" />
        <Field id="setup-email" name="email" label="Email" type="email" autoComplete="email" />
        <Field
          id="setup-password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        {requireSetupSecret ? (
          <Field
            id="setup-secret"
            name="setupSecret"
            label="Setup secret"
            type="password"
            autoComplete="off"
            hint="The ADMIN_SETUP_SECRET value you set for this published app."
          />
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="login-submit">
          Create admin and enter
        </button>
      </form>
    </AuthCard>
  );
}

export function LoginForm({
  error,
  initialPortal = "admin",
}: {
  error?: string;
  initialPortal?: LoginPortal;
}) {
  const [portal, setPortal] = useState<LoginPortal>(initialPortal);
  const [pending, setPending] = useState(false);
  const moderator = portal === "moderator";

  return (
    <AuthCard
      kicker="Control room"
      title="Sign in"
      copy="Leave the switch on Admin for the owner account. Slide it right only when you are signing in as a moderator."
    >
      <form
        action="/api/admin/session"
        method="post"
        className="grid gap-5"
        onSubmit={() => setPending(true)}
      >
        <input type="hidden" name="intent" value="login" />
        <input type="hidden" name="portal" value={portal} />

        <div className="portal-toggle" role="group" aria-label="Sign-in type">
          <span className="portal-toggle-side" data-active={moderator ? "false" : "true"}>
            Admin
          </span>
          <button
            type="button"
            className="portal-toggle-switch"
            data-checked={moderator ? "true" : "false"}
            aria-pressed={moderator}
            aria-label={moderator ? "Moderator mode, switch to Admin" : "Admin mode, switch to Moderator"}
            onClick={() => setPortal(moderator ? "admin" : "moderator")}
          >
            <span className="portal-toggle-track" aria-hidden>
              <span className="portal-toggle-thumb" />
            </span>
          </button>
          <span className="portal-toggle-side" data-active={moderator ? "true" : "false"}>
            Moderator
          </span>
        </div>

        <Field id="login-email" name="email" label="Email" type="email" autoComplete="email" />
        <Field
          id="login-password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="login-submit" disabled={pending}>
          {pending ? "Signing in…" : "Enter the panel"}
        </button>
      </form>
    </AuthCard>
  );
}

function AuthCard({
  kicker,
  title,
  copy,
  children,
}: {
  kicker: string;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <p className="font-mono text-xs tracking-[0.22em] text-primary uppercase">{kicker}</p>
      <h1 className="mt-2 font-display text-5xl leading-none">{title}</h1>
      <p className="mt-3 mb-6 text-sm leading-6 text-muted-foreground">{copy}</p>
      <div className="console rounded-2xl border border-border p-5">{children}</div>
    </main>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="login-input"
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
