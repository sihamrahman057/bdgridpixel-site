import type { EventSettings, SiteNotification } from "@/lib/types";
import { SiteNotices } from "@/components/site-notices";

export function SiteTopBar({
  settings,
  notifications,
}: {
  settings: EventSettings;
  notifications: SiteNotification[];
}) {
  const logoSrc = settings.hasSiteLogo
    ? `/api/site-logo?v=${encodeURIComponent(settings.updatedAt)}`
    : "";

  return (
    <header className="site-top-bar">
      <div className="site-top-bar-inner">
        <div className="site-top-slot site-top-slot-start">
          <details className="bd-flag">
            <summary className="bd-flag-button" aria-label="Bangladesh">
              <svg className="bd-flag-svg" viewBox="0 0 250 150" role="img" aria-hidden>
                <rect width="250" height="150" fill="#006a4e" />
                <circle cx="112.5" cy="75" r="50" fill="#f42a41" />
              </svg>
            </summary>
            <p className="bd-flag-note">Proud to be the first sim racing platform in Bangladesh</p>
          </details>
        </div>

        <div className="site-top-slot site-top-slot-center">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt={`${settings.eventName} logo`} className="site-logo" />
          ) : null}
        </div>

        <div className="site-top-slot site-top-slot-end">
          <SiteNotices notifications={notifications} />
        </div>
      </div>
    </header>
  );
}
