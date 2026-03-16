import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function GET() {
  try {
    const history = await db.query.researchHistory.findMany({
      orderBy: (research, { desc }) => [desc(research.createdAt)],
      limit: 50,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Get history error:", error);
    return NextResponse.json(
      { error: "Failed to get history" },
      { status: 500 }
    );
  }
}
