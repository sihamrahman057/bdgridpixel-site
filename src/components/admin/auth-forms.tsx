"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

export type LoginPortal = "admin" | "moderator";

export function SetupForm({ error }: { error?: string }) {
  return (
    <AuthCard
      kicker="First visit"
      title="Create the admin account"
      copy="This happens once. The admin can later invite moderators to help run the event."
    >
      <form action="/api/admin/session" method="post" className="grid gap-4">
        <input type="hidden" name="intent" value="setup" />
        <input type="hidden" name="portal" value="admin" />
        <TextField id="setup-name" name="name" label="Name" autoComplete="name" />
        <TextField id="setup-email" name="email" label="Email" type="email" autoComplete="email" />
        <TextField
          id="setup-password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="h-10">
          Create admin and enter
        </Button>
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
  const isAdmin = portal === "admin";

  return (
    <AuthCard
      kicker="Control room"
      title="Sign in"
      copy={
        isAdmin
          ? "Admin access for the event owner. Full control of the panel."
          : "Moderator access for invited helpers. Use the email and password the admin gave you."
      }
    >
      <form action="/api/admin/session" method="post" className="grid gap-4">
        <input type="hidden" name="intent" value="login" />
        <input type="hidden" name="portal" value={portal} />

        <div
          className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1"
          role="tablist"
          aria-label="Sign-in type"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isAdmin}
            className={cn(
              "h-10 rounded-lg text-sm font-medium transition-colors",
              isAdmin
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setPortal("admin")}
          >
            Admin
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isAdmin}
            className={cn(
              "h-10 rounded-lg text-sm font-medium transition-colors",
              !isAdmin
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setPortal("moderator")}
          >
            Moderator
          </button>
        </div>

        <TextField id="login-email" name="email" label="Email" type="email" autoComplete="email" />
        <TextField
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
        <Button type="submit" className="h-10">
          {isAdmin ? "Enter as admin" : "Enter as moderator"}
        </Button>
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

function TextField({
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
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} autoComplete={autoComplete} required className="h-10" />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
