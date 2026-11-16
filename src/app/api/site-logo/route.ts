import { getSiteLogo } from "@/lib/event-store";
import { trimLogo } from "@/lib/trim-logo";

export async function GET() {
  const image = await getSiteLogo();
  if (!image) return new Response(null, { status: 404 });
  const bytes = await trimLogo(image.bytes);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=60",
    },
  });
}
