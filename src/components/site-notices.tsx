"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import type { SiteNotification } from "@/lib/types";
import { formatBangladeshStamp } from "@/lib/time-bd";

const STORAGE_KEY = "er-read-notices";

export function SiteNotices({ notifications }: { notifications: SiteNotification[] }) {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      setReadIds(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
    } catch {
      setReadIds([]);
    }
    setReady(true);
  }, []);

  function markRead(id: string) {
    setReadIds((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const unread = notifications.filter((note) => !readIds.includes(note.id)).length;
  const showDot = ready && unread > 0;

  return (
    <details className="site-notify">
      <summary className="site-bell" aria-label={showDot ? `Notifications, ${unread} unread` : "Notifications"}>
        <Bell className="size-5" aria-hidden />
        {showDot ? <span className="site-bell-dot" aria-hidden /> : null}
      </summary>
      <div className="site-notify-panel" role="region" aria-label="Notifications">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notices from the host yet.</p>
        ) : (
          <ul className="grid gap-3">
            {notifications.map((note) => {
              const read = readIds.includes(note.id);
              const open = openId === note.id;
              return (
                <li key={note.id} className="grid gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
                  <button
                    type="button"
                    className="notice-open"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : note.id)}
                  >
                    <span className="font-medium text-foreground">{note.title}</span>
                    <span className="text-xs text-muted-foreground">{formatBangladeshStamp(note.createdAt)}</span>
                  </button>
                  {open ? <p className="text-sm text-muted-foreground">{note.body}</p> : null}
                  {read ? (
                    <span className="notice-read-state">Read</span>
                  ) : (
                    <button type="button" className="notice-read" onClick={() => markRead(note.id)}>
                      Mark as read
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </details>
  );
}
