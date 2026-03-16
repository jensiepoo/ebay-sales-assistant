"use client";

import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListingData } from "./listing-editor";

interface ListingPreviewProps {
  data: ListingData;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting?: boolean;
}

export function ListingPreview({
  data,
  onBack,
  onSubmit,
  isSubmitting,
}: ListingPreviewProps) {
  const allImages = [
    ...data.selectedStockImages,
    ...data.userPhotos.map((f) => f.preview),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Listing Preview</h2>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Images */}
          {allImages.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allImages.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Image ${i + 1}`}
                  className="h-32 w-32 object-cover rounded flex-shrink-0"
                />
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-xl font-bold">{data.title || "No title"}</h1>

          {/* Price & Badges */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-green-600">
              ${data.price || "0.00"}
            </span>
            <Badge>{data.condition || "No condition"}</Badge>
          </div>

          {/* Policies */}
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span>{data.shippingPolicy}</span>
            <span>•</span>
            <span>{data.returnPolicy}</span>
          </div>

          {/* Description */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Description</h3>
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {data.description || "No description"}
            </pre>
          </div>

          {/* Item Specifics */}
          {Object.keys(data.itemSpecifics).length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Item Specifics</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(data.itemSpecifics).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-muted-foreground">{key}:</span>{" "}
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seller Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seller</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
              J
            </div>
            <div>
              <p className="font-medium">jensiepoo72</p>
              <p className="text-sm text-green-600">100% Positive Feedback</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        className="w-full"
        size="lg"
        onClick={onSubmit}
        disabled={isSubmitting || !data.title || !data.price}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting to eBay...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit to eBay
          </>
        )}
      </Button>
    </div>
  );
}
