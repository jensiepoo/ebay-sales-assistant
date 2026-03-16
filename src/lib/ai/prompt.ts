import { GenerateDescriptionInput } from "./types";

export function buildPrompt(input: GenerateDescriptionInput): string {
  const specs = input.specifications
    ? Object.entries(input.specifications)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n")
    : "None provided";

  const features = input.features?.length
    ? input.features.map((f) => `- ${f}`).join("\n")
    : "None provided";

  return `Generate an eBay listing description for this product. Use a professional, engaging tone.

Product: ${input.productName}
Brand: ${input.brand || "Unknown"}
Model: ${input.model || "Unknown"}
Condition: ${input.condition || "Not specified"}
MSRP: ${input.msrp ? `$${input.msrp}` : "Unknown"}

Specifications:
${specs}

Features:
${features}

Format the description as:
1. A compelling opening paragraph (2-3 sentences)
2. "Product Details:" section with bullet points
3. "Features:" section with bullet points (if features provided)
4. Condition note if specified
5. MSRP line if known
6. End with: "100% Seller Rating! Happy Shopping!"

Keep it concise but informative. Do not use markdown formatting - plain text only with bullet points (•).`;
}
