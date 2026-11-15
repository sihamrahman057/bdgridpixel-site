import { Bell } from "lucide-react";
import type { EventSettings, SiteNotification } from "@/lib/types";
import { formatBangladeshStamp } from "@/lib/time-bd";

export function SiteTopBar({
  settings,
  notifications,
}: {
  settings: EventSettings;
  notifications: SiteNotification[];
}) {
  return (
    <header className="site-top-bar">
      <div className="site-top-bar-inner">
        <div className="site-brand">
          {settings.hasSiteLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/api/site-logo" alt={`${settings.eventName} logo`} className="site-logo" />
          ) : (
            <span className="site-logo-fallback">{settings.eventName}</span>
          )}
        </div>

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
