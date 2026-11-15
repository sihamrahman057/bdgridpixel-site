import { StaffManager } from "@/components/admin/staff-manager";
import { getCurrentStaff } from "@/lib/auth";
import { listStaff } from "@/lib/event-store";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const [staff, people] = await Promise.all([getCurrentStaff(), listStaff()]);
  if (!staff) return null;
  return (
    <section className="grid gap-4">
      <div>
        <h1 className="font-display text-4xl leading-none">Staff</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A manager can edit the page and remove one registration. An assistant can look at the list and export it. Only the owner can invite people or clear the whole list.
        </p>
      </div>
      {staff.role === "owner" ? (
        <StaffManager staff={people} currentId={staff.id} />
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          Only the owner can give or remove access.
        </p>
      )}
    </section>
  );
}
