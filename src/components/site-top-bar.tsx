import type { SiteNotification } from "@/lib/types";
import { SiteNotices } from "@/components/site-notices";

export function SiteTopBar({ notifications }: { notifications: SiteNotification[] }) {
  return (
    <header className="site-top-bar">
      <div className="site-top-bar-inner">
        <details className="bd-flag">
          <summary className="bd-flag-button" aria-label="Bangladesh">
            <svg className="bd-flag-svg" viewBox="0 0 250 150" role="img" aria-hidden>
              <rect width="250" height="150" fill="#006a4e" />
              <circle cx="112.5" cy="75" r="50" fill="#f42a41" />
            </svg>
          </summary>
          <p className="bd-flag-note">Proud to be the first sim racing platform in Bangladesh</p>
        </details>

        <SiteNotices notifications={notifications} />
      </div>
    </header>
  );
}
