import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/scraper/search";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    console.log(`[Search] Query: "${query}"`);

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    console.log("[Search] Starting Playwright search...");
    const startTime = Date.now();
    const { results, source } = await searchProducts(query);
    console.log(`[Search] Found ${results.length} results from ${source} in ${Date.now() - startTime}ms`);

    return NextResponse.json({ results, source });
  } catch (error) {
    console.error("[Search] Error:", error);
    return NextResponse.json(
      { error: "Search failed. Try pasting a URL directly." },
      { status: 500 }
    );
  }
}
