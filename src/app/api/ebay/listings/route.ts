import { NextResponse } from "next/server";
import { createListing, isConnected } from "@/lib/ebay/client";
import { db } from "@/lib/db/client";
import { drafts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }
    if (!data.price) {
      return NextResponse.json(
        { error: "Price is required" },
        { status: 400 }
      );
    }

    // Check eBay connection
    const connected = await isConnected();
    if (!connected) {
      return NextResponse.json(
        { error: "Not connected to eBay. Please authenticate first." },
        { status: 401 }
      );
    }

    // Map condition to eBay format
    const conditionMap: Record<string, string> = {
      New: "NEW",
      "Like New": "LIKE_NEW",
      Good: "GOOD",
      Acceptable: "ACCEPTABLE",
    };

    // Create listing
    const listingId = await createListing({
      title: data.title,
      description: data.description || "",
      price: parseFloat(data.price),
      condition: (conditionMap[data.condition] as "NEW" | "LIKE_NEW" | "GOOD" | "ACCEPTABLE") || "GOOD",
      images: data.images || [],
      itemSpecifics: data.itemSpecifics,
    });

    // Update draft status if draftId provided
    if (data.draftId) {
      await db
        .update(drafts)
        .set({
          status: "submitted",
          ebayListingId: listingId,
          updatedAt: new Date(),
        })
        .where(eq(drafts.id, data.draftId));
    }

    // Generate listing URL
    const baseUrl =
      process.env.EBAY_SANDBOX === "true"
        ? "https://sandbox.ebay.com/itm/"
        : "https://www.ebay.com/itm/";

    return NextResponse.json({
      listingId,
      listingUrl: `${baseUrl}${listingId}`,
    });
  } catch (error) {
    console.error("Create listing error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create listing",
      },
      { status: 500 }
    );
  }
}
