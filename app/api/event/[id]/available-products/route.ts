// app/api/event/[id]/available-products/route.ts
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = parseInt(params.id);
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";

  try {
    // Find products already added to this event
    const existingProducts = await prisma.event_produk.findMany({
      where: {
        id_event: eventId,
        isDeleted: false,
      },
      select: {
        id_produk: true,
      },
    });

    const existingProductIds = existingProducts.map((p) => p.id_produk);

    // Find products not yet added to this event
    const availableProducts = await prisma.produk.findMany({
      where: {
        isDeleted: false,
        id: {
          notIn: existingProductIds.length > 0 ? existingProductIds : [0], // Avoid empty array
        },
        nama_produk: {
          contains: search,
        },
      },
    });

    return NextResponse.json(availableProducts);
  } catch (error) {
    console.error("Error fetching available products:", error);
    return NextResponse.json(
      { error: "Failed to fetch available products" },
      { status: 500 }
    );
  }
}
