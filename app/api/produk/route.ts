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
