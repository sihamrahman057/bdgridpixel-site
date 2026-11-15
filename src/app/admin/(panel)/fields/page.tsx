import { connection } from "next/server";
import { FieldEditor } from "@/components/admin/field-editor";
import { getCurrentStaff } from "@/lib/auth";
import { listFields } from "@/lib/event-store";
import { canEditContent } from "@/lib/types";

export const metadata = { title: "Form" };

export default async function FieldsPage() {
  await connection();
  const [staff, fields] = await Promise.all([getCurrentStaff(), listFields()]);
  if (!staff) return null;
  return (
    <section className="grid gap-4">
      <div>
        <h1 className="font-display text-4xl leading-none">Form</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Name, phone, and email are here to start. Add a question, change the order, or remove one. At least one field stays on the form.
        </p>
      </div>
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">The form is empty. Add a field before guests can register.</p>
      ) : null}
      <FieldEditor fields={fields} canEdit={canEditContent(staff.role)} />
    </section>
  );
}
