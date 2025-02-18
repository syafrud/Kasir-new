import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const skip = (page - 1) * limit;

    const totalCount = await prisma.produk.count({
      where: search
        ? {
            nama_produk: {
              contains: search.trim().toLowerCase(),
            },
          }
        : undefined,
    });

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
      skip,
      take: limit,
    });

    return NextResponse.json(
      {
        produk,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
