import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm, SetupForm, type LoginPortal } from "@/components/admin/auth-forms";
import { getCurrentStaff } from "@/lib/auth";
import { countOwners } from "@/lib/event-store";
import { setupSecretRequired } from "@/lib/session-secret";

export const metadata = { title: "Sign in" };

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; portal?: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-sm text-muted-foreground">Opening sign-in…</p>}>
      <AdminGate searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminGate({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; portal?: string }>;
}) {
  const [{ error, portal }, staff, owners] = await Promise.all([
    searchParams,
    getCurrentStaff(),
    countOwners(),
  ]);
  if (staff) redirect("/admin/registrations");
  if (owners === 0) {
    return <SetupForm error={error} requireSetupSecret={setupSecretRequired()} />;
  }
  const initialPortal: LoginPortal = portal === "moderator" ? "moderator" : "admin";
  return <LoginForm error={error} initialPortal={initialPortal} />;
}
