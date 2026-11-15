import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { getCurrentStaff } from "@/lib/auth";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-sm text-muted-foreground">Opening the workshop…</p>}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}

async function Guard({ children }: { children: ReactNode }) {
  await connection();
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin");
  return (
    <AdminShell staff={staff}>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading this section…</p>}>{children}</Suspense>
    </AdminShell>
  );
}
