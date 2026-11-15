import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetupForm({ error }: { error?: string }) {
  return (
    <AuthCard
      kicker="First visit"
      title="Create the owner account"
      copy="This happens once. The owner can later invite a manager or an assistant."
    >
      <form action="/api/admin/session" method="post" className="grid gap-4">
        <input type="hidden" name="intent" value="setup" />
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
          Create owner and enter
        </Button>
      </form>
    </AuthCard>
  );
}

export function LoginForm({ error }: { error?: string }) {
  return (
    <AuthCard
      kicker="Staff entrance"
      title="Sign in"
      copy="Use the email and password the owner gave you."
    >
      <form action="/api/admin/session" method="post" className="grid gap-4">
        <input type="hidden" name="intent" value="login" />
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
          Enter the panel
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
