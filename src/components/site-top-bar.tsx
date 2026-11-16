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
              <defs>
                <linearGradient id="bd-cloth" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#12825f" />
                  <stop offset="38%" stopColor="#006a4e" />
                  <stop offset="100%" stopColor="#034433" />
                </linearGradient>
                <radialGradient id="bd-disc" cx="36%" cy="34%" r="68%">
                  <stop offset="0%" stopColor="#ff6b6e" />
                  <stop offset="46%" stopColor="#f42a41" />
                  <stop offset="100%" stopColor="#b10f24" />
                </radialGradient>
                <linearGradient id="bd-sheen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
                  <stop offset="42%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
                </linearGradient>
              </defs>
              <rect width="250" height="150" fill="url(#bd-cloth)" />
              <path d="M0 34c48-10 96-2 144 8s78 12 106 2v16c-36 12-78 2-122-6S42 42 0 50Z" fill="#000000" opacity="0.12" />
              <path d="M0 92c52-12 104 2 156 10s70 6 94-4v14c-30 12-72 0-120-8S48 96 0 108Z" fill="#ffffff" opacity="0.07" />
              <circle cx="112.5" cy="75" r="50" fill="url(#bd-disc)" />
              <ellipse cx="96" cy="58" rx="18" ry="11" fill="#ffffff" opacity="0.22" />
              <rect width="250" height="150" fill="url(#bd-sheen)" />
              <rect x="1" y="1" width="248" height="148" fill="none" stroke="#f4f7f5" strokeOpacity="0.35" strokeWidth="2" />
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
