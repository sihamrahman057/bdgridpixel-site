"use client";

import { useActionState } from "react";
import { updateSiteBrandAction } from "@/lib/actions";
import type { EventSettings, FormState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty: FormState = {};

export function SiteBrandEditor({ settings, canEdit }: { settings: EventSettings; canEdit: boolean }) {
  const [state, action, pending] = useActionState(updateSiteBrandAction, empty);
  if (!canEdit) {
    return <p className="text-sm text-muted-foreground">Only an owner or manager can change the logo and social links.</p>;
  }

  return (
    <form action={action} className="grid max-w-2xl gap-5 rounded-xl border border-border bg-card p-4" encType="multipart/form-data">
      <div>
        <h2 className="font-display text-2xl">Logo</h2>
        <p className="mt-1 text-sm text-muted-foreground">Shown on the left of the public top bar.</p>
      </div>
      {settings.hasSiteLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/api/site-logo" alt="Current logo" className="h-12 w-auto rounded-md border border-border bg-black/30 p-1" />
      ) : (
        <p className="text-sm text-muted-foreground">No logo uploaded yet.</p>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="site-logo">Upload logo</Label>
        <Input id="site-logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="h-10" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="removeLogo" value="yes" className="size-4 accent-primary" />
        Remove the current logo
      </label>

      <div>
        <h2 className="font-display text-2xl">Social links</h2>
        <p className="mt-1 text-sm text-muted-foreground">Footer icons open these addresses. Leave blank to hide an icon.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SocialField id="discord" name="discord" label="Discord" defaultValue={settings.socialDiscord} />
        <SocialField id="instagram" name="instagram" label="Instagram" defaultValue={settings.socialInstagram} />
        <SocialField id="youtube" name="youtube" label="YouTube" defaultValue={settings.socialYoutube} />
        <SocialField id="facebook" name="facebook" label="Facebook" defaultValue={settings.socialFacebook} />
      </div>

      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-primary" role="status">{state.ok}</p> : null}
      <Button type="submit" className="h-10 w-fit" disabled={pending}>
        {pending ? "Saving…" : "Save logo and links"}
      </Button>
    </form>
  );
}

function SocialField({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type="url" defaultValue={defaultValue} placeholder="https://" className="h-10" />
    </div>
  );
}
