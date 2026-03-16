import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { sanitizeFilename } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { images, productName } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Images array is required" },
        { status: 400 }
      );
    }

    const sku = sanitizeFilename(productName || `product-${Date.now()}`);
    const downloadDir = join(homedir(), "Desktop", "ebay", sku);

    // Create directory if it doesn't exist
    if (!existsSync(downloadDir)) {
      await mkdir(downloadDir, { recursive: true });
    }

    const downloaded: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const url = images[i];
      try {
        const response = await fetch(url);
        if (!response.ok) {
          errors.push(`Failed to download: ${url}`);
          continue;
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        // Determine extension from content type or URL
        const contentType = response.headers.get("content-type") || "";
        let ext = "jpg";
        if (contentType.includes("png")) ext = "png";
        else if (contentType.includes("webp")) ext = "webp";
        else if (url.includes(".png")) ext = "png";
        else if (url.includes(".webp")) ext = "webp";

        const filename = `stock-${i + 1}.${ext}`;
        const filepath = join(downloadDir, filename);

        await writeFile(filepath, buffer);
        downloaded.push(filepath);
      } catch (err) {
        errors.push(`Error downloading ${url}: ${err}`);
      }
    }

    return NextResponse.json({
      downloaded,
      errors,
      directory: downloadDir,
    });
  } catch (error) {
    console.error("Image download error:", error);
    return NextResponse.json(
      { error: "Failed to download images" },
      { status: 500 }
    );
  }
}
