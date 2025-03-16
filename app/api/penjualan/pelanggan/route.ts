// app/api/penjualan/pelanggan/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const pelanggan = await prisma.pelanggan.findMany({
      where: {
        nama: {
          contains: search.trim(),
        },
        isDeleted: false,
      },
      orderBy: { nama: "asc" },
      select: {
        id: true,
        nama: true,
      },
      take: 10,
    });

    return NextResponse.json({ pelanggan }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pelanggan data" },
      { status: 500 }
    );
  }
}
