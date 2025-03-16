// app/api/stock-history/route.ts
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const productId = searchParams.get("productId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filter: any = {};

    if (productId) {
      filter.id_produk = parseInt(productId);
    } else if (categoryId) {
      filter.produk = {
        id_kategori: parseInt(categoryId),
      };
    }

    if (startDate || endDate) {
      filter.created_at = {};

      if (startDate) {
        filter.created_at.gte = new Date(startDate);
      }

      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.created_at.lte = new Date(
          endDateTime.getTime() + 7 * 60 * 60 * 1000
        );
      }
    }

    const stockHistory = await prisma.stok_management.findMany({
      where: filter,
      include: {
        produk: {
          include: {
            kategori: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
    console.log("Applied filter:", filter);
    console.log("Today's date:", new Date().toISOString());
    return NextResponse.json(stockHistory);
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock history" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
