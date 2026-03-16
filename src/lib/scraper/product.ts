import { getPage } from "./browser";
import { scrapeQueue } from "./queue";
import { extractJsonLd, ExtractedProduct } from "./extractors/json-ld";
import { extractFromHtml } from "./extractors/html";
import { PageLoadError } from "../utils/errors";

export interface ProductResearch extends ExtractedProduct {
  sourceUrl: string;
  scrapedAt: Date;
}

export async function scrapeProduct(url: string): Promise<ProductResearch> {
  return scrapeQueue.add(async () => {
    const page = await getPage();

    try {
      // Navigate to the page
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      if (!response || response.status() >= 400) {
        throw new PageLoadError(url);
      }

      // Wait a bit for any lazy-loaded content
      await page.waitForTimeout(2000);

      // Try JSON-LD extraction first
      const jsonLdData = await extractJsonLd(page);

      // Also extract from HTML for fallback/supplemental data
      const htmlData = await extractFromHtml(page);

      // Merge data, preferring JSON-LD but falling back to HTML
      const product = mergeProductData(jsonLdData, htmlData);

      return {
        ...product,
        sourceUrl: url,
        scrapedAt: new Date(),
      };
    } finally {
      await page.close();
    }
  });
}

function mergeProductData(
  primary: ExtractedProduct,
  fallback: ExtractedProduct
): ExtractedProduct {
  return {
    name: primary.name || fallback.name,
    brand: primary.brand || fallback.brand,
    model: primary.model || fallback.model,
    mpn: primary.mpn || fallback.mpn,
    gtin: primary.gtin || fallback.gtin,
    sku: primary.sku || fallback.sku,
    description: primary.description || fallback.description,
    features: mergeArrays(primary.features, fallback.features),
    specifications: { ...fallback.specifications, ...primary.specifications },
    images: mergeArrays(primary.images, fallback.images),
    price: primary.price || fallback.price,
    currency: primary.currency || fallback.currency,
    category: primary.category || fallback.category,
    color: primary.color || fallback.color,
    material: primary.material || fallback.material,
    weight: primary.weight || fallback.weight,
    dimensions: primary.dimensions || fallback.dimensions,
    rawJsonLd: primary.rawJsonLd,
  };
}

function mergeArrays(
  a: string[] | undefined,
  b: string[] | undefined
): string[] {
  const merged = [...(a || [])];
  for (const item of b || []) {
    if (!merged.includes(item)) {
      merged.push(item);
    }
  }
  return merged;
}
