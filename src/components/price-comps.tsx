"use client";

import { TrendingUp, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

export interface PriceComp {
  title: string;
  price: number;
  condition: string;
  soldDate: Date;
  listingUrl: string;
  imageUrl?: string;
}

interface PriceCompsProps {
  comps: PriceComp[];
  isLoading?: boolean;
}

export function PriceComps({ comps, isLoading }: PriceCompsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Price Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (comps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Price Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent sold listings found for comparison.
          </p>
        </CardContent>
      </Card>
    );
  }

  const avgPrice = comps.reduce((sum, c) => sum + c.price, 0) / comps.length;
  const minPrice = Math.min(...comps.map((c) => c.price));
  const maxPrice = Math.max(...comps.map((c) => c.price));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Price Intelligence
        </CardTitle>
        <CardDescription>
          Based on {comps.length} recent sold listing{comps.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(avgPrice)}
            </p>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{formatPrice(minPrice)}</p>
            <p className="text-xs text-muted-foreground">Low</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{formatPrice(maxPrice)}</p>
            <p className="text-xs text-muted-foreground">High</p>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          {comps.slice(0, 5).map((comp, i) => (
            <a
              key={i}
              href={comp.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors"
            >
              {comp.imageUrl && (
                <img
                  src={comp.imageUrl}
                  alt=""
                  className="h-12 w-12 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{comp.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {comp.condition}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Sold {formatDate(new Date(comp.soldDate))}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatPrice(comp.price)}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
