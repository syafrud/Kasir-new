import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    console.log("Raw search parameter:", search);

    const produk = await prisma.produk.findMany({
      where: search
        ? {
            nama_produk: {
              contains: search.trim().toLowerCase(),
            },
          }
        : undefined,
      include: {
        kategori: {
          select: { nama_kategori: true },
        },
        detail_penjualan: {
          select: {
            qty: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    // Hitung stok yang tersisa setelah dikurangi `qty` dari `detail_penjualan`
    const produkWithUpdatedStock = produk.map((item) => {
      const totalQty = item.detail_penjualan.reduce(
        (sum, dp) => sum + dp.qty,
        0
      );
      return {
        ...item,
        stok_tersisa: Math.max(item.stok - totalQty, 0), // Pastikan tidak negatif
      };
    });

    return NextResponse.json(produkWithUpdatedStock, { status: 200 });
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
