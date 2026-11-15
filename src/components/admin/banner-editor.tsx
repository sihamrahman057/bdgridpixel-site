"use client";

import { useActionState } from "react";
import { updateBannerAction } from "@/lib/actions";
import type { EventSettings, FormState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const empty: FormState = {};

export function BannerEditor({ settings, canEdit }: { settings: EventSettings; canEdit: boolean }) {
  const [state, action, pending] = useActionState(updateBannerAction, empty);
  const preview = settings.hasBannerImage
    ? `/api/banner-image?v=${encodeURIComponent(settings.updatedAt)}`
    : settings.bannerImageUrl;
  if (!canEdit) return <p className="text-sm text-muted-foreground">Only an owner or manager can change the banner.</p>;
  return (
    <form action={action} className="grid max-w-2xl gap-4" key={settings.updatedAt}>
      <div className="overflow-hidden rounded-xl border border-border">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Current banner" className="h-44 w-full object-cover" />
        ) : (
          <div className="banner-fallback h-44" />
        )}
      </div>
      <Field id="banner-eyebrow" name="eyebrow" label="Eyebrow" defaultValue={settings.bannerEyebrow} />
      <Field id="banner-title" name="title" label="Title" defaultValue={settings.bannerTitle} />
      <div className="grid gap-1.5">
        <Label htmlFor="banner-body">Text</Label>
        <Textarea id="banner-body" name="body" defaultValue={settings.bannerBody} required />
      </div>
      <Field id="banner-button-label" name="buttonLabel" label="Button label" defaultValue={settings.bannerButtonLabel} required={false} />
      <Field id="banner-button-url" name="buttonUrl" label="Button link" defaultValue={settings.bannerButtonUrl} required={false} hint="A web address, a path such as /admin, or #register." />
      <Field id="banner-image-url" name="imageUrl" label="Image link" defaultValue={settings.bannerImageUrl} required={false} hint="Used when no file is uploaded." />
      <div className="grid gap-1.5">
        <Label htmlFor="banner-file">Upload an image</Label>
        <Input id="banner-file" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
        <p className="text-xs text-muted-foreground">JPEG, PNG, WEBP, or GIF, up to 1.5 MB. An upload is shown instead of the image link.</p>
      </div>
      {settings.hasBannerImage ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="removeImage" value="yes" className="size-4 accent-primary" />
          Remove the uploaded image
        </label>
      ) : null}
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-primary" role="status">{state.ok}</p> : null}
      <Button type="submit" className="h-10 w-fit" disabled={pending}>{pending ? "Saving…" : "Save banner"}</Button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  defaultValue,
  hint,
  required = true,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} defaultValue={defaultValue} required={required} className="h-10" />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
