import { ExtractedProduct } from "../scraper/extractors/json-ld";

export interface DescriptionInput {
  product: ExtractedProduct;
  condition?: string;
  userNotes?: string;
  msrp?: number;
}

export function generateTitle(product: ExtractedProduct): string {
  const parts: string[] = [];

  if (product.brand) parts.push(product.brand);
  if (product.model) parts.push(product.model);
  if (product.name && !parts.some((p) => product.name?.includes(p))) {
    parts.push(product.name);
  }
  if (product.color) parts.push(`- ${product.color}`);

  const title = parts.join(" ");
  // eBay titles max 80 chars
  return title.length > 80 ? title.slice(0, 77) + "..." : title;
}

export function generateDescription(input: DescriptionInput): string {
  const { product, condition, userNotes, msrp } = input;
  const lines: string[] = [];

  // Title line (without the 80 char limit for description)
  const titleParts: string[] = [];
  if (product.brand) titleParts.push(product.brand);
  if (product.model) titleParts.push(product.model);
  if (product.name) titleParts.push(product.name);
  if (product.color) titleParts.push(`- ${product.color}`);
  lines.push(titleParts.join(" "));
  lines.push("");

  // Opening paragraph - use product description or generate one
  if (product.description) {
    // Clean up and truncate if needed
    const cleanDesc = product.description
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
    lines.push(cleanDesc);
    lines.push("");
  }

  // Product Details section
  lines.push("Product Details:");
  if (product.brand) lines.push(`\u2022 Brand: ${product.brand}`);
  if (product.model) lines.push(`\u2022 Model: ${product.model}`);
  if (product.mpn) lines.push(`\u2022 MPN: ${product.mpn}`);
  if (product.color) lines.push(`\u2022 Color: ${product.color}`);
  if (product.material) lines.push(`\u2022 Material: ${product.material}`);
  if (product.dimensions) lines.push(`\u2022 Dimensions: ${product.dimensions}`);
  if (product.weight) lines.push(`\u2022 Weight: ${product.weight}`);

  // Add specifications
  if (product.specifications) {
    for (const [key, value] of Object.entries(product.specifications)) {
      // Skip already added fields
      if (
        !["brand", "model", "color", "material", "mpn"].includes(
          key.toLowerCase()
        )
      ) {
        lines.push(`\u2022 ${key}: ${value}`);
      }
    }
  }
  lines.push("");

  // Features section (if available)
  if (product.features && product.features.length > 0) {
    lines.push("Features:");
    for (const feature of product.features.slice(0, 8)) {
      lines.push(`\u2022 ${feature}`);
    }
    lines.push("");
  }

  // Condition section
  if (condition) {
    lines.push(`Condition: ${condition}`);
    lines.push("");
  }

  // User notes
  if (userNotes) {
    lines.push(userNotes);
    lines.push("");
  }

  // MSRP
  if (msrp) {
    lines.push(`MSRP $${msrp.toFixed(0)} + Tax.`);
    lines.push("");
  }

  // Signature
  lines.push("100% Seller Rating! Happy Shopping!");

  return lines.join("\n");
}

export function generateItemSpecifics(
  product: ExtractedProduct
): Record<string, string> {
  const specifics: Record<string, string> = {};

  if (product.brand) specifics["Brand"] = product.brand;
  if (product.model) specifics["Model"] = product.model;
  if (product.mpn) specifics["MPN"] = product.mpn;
  if (product.gtin) specifics["UPC"] = product.gtin;
  if (product.color) specifics["Color"] = product.color;
  if (product.material) specifics["Material"] = product.material;

  // Add from specifications
  if (product.specifications) {
    for (const [key, value] of Object.entries(product.specifications)) {
      // Normalize key
      const normalizedKey = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      specifics[normalizedKey] = value;
    }
  }

  return specifics;
}
