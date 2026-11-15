import { HeroEditor } from "@/components/admin/hero-editor";
import { getCurrentStaff } from "@/lib/auth";
import { getSettings } from "@/lib/event-store";
import { canEditContent } from "@/lib/types";

export const metadata = { title: "Hero" };

export default async function HeroPage() {
  const [staff, settings] = await Promise.all([getCurrentStaff(), getSettings()]);
  if (!staff) return null;
  return (
    <section className="grid gap-4">
      <div>
        <h1 className="font-display text-4xl leading-none">Hero</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The cluster shape stays. These four lines are the words inside the date dial, the event name, the place dial, and the status lamp.
        </p>
      </div>
      <HeroEditor settings={settings} canEdit={canEditContent(staff.role)} />
    </section>
  );
}
