import { NextResponse } from "next/server";
import { scrapeProduct } from "@/lib/scraper/product";
import { db } from "@/lib/db/client";
import { researchHistory } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    console.log(`[Scrape] URL: ${url}`);

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    console.log("[Scrape] Starting product scrape...");
    const startTime = Date.now();
    const product = await scrapeProduct(url);
    console.log(`[Scrape] Done in ${Date.now() - startTime}ms - Found: ${product.name || "unknown"}`);
    console.log(`[Scrape] Brand: ${product.brand}, Model: ${product.model}, Images: ${product.images?.length || 0}`);

    // Save to research history
    const [saved] = await db
      .insert(researchHistory)
      .values({
        productName: product.name || "Unknown Product",
        brand: product.brand,
        model: product.model,
        mpn: product.mpn,
        upc: product.gtin,
        description: product.description,
        features: product.features ? JSON.stringify(product.features) : null,
        specifications: product.specifications
          ? JSON.stringify(product.specifications)
          : null,
        images: product.images ? JSON.stringify(product.images) : null,
        sourceUrl: url,
        rawJsonLd: product.rawJsonLd,
      })
      .returning();

    return NextResponse.json({
      product,
      researchId: saved.id,
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Failed to scrape product. Try a different URL." },
      { status: 500 }
    );
  }
}
