// app/api/event/[id]/product/route.ts
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const eventId = parseInt(id);

  try {
    const eventProducts = await prisma.event_produk.findMany({
      where: {
        id_event: eventId,
        isDeleted: false,
      },
      include: {
        produk: true,
      },
    });

    return NextResponse.json(eventProducts);
  } catch (error) {
    console.error("Error fetching event products:", error);
    return NextResponse.json(
      { error: "Failed to fetch event products" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const eventId = parseInt(id);

  try {
    const body = await request.json();
    const { id_produk, diskon } = body;

    if (!id_produk || diskon === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.event_produk.findFirst({
      where: {
        id_event: eventId,
        id_produk: id_produk,
        isDeleted: false,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product already added to this event" },
        { status: 400 }
      );
    }

    const eventProduct = await prisma.event_produk.create({
      data: {
        id_event: eventId,
        id_produk: id_produk,
        diskon: diskon,
      },
    });

    return NextResponse.json(eventProduct, { status: 201 });
  } catch (error) {
    console.error("Error adding product to event:", error);
    return NextResponse.json(
      { error: "Failed to add product to event" },
      { status: 500 }
    );
  }
}
