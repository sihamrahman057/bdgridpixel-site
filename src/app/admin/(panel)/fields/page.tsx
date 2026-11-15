import { connection } from "next/server";
import { EventSetup } from "@/components/admin/event-setup";
import { FieldEditor } from "@/components/admin/field-editor";
import { getCurrentStaff } from "@/lib/auth";
import { getSettings, listFields } from "@/lib/event-store";
import { canEditContent } from "@/lib/types";

export const metadata = { title: "Form" };

export default async function FieldsPage() {
  await connection();
  const [staff, fields, settings] = await Promise.all([
    getCurrentStaff(),
    listFields(),
    getSettings(),
  ]);
  if (!staff) return null;
  const canEdit = canEditContent(staff.role);
  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-display text-4xl leading-none">Form</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Create the event guests see, set the Bangladesh close timer, then choose the fields you need.
          Name, phone, and email are here to start.
        </p>
      </div>
      <EventSetup settings={settings} canEdit={canEdit} />
      <div className="grid gap-3">
        <h2 className="font-display text-3xl leading-none">Fields guests fill</h2>
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">The form is empty. Add a field before guests can register.</p>
        ) : null}
        <FieldEditor fields={fields} canEdit={canEdit} />
      </div>
    </section>
  );
}
