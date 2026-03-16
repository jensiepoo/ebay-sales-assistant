import { Page } from "playwright";
import { ExtractedProduct } from "./json-ld";

export async function extractFromHtml(page: Page): Promise<ExtractedProduct> {
  const product: ExtractedProduct = {
    features: [],
    specifications: {},
    images: [],
  };

  // Extract title
  const title = await page.title();
  if (title) {
    product.name = cleanTitle(title);
  }

  // Try common meta tags
  const metaDescription = await page
    .$eval('meta[name="description"]', (el) => el.getAttribute("content"))
    .catch(() => null);
  if (metaDescription) {
    product.description = metaDescription;
  }

  // Try Open Graph
  const ogTitle = await page
    .$eval('meta[property="og:title"]', (el) => el.getAttribute("content"))
    .catch(() => null);
  if (ogTitle && !product.name) {
    product.name = cleanTitle(ogTitle);
  }

  // Extract images from og:image and common patterns
  const ogImages = await page.$$eval(
    'meta[property="og:image"]',
    (els) =>
      els.map((el) => el.getAttribute("content")).filter(Boolean) as string[]
  );
  product.images!.push(...ogImages);

  // Look for product images in common containers
  const productImages = await page.$$eval(
    '[class*="product"] img, [class*="gallery"] img, [id*="product"] img',
    (imgs) =>
      imgs
        .map((img) => img.getAttribute("src") || img.getAttribute("data-src"))
        .filter((src) => src && src.startsWith("http")) as string[]
  );
  for (const img of productImages) {
    if (!product.images!.includes(img)) {
      product.images!.push(img);
    }
  }

  // Extract spec tables
  const specTables = await page.$$("table");
  for (const table of specTables) {
    const rows = await table.$$("tr");
    for (const row of rows) {
      const cells = await row.$$("td, th");
      if (cells.length >= 2) {
        const key = await cells[0].textContent();
        const value = await cells[1].textContent();
        if (key && value) {
          const cleanKey = key.trim().replace(/:$/, "");
          const cleanValue = value.trim();
          if (cleanKey && cleanValue) {
            product.specifications![cleanKey] = cleanValue;
          }
        }
      }
    }
  }

  // Extract definition lists (dl/dt/dd)
  const dlItems = await page.$$eval("dl", (dls) => {
    const specs: Record<string, string> = {};
    for (const dl of dls) {
      const dts = dl.querySelectorAll("dt");
      const dds = dl.querySelectorAll("dd");
      for (let i = 0; i < Math.min(dts.length, dds.length); i++) {
        const key = dts[i]?.textContent?.trim().replace(/:$/, "");
        const value = dds[i]?.textContent?.trim();
        if (key && value) {
          specs[key] = value;
        }
      }
    }
    return specs;
  });
  Object.assign(product.specifications!, dlItems);

  // Extract bullet points / features
  const features = await page.$$eval(
    '[class*="feature"] li, [class*="spec"] li, [class*="detail"] li',
    (lis) =>
      lis
        .map((li) => li.textContent?.trim())
        .filter((t) => t && t.length > 5 && t.length < 500) as string[]
  );
  product.features = features.slice(0, 20); // Limit to 20 features

  // Try to extract brand from common patterns
  const brandMeta = await page
    .$eval('meta[property="product:brand"]', (el) => el.getAttribute("content"))
    .catch(() => null);
  if (brandMeta) {
    product.brand = brandMeta;
  }

  // Look for price
  const priceText = await page
    .$eval(
      '[class*="price"]:not([class*="compare"]):not([class*="was"]):not([class*="original"])',
      (el) => el.textContent
    )
    .catch(() => null);
  if (priceText) {
    const priceMatch = priceText.match(/[\$\u00A3\u20AC]?\s*([\d,]+\.?\d*)/);
    if (priceMatch) {
      product.price = parseFloat(priceMatch[1].replace(",", ""));
    }
  }

  return product;
}

function cleanTitle(title: string): string {
  // Remove common suffixes like "| Brand Name" or "- Official Site"
  return title
    .replace(/\s*[\|\-\u2013\u2014]\s*[^|\-\u2013\u2014]*$/, "")
    .trim();
}
