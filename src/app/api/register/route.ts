import { NextResponse } from "next/server";
import { registerGuest } from "@/lib/event-store";
import { clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ ok: false, message: "This registration was refused." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ ok: false, message: "This registration was refused." }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Send registration answers as JSON." }, { status: 400 });
  }
  const answers =
    body && typeof body === "object" && "answers" in body && body.answers && typeof body.answers === "object"
      ? (body.answers as Record<string, unknown>)
      : {};
  const result = await registerGuest(answers, clientIp(request.headers));
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
