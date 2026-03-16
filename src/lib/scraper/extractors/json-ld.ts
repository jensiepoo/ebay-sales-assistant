import { Page } from "playwright";

export interface ExtractedProduct {
  name?: string;
  brand?: string;
  model?: string;
  mpn?: string;
  gtin?: string;
  sku?: string;
  description?: string;
  features?: string[];
  specifications?: Record<string, string>;
  images?: string[];
  price?: number;
  currency?: string;
  category?: string;
  color?: string;
  material?: string;
  weight?: string;
  dimensions?: string;
  rawJsonLd?: string;
}

export async function extractJsonLd(page: Page): Promise<ExtractedProduct> {
  const jsonLdScripts = await page.$$eval(
    'script[type="application/ld+json"]',
    (scripts) => scripts.map((s) => s.textContent).filter(Boolean)
  );

  const product: ExtractedProduct = {
    features: [],
    specifications: {},
    images: [],
  };

  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script!);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item["@type"] === "Product" || item["@type"]?.includes("Product")) {
          extractProductData(item, product);
        }
        // Handle @graph structure
        if (item["@graph"]) {
          for (const graphItem of item["@graph"]) {
            if (
              graphItem["@type"] === "Product" ||
              graphItem["@type"]?.includes("Product")
            ) {
              extractProductData(graphItem, product);
            }
          }
        }
      }
    } catch {
      // Skip invalid JSON
    }
  }

  if (jsonLdScripts.length > 0) {
    product.rawJsonLd = JSON.stringify(jsonLdScripts);
  }

  return product;
}

function extractProductData(
  data: Record<string, unknown>,
  product: ExtractedProduct
): void {
  // Basic info
  if (data.name && typeof data.name === "string") {
    product.name = data.name;
  }

  if (data.description && typeof data.description === "string") {
    product.description = data.description;
  }

  if (data.sku && typeof data.sku === "string") {
    product.sku = data.sku;
  }

  if (data.mpn && typeof data.mpn === "string") {
    product.mpn = data.mpn;
  }

  if (data.gtin && typeof data.gtin === "string") {
    product.gtin = data.gtin;
  }
  if (data.gtin12 && typeof data.gtin12 === "string") {
    product.gtin = data.gtin12;
  }
  if (data.gtin13 && typeof data.gtin13 === "string") {
    product.gtin = data.gtin13;
  }

  // Brand
  if (data.brand) {
    if (typeof data.brand === "string") {
      product.brand = data.brand;
    } else if (typeof data.brand === "object" && data.brand !== null) {
      const brandObj = data.brand as Record<string, unknown>;
      if (brandObj.name && typeof brandObj.name === "string") {
        product.brand = brandObj.name;
      }
    }
  }

  // Model
  if (data.model && typeof data.model === "string") {
    product.model = data.model;
  }

  // Category
  if (data.category && typeof data.category === "string") {
    product.category = data.category;
  }

  // Color
  if (data.color && typeof data.color === "string") {
    product.color = data.color;
  }

  // Material
  if (data.material && typeof data.material === "string") {
    product.material = data.material;
  }

  // Weight
  if (data.weight) {
    if (typeof data.weight === "string") {
      product.weight = data.weight;
    } else if (typeof data.weight === "object" && data.weight !== null) {
      const weightObj = data.weight as Record<string, unknown>;
      if (weightObj.value && weightObj.unitCode) {
        product.weight = `${weightObj.value} ${weightObj.unitCode}`;
      }
    }
  }

  // Images
  if (data.image) {
    const images = Array.isArray(data.image) ? data.image : [data.image];
    for (const img of images) {
      let url: string | undefined;
      if (typeof img === "string") {
        url = img;
      } else if (typeof img === "object" && img !== null) {
        const imgObj = img as Record<string, unknown>;
        url =
          (imgObj.url as string) ||
          (imgObj.contentUrl as string) ||
          (imgObj["@id"] as string);
      }
      if (url && !product.images!.includes(url)) {
        product.images!.push(url);
      }
    }
  }

  // Price from offers
  if (data.offers) {
    const offers = Array.isArray(data.offers) ? data.offers : [data.offers];
    for (const offer of offers) {
      if (typeof offer === "object" && offer !== null) {
        const offerObj = offer as Record<string, unknown>;
        if (offerObj.price) {
          product.price = parseFloat(String(offerObj.price));
        }
        if (offerObj.priceCurrency && typeof offerObj.priceCurrency === "string") {
          product.currency = offerObj.priceCurrency;
        }
      }
    }
  }

  // Additional properties
  if (data.additionalProperty && Array.isArray(data.additionalProperty)) {
    for (const prop of data.additionalProperty) {
      if (
        typeof prop === "object" &&
        prop !== null &&
        prop.name &&
        prop.value
      ) {
        product.specifications![String(prop.name)] = String(prop.value);
      }
    }
  }
}
