import { Bell } from "lucide-react";
import type { SiteNotification } from "@/lib/types";
import { formatBangladeshStamp } from "@/lib/time-bd";

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

        <details className="site-notify">
          <summary className="site-bell" aria-label="Notifications">
            <Bell className="size-5" aria-hidden />
            {notifications.length > 0 ? <span className="site-bell-dot" aria-hidden /> : null}
          </summary>
          <div className="site-notify-panel" role="region" aria-label="Notifications">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notices from the host yet.</p>
            ) : (
              <ul className="grid gap-3">
                {notifications.map((note) => (
                  <li key={note.id} className="grid gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-foreground">{note.title}</p>
                    <p className="text-sm text-muted-foreground">{note.body}</p>
                    <p className="text-xs text-muted-foreground">{formatBangladeshStamp(note.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}
