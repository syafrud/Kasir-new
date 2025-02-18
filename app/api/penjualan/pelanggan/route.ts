import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const pelanggan = await prisma.pelanggan.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        nama: true,
      },
    });

    return NextResponse.json({ pelanggan }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch penjualan data" },
      { status: 500 }
    );
  }
}
