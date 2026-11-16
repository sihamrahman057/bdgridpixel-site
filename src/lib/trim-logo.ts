import sharp from "sharp";

/** Drop empty margins so a padded upload fills the top-bar slot. */
export async function trimLogo(bytes: Uint8Array): Promise<Buffer> {
  const input = Buffer.from(bytes);
  const { data, info } = await sharp(input, { failOn: "none" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * channels;
      const alpha = data[index + 3] ?? 255;
      const red = data[index] ?? 0;
      const green = data[index + 1] ?? 0;
      const blue = data[index + 2] ?? 0;
      if (alpha < 18) continue;
      if (red < 14 && green < 14 && blue < 14) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) return input;
  const pad = 10;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const cropWidth = Math.min(width - left, maxX - left + 1 + pad);
  const cropHeight = Math.min(height - top, maxY - top + 1 + pad);

  return sharp(input, { failOn: "none" })
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .png()
    .toBuffer();
}
