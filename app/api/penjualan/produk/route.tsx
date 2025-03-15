import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const skip = (page - 1) * limit;

    const showDeleted = searchParams.get("showDeleted") === "true";

    const baseCondition = search
      ? {
          OR: [
            {
              nama_produk: {
                contains: search.trim().toLowerCase(),
              },
            },
            {
              barcode: {
                contains: search.trim(),
              },
            },
          ],
        }
      : {};

    const whereCondition = {
      ...baseCondition,
      ...(showDeleted ? {} : { isDeleted: false }),
    };

    const produk = await prisma.produk.findMany({
      where: whereCondition,
      include: {
        kategori: {
          select: { nama_kategori: true },
        },
      },
      orderBy: { id: "asc" },
      skip,
    });

    return NextResponse.json(
      {
        produk,
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
