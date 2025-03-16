// app/api/produk/kategori/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    const kategori = await prisma.kategori.findMany({
      where: {
        isDeleted: false,
        ...(search
          ? {
              nama_kategori: {
                contains: search,
              },
            }
          : {}),
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(kategori, { status: 200 });
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
