import { NextResponse } from "next/server";
import { getAIClient, isAIEnabled } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    if (!isAIEnabled()) {
      return NextResponse.json(
        { error: "No AI provider configured", enabled: false },
        { status: 400 }
      );
    }

    const input = await request.json();

    if (!input.productName) {
      return NextResponse.json(
        { error: "productName is required" },
        { status: 400 }
      );
    }

    const client = getAIClient();
    if (!client) {
      return NextResponse.json(
        { error: "Failed to initialize AI client" },
        { status: 500 }
      );
    }

    const description = await client.generateDescription(input);

    return NextResponse.json({ description, enabled: true });
  } catch (error) {
    console.error("AI description error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI generation failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ enabled: isAIEnabled() });
}
