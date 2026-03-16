"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SuccessAnimationProps {
  listingUrl?: string;
  onNewListing: () => void;
}

export function SuccessAnimation({
  listingUrl,
  onNewListing,
}: SuccessAnimationProps) {
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // Fire confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#22c55e", "#3b82f6", "#f59e0b"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#22c55e", "#3b82f6", "#f59e0b"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <Card className="text-center">
      <CardContent className="pt-8 pb-8 space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-green-600">
            Listing Created!
          </h2>
          <p className="text-muted-foreground mt-2">
            Your item is now live on eBay
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          {listingUrl && (
            <Button asChild>
              <a href={listingUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                View on eBay
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={onNewListing}>
            Create Another Listing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
