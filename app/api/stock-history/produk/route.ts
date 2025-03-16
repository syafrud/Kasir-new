// app/api/stock-history/produk/route.ts
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");

    const filter: any = {
      isDeleted: false,
    };

    if (categoryId) {
      filter.id_kategori = parseInt(categoryId);
    }

    const products = await prisma.produk.findMany({
      where: filter,
      orderBy: {
        nama_produk: "asc",
      },
      select: {
        id: true,
        nama_produk: true,
        id_kategori: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
