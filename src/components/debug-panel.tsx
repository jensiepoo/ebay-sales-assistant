"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DebugPanelProps {
  data: Record<string, unknown>;
  title?: string;
}

export function DebugPanel({ data, title = "Debug Data" }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-lg">
      <Button
        variant="ghost"
        className="w-full justify-between px-4 py-2 h-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bug className="h-4 w-4" />
          {title}
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      <div
        className={cn(
          "overflow-hidden transition-all",
          isOpen ? "max-h-[500px]" : "max-h-0"
        )}
      >
        <div className="p-4 border-t bg-muted/30">
          <pre className="text-xs font-mono overflow-auto max-h-[400px] whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
