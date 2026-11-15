import Link from "next/link";
import { ClearDialog } from "@/components/admin/clear-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteRegistrationAction } from "@/lib/actions";
import { getCurrentStaff } from "@/lib/auth";
import {
  displayAnswer,
  formatStamp,
  listFields,
  pageSize,
  searchRegistrations,
} from "@/lib/event-store";
import { canClearRegistrations, canDeleteRegistration } from "@/lib/types";

export const metadata = { title: "Registrations" };

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const page = Number(params.page ?? "1");
  const [staff, fields, result] = await Promise.all([
    getCurrentStaff(),
    listFields(),
    searchRegistrations(query, page),
  ]);
  if (!staff) return null;
  const canDelete = canDeleteRegistration(staff.role);
  const pages = Math.max(1, Math.ceil(result.total / pageSize()));
  const exportHref = query ? `/api/admin/export?q=${encodeURIComponent(query)}` : "/api/admin/export";

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl leading-none">Registrations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.total === 0 ? "No guests yet." : `${result.total} saved.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9" render={<a href={exportHref} />} nativeButton={false}>
            Export CSV
          </Button>
          {canClearRegistrations(staff.role) ? <ClearDialog /> : null}
        </div>
      </div>

      <form action="/admin/registrations" className="flex flex-col gap-2 sm:flex-row">
        <Input name="q" defaultValue={result.query} placeholder="Search a name, number, or email" className="h-10 sm:max-w-sm" aria-label="Search registrations" />
        <Button type="submit" variant="secondary" className="h-10">Search</Button>
      </form>

      {result.rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-sm text-muted-foreground">
          {result.query ? "No registrations match that search." : "No one has registered yet. Share the public page when you are ready."}
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registered</TableHead>
                  {fields.map((field) => (
                    <TableHead key={field.id}>{field.label}</TableHead>
                  ))}
                  {canDelete ? <TableHead>Action</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-normal">{formatStamp(row.createdAt)}</TableCell>
                    {fields.map((field) => (
                      <TableCell key={field.id} className="max-w-64 whitespace-normal">
                        {displayAnswer(field, row.answers[field.id])}
                      </TableCell>
                    ))}
                    {canDelete ? (
                      <TableCell>
                        <form action={deleteRegistrationAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Remove
                          </Button>
                        </form>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 md:hidden">
            {result.rows.map((row) => (
              <article key={row.id} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{formatStamp(row.createdAt)}</p>
                <dl className="mt-3 grid gap-2">
                  {fields.map((field) => (
                    <div key={field.id}>
                      <dt className="text-xs text-muted-foreground">{field.label}</dt>
                      <dd>{displayAnswer(field, row.answers[field.id]) || "—"}</dd>
                    </div>
                  ))}
                </dl>
                {canDelete ? (
                  <form action={deleteRegistrationAction} className="mt-3">
                    <input type="hidden" name="id" value={row.id} />
                    <Button type="submit" variant="outline" size="sm">Remove</Button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}

      {pages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <p>Page {Math.min(result.page, pages)} of {pages}</p>
          <div className="flex gap-2">
            {result.page > 1 ? (
              <Link className="underline-offset-4 hover:underline" href={pageHref(result.query, result.page - 1)}>Previous</Link>
            ) : null}
            {result.page < pages ? (
              <Link className="underline-offset-4 hover:underline" href={pageHref(result.query, result.page + 1)}>Next</Link>
            ) : null}
          </div>
        </div>
      ) : null}
      <Badge variant="outline" className="w-fit">Showing current form fields. Older answers stay stored if a field is removed.</Badge>
    </section>
  );
}

function pageHref(query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("page", String(page));
  return `/admin/registrations?${params.toString()}`;
}
