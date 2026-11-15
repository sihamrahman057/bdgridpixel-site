import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm, SetupForm } from "@/components/admin/auth-forms";
import { getCurrentStaff } from "@/lib/auth";
import { countOwners } from "@/lib/event-store";

export const metadata = { title: "Staff" };

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-sm text-muted-foreground">Opening the staff entrance…</p>}>
      <AdminGate searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminGate({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, staff, owners] = await Promise.all([searchParams, getCurrentStaff(), countOwners()]);
  if (staff) redirect("/admin/registrations");
  if (owners === 0) return <SetupForm error={error} />;
  return <LoginForm error={error} />;
}
