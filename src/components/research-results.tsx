"use client";

import { ExternalLink, Copy, Check, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExtractedProduct } from "@/lib/scraper/extractors/json-ld";

interface ResearchResultsProps {
  product: ExtractedProduct;
  sourceUrl: string;
  onContinue: () => void;
  isLoading?: boolean;
}

export function ResearchResults({ product, sourceUrl, onContinue, isLoading }: ResearchResultsProps) {
  const [copied, setCopied] = useState(false);

  const missingFields: string[] = [];
  if (!product.brand) missingFields.push("Brand");
  if (!product.model) missingFields.push("Model");
  if (!product.description) missingFields.push("Description");

  const copySpecs = () => {
    const specs = [
      product.brand && `Brand: ${product.brand}`,
      product.model && `Model: ${product.model}`,
      product.mpn && `MPN: ${product.mpn}`,
      product.gtin && `UPC: ${product.gtin}`,
      product.color && `Color: ${product.color}`,
      product.material && `Material: ${product.material}`,
      ...Object.entries(product.specifications || {}).map(
        ([k, v]) => `${k}: ${v}`
      ),
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(specs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{product.name || "Product Research"}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  {new URL(sourceUrl).hostname}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={copySpecs}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copy Specs
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {missingFields.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Some data couldn't be extracted
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Missing: {missingFields.join(", ")}. You can fill these in manually.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {product.brand && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brand</span>
                <span className="font-medium">{product.brand}</span>
              </div>
            )}
            {product.model && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="font-medium">{product.model}</span>
              </div>
            )}
            {product.mpn && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">MPN</span>
                <span className="font-medium">{product.mpn}</span>
              </div>
            )}
            {product.gtin && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">UPC/GTIN</span>
                <span className="font-medium">{product.gtin}</span>
              </div>
            )}
            {product.color && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Color</span>
                <span className="font-medium">{product.color}</span>
              </div>
            )}
            {product.material && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Material</span>
                <span className="font-medium">{product.material}</span>
              </div>
            )}
            {product.price && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">MSRP</span>
                <span className="font-medium">
                  ${product.price.toFixed(2)} {product.currency}
                </span>
              </div>
            )}
          </div>

          {product.description && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-sm line-clamp-4">{product.description}</p>
            </div>
          )}

          {product.features && product.features.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground mb-2">Features</p>
              <ul className="text-sm space-y-1">
                {product.features.slice(0, 6).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span className="line-clamp-1">{feature}</span>
                  </li>
                ))}
                {product.features.length > 6 && (
                  <li className="text-muted-foreground">
                    +{product.features.length - 6} more...
                  </li>
                )}
              </ul>
            </div>
          )}

          {product.images && product.images.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Found {product.images.length} image(s)
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.slice(0, 4).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Product image ${i + 1}`}
                    className="h-20 w-20 object-cover rounded border flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {product.specifications &&
            Object.keys(product.specifications).length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Additional Specifications
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(product.specifications)
                    .slice(0, 8)
                    .map(([key, value]) => (
                      <Badge key={key} variant="secondary">
                        {key}: {value}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      <Button className="w-full" onClick={onContinue} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating with AI...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Continue to Edit Listing
          </>
        )}
      </Button>
    </div>
  );
}
