"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Save, Eye, Sparkles, Loader2 } from "lucide-react";
import { FileUploader, UploadedFile } from "./file-uploader";
import { ListingPreview } from "./listing-preview";

export interface ListingData {
  title: string;
  description: string;
  price: string;
  condition: string;
  shippingPolicy: string;
  returnPolicy: string;
  selectedStockImages: string[];
  userPhotos: UploadedFile[];
  itemSpecifics: Record<string, string>;
}

export interface ProductContext {
  productName?: string;
  brand?: string;
  model?: string;
  features?: string[];
  specifications?: Record<string, string>;
  msrp?: number;
}

interface ListingEditorProps {
  initialData: ListingData;
  onSave: (data: ListingData) => void;
  onSubmit: (data: ListingData) => Promise<void>;
  stockImages?: string[];
  isSubmitting?: boolean;
  productContext?: ProductContext;
}

const CONDITIONS = ["New", "Like New", "Good", "Acceptable"];
const SHIPPING_OPTIONS = ["Free Shipping", "Calculated", "Flat Rate"];
const RETURN_OPTIONS = ["No Returns", "30 Day Returns", "60 Day Returns"];

export function ListingEditor({
  initialData,
  onSave,
  onSubmit,
  stockImages = [],
  isSubmitting,
  productContext,
}: ListingEditorProps) {
  const [data, setData] = useState<ListingData>(initialData);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Check if AI is enabled
  useEffect(() => {
    fetch("/api/ai/describe")
      .then((res) => res.json())
      .then((data) => setAiEnabled(data.enabled))
      .catch(() => setAiEnabled(false));
  }, []);

  const generateWithAI = async () => {
    if (!productContext?.productName) return;

    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productContext.productName,
          brand: productContext.brand,
          model: productContext.model,
          features: productContext.features,
          specifications: productContext.specifications,
          condition: data.condition,
          msrp: productContext.msrp,
        }),
      });
      const result = await res.json();
      if (result.description) {
        updateField("description", result.description);
      }
    } catch (err) {
      console.error("AI generation failed:", err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      onSave(data);
      setLastSaved(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [data, onSave]);

  const updateField = <K extends keyof ListingData>(
    field: K,
    value: ListingData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const copyDescription = () => {
    navigator.clipboard.writeText(data.description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    await onSubmit(data);
  };

  const titleLength = data.title.length;
  const titleOverLimit = titleLength > 80;

  if (showPreview) {
    return (
      <ListingPreview
        data={data}
        onBack={() => setShowPreview(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Edit Listing</span>
            {lastSaved && (
              <span className="text-xs font-normal text-muted-foreground">
                Auto-saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Title</label>
              <span
                className={`text-xs ${titleOverLimit ? "text-destructive" : "text-muted-foreground"}`}
              >
                {titleLength}/80
              </span>
            </div>
            <Input
              value={data.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Product title (max 80 characters)"
              className={titleOverLimit ? "border-destructive" : ""}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Description</label>
              <div className="flex gap-1">
                {aiEnabled && productContext?.productName && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateWithAI}
                    disabled={aiGenerating}
                  >
                    {aiGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {aiGenerating ? "Generating..." : "AI Generate"}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={copyDescription}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
            </div>
            <Textarea
              value={data.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Product description..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Price</label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                step="0.01"
                value={data.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="0.00"
                className="w-32"
              />
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Condition</label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((condition) => (
                <Badge
                  key={condition}
                  variant={data.condition === condition ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => updateField("condition", condition)}
                >
                  {condition}
                </Badge>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Shipping</label>
            <div className="flex flex-wrap gap-2">
              {SHIPPING_OPTIONS.map((option) => (
                <Badge
                  key={option}
                  variant={data.shippingPolicy === option ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => updateField("shippingPolicy", option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>

          {/* Returns */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Returns</label>
            <div className="flex flex-wrap gap-2">
              {RETURN_OPTIONS.map((option) => (
                <Badge
                  key={option}
                  variant={data.returnPolicy === option ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => updateField("returnPolicy", option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Images */}
      {stockImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {stockImages.map((url, i) => (
                <div
                  key={i}
                  className={`relative cursor-pointer rounded border-2 transition-colors ${
                    data.selectedStockImages.includes(url)
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground"
                  }`}
                  onClick={() => {
                    const selected = data.selectedStockImages.includes(url)
                      ? data.selectedStockImages.filter((u) => u !== url)
                      : [...data.selectedStockImages, url];
                    updateField("selectedStockImages", selected);
                  }}
                >
                  <img
                    src={url}
                    alt={`Stock ${i + 1}`}
                    className="h-24 w-full object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {data.selectedStockImages.includes(url) && (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                      {data.selectedStockImages.indexOf(url) + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Photos */}
      <FileUploader
        files={data.userPhotos}
        onChange={(files) => updateField("userPhotos", files)}
        maxFiles={12 - data.selectedStockImages.length}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            onSave(data);
            setLastSaved(new Date());
          }}
        >
          <Save className="h-4 w-4" />
          Save Draft
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setShowPreview(true)}
        >
          <Eye className="h-4 w-4" />
          Preview
        </Button>
      </div>
    </div>
  );
}
