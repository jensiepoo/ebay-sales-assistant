"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchForm } from "@/components/search-form";
import { ProductCandidates, Candidate } from "@/components/product-candidates";
import { UrlPasteFallback } from "@/components/url-paste-fallback";
import { ResearchResults } from "@/components/research-results";
import { PriceComps, PriceComp } from "@/components/price-comps";
import { ListingEditor, ListingData } from "@/components/listing-editor";
import { SuccessAnimation } from "@/components/success-animation";
import { DebugPanel } from "@/components/debug-panel";
import { generateTitle, generateDescription, generateItemSpecifics } from "@/lib/templates/description";
import { ExtractedProduct } from "@/lib/scraper/extractors/json-ld";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type Stage =
  | "search"
  | "candidates"
  | "url-paste"
  | "researching"
  | "results"
  | "editing"
  | "success";

export default function Home() {
  const [stage, setStage] = useState<Stage>("search");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);

  // Search state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchSource, setSearchSource] = useState<string>("");

  // Research state
  const [product, setProduct] = useState<ExtractedProduct | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [researchId, setResearchId] = useState<number | null>(null);
  const [priceComps, setPriceComps] = useState<PriceComp[]>([]);
  const [compsLoading, setCompsLoading] = useState(false);

  // Listing state
  const [listingData, setListingData] = useState<ListingData | null>(null);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [listingUrl, setListingUrl] = useState<string | null>(null);

  // Check for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      setConnected(true);
      window.history.replaceState({}, "", "/");
    }
    if (params.get("error")) {
      setError("Failed to connect to eBay. Please try again.");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }

      setCandidates(data.results);
      setSearchSource(data.source);
      setStage(data.results.length > 0 ? "candidates" : "url-paste");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setStage("url-paste");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCandidate = async (url: string) => {
    await researchProduct(url);
  };

  const researchProduct = async (url: string) => {
    setStage("researching");
    setIsLoading(true);
    setError(null);
    setSourceUrl(url);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Research failed");
      }

      setProduct(data.product);
      setResearchId(data.researchId);
      setStage("results");

      // Fetch price comps in background
      fetchPriceComps(data.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed");
      setStage("url-paste");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPriceComps = async (product: ExtractedProduct) => {
    setCompsLoading(true);
    try {
      const query = [product.brand, product.model, product.name]
        .filter(Boolean)
        .join(" ");

      const res = await fetch("/api/ebay/sold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      setPriceComps(data.comps || []);
      if (data.connected !== undefined) {
        setConnected(data.connected);
      }
    } catch {
      // Don't show error, comps are optional
    } finally {
      setCompsLoading(false);
    }
  };

  const handleContinueToEdit = async () => {
    if (!product) return;

    const title = generateTitle(product);
    const itemSpecifics = generateItemSpecifics(product);

    // Try AI generation first, fall back to template
    let description: string;
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product.name,
          brand: product.brand,
          model: product.model,
          features: product.features,
          specifications: product.specifications,
          msrp: product.price,
        }),
      });
      const data = await res.json();

      if (data.description) {
        description = data.description;
        console.log("[AI] Generated description with AI");
      } else {
        description = generateDescription({ product });
        console.log("[AI] Fell back to template");
      }
    } catch {
      description = generateDescription({ product });
      console.log("[AI] Error, fell back to template");
    }

    setIsLoading(false);

    setListingData({
      title,
      description,
      price: product.price?.toString() || "",
      condition: "Like New",
      shippingPolicy: "Free Shipping",
      returnPolicy: "No Returns",
      selectedStockImages: product.images?.slice(0, 4) || [],
      userPhotos: [],
      itemSpecifics,
    });

    setStage("editing");
  };

  const handleSaveDraft = useCallback(
    async (data: ListingData) => {
      try {
        if (draftId) {
          await fetch("/api/drafts", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: draftId, ...data }),
          });
        } else {
          const res = await fetch("/api/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ researchId, ...data }),
          });
          const saved = await res.json();
          if (saved.id) {
            setDraftId(saved.id);
          }
        }
      } catch (err) {
        console.error("Failed to save draft:", err);
      }
    },
    [draftId, researchId]
  );

  const handleSubmitListing = async (data: ListingData) => {
    setIsLoading(true);
    setError(null);

    try {
      // First download stock images if needed
      if (data.selectedStockImages.length > 0 && product?.name) {
        await fetch("/api/images/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: data.selectedStockImages,
            productName: product.name,
          }),
        });
      }

      // Submit to eBay
      const res = await fetch("/api/ebay/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          draftId,
          images: data.selectedStockImages,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to create listing");
      }

      setListingUrl(result.listingUrl);
      setStage("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setIsLoading(false);
    }
  };

  const resetToStart = () => {
    setStage("search");
    setCandidates([]);
    setProduct(null);
    setSourceUrl("");
    setResearchId(null);
    setPriceComps([]);
    setListingData(null);
    setDraftId(null);
    setListingUrl(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Connection status */}
      {connected === true && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Connected to eBay as jensiepoo72
          </AlertDescription>
        </Alert>
      )}

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Stage */}
      {stage === "search" && (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Research a Product</h1>
            <p className="text-muted-foreground">
              Enter a product name, brand, or model to research
            </p>
          </div>
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        </div>
      )}

      {/* Candidates Stage */}
      {stage === "candidates" && (
        <div className="space-y-4">
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          {searchSource && (
            <p className="text-xs text-muted-foreground">
              Results from {searchSource}
            </p>
          )}
          <ProductCandidates
            candidates={candidates}
            onSelect={handleSelectCandidate}
            onNoneMatch={() => setStage("url-paste")}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* URL Paste Stage */}
      {stage === "url-paste" && (
        <div className="space-y-4">
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          <UrlPasteFallback
            onSubmit={researchProduct}
            onBack={candidates.length > 0 ? () => setStage("candidates") : undefined}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Researching Stage */}
      {stage === "researching" && (
        <div className="text-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div>
            <p className="font-medium">Researching product...</p>
            <p className="text-sm text-muted-foreground">{sourceUrl}</p>
          </div>
        </div>
      )}

      {/* Results Stage */}
      {stage === "results" && product && (
        <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
          <div className="space-y-4 min-w-0">
            <ResearchResults
              product={product}
              sourceUrl={sourceUrl}
              onContinue={handleContinueToEdit}
              isLoading={isLoading}
            />
            <DebugPanel
              data={{
                product,
                sourceUrl,
                researchId,
              }}
              title="Raw Research Data"
            />
          </div>
          <div className="lg:sticky lg:top-4 lg:self-start">
            <PriceComps comps={priceComps} isLoading={compsLoading} />
          </div>
        </div>
      )}

      {/* Editing Stage */}
      {stage === "editing" && listingData && (
        <ListingEditor
          initialData={listingData}
          onSave={handleSaveDraft}
          onSubmit={handleSubmitListing}
          stockImages={product?.images}
          isSubmitting={isLoading}
          productContext={product ? {
            productName: product.name,
            brand: product.brand,
            model: product.model,
            features: product.features,
            specifications: product.specifications,
            msrp: product.price,
          } : undefined}
        />
      )}

      {/* Success Stage */}
      {stage === "success" && (
        <SuccessAnimation listingUrl={listingUrl || undefined} onNewListing={resetToStart} />
      )}
    </div>
  );
}
