"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, parseJsonSafe } from "@/lib/utils";

interface ResearchItem {
  id: number;
  productName: string;
  brand?: string;
  model?: string;
  sourceUrl?: string;
  images?: string;
  createdAt: string | number | Date;
}

function safeFormatDate(value: string | number | Date | undefined): string {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return formatDate(date);
  } catch {
    return "";
  }
}

export default function HistoryPage() {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          const data = await res.json();
          setItems(data);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Research History</h1>
          <p className="text-muted-foreground">
            View past product research sessions
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium">No research history yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Research a product to see it here
            </p>
            <Link href="/">
              <Button className="mt-4">Research a Product</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const images = parseJsonSafe<string[]>(item.images);
            const firstImage = images?.[0];

            return (
              <Card key={item.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  {firstImage && (
                    <img
                      src={firstImage}
                      alt=""
                      className="h-16 w-16 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{item.productName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {item.brand && (
                        <Badge variant="secondary">{item.brand}</Badge>
                      )}
                      {item.model && (
                        <Badge variant="outline">{item.model}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {safeFormatDate(item.createdAt)}
                    </p>
                  </div>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
