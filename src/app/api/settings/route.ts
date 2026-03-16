import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isConnected } from "@/lib/ebay/client";

export async function GET() {
  try {
    const allSettings = await db.query.settings.findMany();
    const settingsMap: Record<string, string> = {};

    for (const setting of allSettings) {
      settingsMap[setting.key] = setting.value;
    }

    const ebayConnected = await isConnected();

    return NextResponse.json({
      settings: settingsMap,
      ebayConnected,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        // Check if setting exists
        const existing = await db.query.settings.findFirst({
          where: eq(settings.key, key),
        });

        if (existing) {
          await db
            .update(settings)
            .set({ value })
            .where(eq(settings.key, key));
        } else {
          await db.insert(settings).values({ key, value });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
