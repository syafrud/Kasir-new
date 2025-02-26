import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // Await the params object
    const parsedId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const details = await prisma.detail_penjualan.findMany({
      where: {
        id_penjualan: parsedId,
        ...(search
          ? {
              produk: {
                nama_produk: {
                  contains: search.trim().toLowerCase(),
                },
              },
            }
          : {}),
      },
      include: {
        produk: {
          select: { nama_produk: true, harga_jual: true },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(details, { status: 200 });
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
