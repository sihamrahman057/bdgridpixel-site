import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { LoginForm, SetupForm } from "@/components/admin/auth-forms";
import { getCurrentStaff } from "@/lib/auth";
import { countOwners } from "@/lib/event-store";

export const metadata = { title: "Staff" };

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-sm text-muted-foreground">Opening the staff entrance…</p>}>
      <AdminGate />
    </Suspense>
  );
}

async function AdminGate() {
  await connection();
  const [staff, owners] = await Promise.all([getCurrentStaff(), countOwners()]);
  if (staff) redirect("/admin/registrations");
  if (owners === 0) return <SetupForm />;
  return <LoginForm />;
}
