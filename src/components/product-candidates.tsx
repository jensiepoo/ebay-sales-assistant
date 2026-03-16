"use client";

import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface Candidate {
  title: string;
  url: string;
  snippet?: string;
  thumbnail?: string;
}

interface ProductCandidatesProps {
  candidates: Candidate[];
  onSelect: (url: string) => void;
  onNoneMatch: () => void;
  isLoading?: boolean;
}

export function ProductCandidates({
  candidates,
  onSelect,
  onNoneMatch,
  isLoading,
}: ProductCandidatesProps) {
  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No results found. Try a different search term or paste a URL directly.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Select the correct product page to research:
      </p>

      <div className="grid gap-3">
        {candidates.map((candidate, index) => (
          <Card
            key={index}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => onSelect(candidate.url)}
          >
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">
                  {candidate.title}
                </h3>
                {candidate.snippet && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {candidate.snippet}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  {new URL(candidate.url).hostname}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={onNoneMatch}
        disabled={isLoading}
      >
        None of these - paste URL instead
      </Button>
    </div>
  );
}
