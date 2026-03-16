import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { drafts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const [saved] = await db
      .insert(drafts)
      .values({
        researchId: data.researchId,
        title: data.title,
        description: data.description,
        price: data.price ? parseFloat(data.price) : null,
        condition: data.condition,
        shippingPolicy: data.shippingPolicy,
        returnPolicy: data.returnPolicy,
        selectedImages: data.selectedImages
          ? JSON.stringify(data.selectedImages)
          : null,
        userPhotoPaths: data.userPhotoPaths
          ? JSON.stringify(data.userPhotoPaths)
          : null,
        category: data.category,
        itemSpecifics: data.itemSpecifics
          ? JSON.stringify(data.itemSpecifics)
          : null,
        status: "draft",
      })
      .returning();

    return NextResponse.json({ id: saved.id });
  } catch (error) {
    console.error("Save draft error:", error);
    return NextResponse.json(
      { error: "Failed to save draft" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: "Draft ID is required" },
        { status: 400 }
      );
    }

    await db
      .update(drafts)
      .set({
        title: data.title,
        description: data.description,
        price: data.price ? parseFloat(data.price) : null,
        condition: data.condition,
        shippingPolicy: data.shippingPolicy,
        returnPolicy: data.returnPolicy,
        selectedImages: data.selectedImages
          ? JSON.stringify(data.selectedImages)
          : null,
        userPhotoPaths: data.userPhotoPaths
          ? JSON.stringify(data.userPhotoPaths)
          : null,
        category: data.category,
        itemSpecifics: data.itemSpecifics
          ? JSON.stringify(data.itemSpecifics)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(drafts.id, data.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update draft error:", error);
    return NextResponse.json(
      { error: "Failed to update draft" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const draft = await db.query.drafts.findFirst({
        where: eq(drafts.id, parseInt(id)),
      });
      return NextResponse.json(draft);
    }

    // Return all drafts
    const allDrafts = await db.query.drafts.findMany({
      orderBy: (drafts, { desc }) => [desc(drafts.updatedAt)],
    });

    return NextResponse.json(allDrafts);
  } catch (error) {
    console.error("Get drafts error:", error);
    return NextResponse.json(
      { error: "Failed to get drafts" },
      { status: 500 }
    );
  }
}
