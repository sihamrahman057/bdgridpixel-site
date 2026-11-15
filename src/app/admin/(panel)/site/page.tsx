import { SiteBrandEditor } from "@/components/admin/site-brand-editor";
import { getCurrentStaff } from "@/lib/auth";
import { getSettings } from "@/lib/event-store";
import { canEditContent } from "@/lib/types";

export const metadata = { title: "Site" };

export default async function SitePage() {
  const [staff, settings] = await Promise.all([getCurrentStaff(), getSettings()]);
  if (!staff) return null;
  return (
    <section className="grid gap-4">
      <div>
        <h1 className="font-display text-4xl leading-none">Site</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Upload the top-bar logo and set Discord, Instagram, YouTube, and Facebook links for the footer.
        </p>
      </div>
      <SiteBrandEditor settings={settings} canEdit={canEditContent(staff.role)} />
    </section>
  );
}
