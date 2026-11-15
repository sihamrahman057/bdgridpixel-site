"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, ImageIcon, LogOut, TextCursorInput, Users, ClipboardList } from "lucide-react";
import type { Staff } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

const links = [
  { href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
  { href: "/admin/fields", label: "Form", icon: TextCursorInput },
  { href: "/admin/banner", label: "Banner", icon: ImageIcon },
  { href: "/admin/hero", label: "Hero", icon: Gauge },
  { href: "/admin/staff", label: "Staff", icon: Users, ownerOnly: true },
];

export function AdminShell({ staff, children }: { staff: Staff; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-full">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[0.68rem] tracking-[0.22em] text-primary uppercase">Control room</p>
            <p className="text-sm text-muted-foreground">
              {staff.name} · {staff.role}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9" render={<Link href="/" />} nativeButton={false}>
              View the page
            </Button>
            <form action="/api/admin/session" method="post">
              <input type="hidden" name="intent" value="logout" />
              <Button type="submit" variant="ghost" className="h-9">
                <LogOut />
                Sign out
              </Button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-3" aria-label="Admin">
          {links.filter((link) => !link.ownerOnly || staff.role === "owner").map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
