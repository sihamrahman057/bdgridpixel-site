import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import type { EventSettings } from "@/lib/types";
import { safeHref } from "@/lib/validation";

export function EventBanner({ settings }: { settings: EventSettings }) {
  const href = safeHref(settings.bannerButtonUrl);
  const imageSrc = settings.hasBannerImage
    ? `/api/banner-image?v=${encodeURIComponent(settings.updatedAt)}`
    : settings.bannerImageUrl || null;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-8" aria-label="Announcement">
      <div className="grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[minmax(220px,320px)_minmax(0,1fr)]">
        <div className="relative min-h-48">
          {imageSrc ? (
            // Admin-supplied photos can come from any host, so this is a plain image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="banner-fallback absolute inset-0" />
          )}
        </div>
        <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
          <p className="font-mono text-xs tracking-[0.22em] text-primary uppercase">{settings.bannerEyebrow}</p>
          <h2 className="font-display text-4xl leading-none tracking-tight text-balance">{settings.bannerTitle}</h2>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">{settings.bannerBody}</p>
          {settings.bannerButtonLabel && href ? (
            <div>
              <a href={href} className={cn(buttonVariants(), "mt-2 h-10 px-4")}>
                {settings.bannerButtonLabel}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
