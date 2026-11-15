import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/lib/auth";
import { listFields, listRegistrationsForExport, toCsv } from "@/lib/event-store";

export async function GET(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "You need to sign in again." }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const [fields, rows] = await Promise.all([listFields(), listRegistrationsForExport(query)]);
  const csv = toCsv(fields, rows);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="registrations.csv"',
      "cache-control": "no-store",
    },
  });
}
