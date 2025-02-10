import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const produk = await prisma.detail_penjualan.findMany({
      where: search
        ? {
            produk: {
              nama_produk: {
                contains: search.trim().toLowerCase(),
                mode: "insensitive",
              },
            },
          }
        : undefined,
      include: {
        produk: {
          select: { nama_produk: true, harga_jual: true },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(produk, { status: 200 });
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
