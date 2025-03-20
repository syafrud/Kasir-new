// app/api/event/product/[id]/route.ts
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const newID = parseInt(id);

  try {
    const body = await request.json();
    const { diskon } = body;

    if (diskon === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const eventProduct = await prisma.event_produk.update({
      where: {
        id: newID,
      },
      data: {
        diskon: diskon,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(eventProduct);
  } catch (error) {
    console.error("Error updating event product:", error);
    return NextResponse.json(
      { error: "Failed to update event product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const newID = parseInt(id);

  try {
    const eventProduct = await prisma.event_produk.update({
      where: {
        id: newID,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json(eventProduct);
  } catch (error) {
    console.error("Error deleting event product:", error);
    return NextResponse.json(
      { error: "Failed to delete event product" },
      { status: 500 }
    );
  }
}
