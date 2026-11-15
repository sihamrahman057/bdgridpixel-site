import { BannerEditor } from "@/components/admin/banner-editor";
import { getCurrentStaff } from "@/lib/auth";
import { getSettings } from "@/lib/event-store";
import { canEditContent } from "@/lib/types";

export const metadata = { title: "Banner" };

export default async function BannerPage() {
  const [staff, settings] = await Promise.all([getCurrentStaff(), getSettings()]);
  if (!staff) return null;
  return (
    <section className="grid gap-4">
      <div>
        <h1 className="font-display text-4xl leading-none">Banner</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This strip sits under the cockpit. Change the words, the picture, or the button whenever the night changes.
        </p>
      </div>
      <BannerEditor settings={settings} canEdit={canEditContent(staff.role)} />
    </section>
  );
}
