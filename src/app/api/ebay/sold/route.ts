import { NextResponse } from "next/server";
import { searchSoldListings, isConnected } from "@/lib/ebay/client";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Check if connected to eBay
    const connected = await isConnected();
    if (!connected) {
      // Return empty results if not connected (not an error)
      return NextResponse.json({ comps: [], connected: false });
    }

    const comps = await searchSoldListings(query, 10);

    return NextResponse.json({ comps, connected: true });
  } catch (error) {
    console.error("Sold listings error:", error);
    // Don't fail the whole flow, just return empty
    return NextResponse.json({ comps: [], error: "Failed to fetch comps" });
  }
}
