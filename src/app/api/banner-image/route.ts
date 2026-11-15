import { getBannerImage } from "@/lib/event-store";

export async function GET() {
  const image = await getBannerImage();
  if (!image) return new Response(null, { status: 404 });
  return new Response(Buffer.from(image.bytes), {
    headers: {
      "content-type": image.type,
      "cache-control": "public, max-age=60",
    },
  });
}
