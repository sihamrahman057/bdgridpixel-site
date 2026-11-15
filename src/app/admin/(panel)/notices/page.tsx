import { NotificationManager } from "@/components/admin/notification-manager";
import { getCurrentStaff } from "@/lib/auth";
import { listNotifications } from "@/lib/event-store";
import { canEditContent } from "@/lib/types";

export const metadata = { title: "Notices" };

export default async function NoticesPage() {
  const [staff, notifications] = await Promise.all([getCurrentStaff(), listNotifications()]);
  if (!staff) return null;
  return (
    <section className="grid gap-4">
      <div>
        <h1 className="font-display text-4xl leading-none">Notices</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Messages guests open from the bell on the public top bar.
        </p>
      </div>
      <NotificationManager notifications={notifications} canEdit={canEditContent(staff.role)} />
    </section>
  );
}
