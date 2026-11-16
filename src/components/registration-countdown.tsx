"use client";

import { useEffect, useState } from "react";
import { formatBangladeshStamp, remainingMs } from "@/lib/time-bd";

export function RegistrationCountdown({ closesAt }: { closesAt: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(remainingMs(closesAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [closesAt]);

  if (left == null) {
    return (
      <div className="rounded-lg bg-primary/15 px-3 py-2 text-sm" role="status" aria-busy="true">
        <p className="font-mono text-xs tracking-[0.16em] text-primary uppercase">Closes in Bangladesh time</p>
        <p className="mt-1 font-display text-2xl leading-none">Checking the clock…</p>
      </div>
    );
  }
  if (left <= 0) {
    return (
      <p className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive" role="status">
        Registration closed at {formatBangladeshStamp(closesAt)}.
      </p>
    );
  }

  const totalSec = Math.floor(left / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const clock = [
    days > 0 ? `${days}d` : null,
    `${String(hours).padStart(2, "0")}h`,
    `${String(minutes).padStart(2, "0")}m`,
    `${String(seconds).padStart(2, "0")}s`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="rounded-lg bg-primary/15 px-3 py-2 text-sm" role="status">
      <p className="font-mono text-xs tracking-[0.16em] text-primary uppercase">Closes in Bangladesh time</p>
      <p className="mt-1 font-display text-2xl leading-none tabular-nums">{clock}</p>
      <p className="mt-1 text-xs text-muted-foreground">Ends {formatBangladeshStamp(closesAt)}</p>
    </div>
  );
}
