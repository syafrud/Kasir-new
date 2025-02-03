import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    console.log("Raw search parameter:", search);

    const penjualan = await prisma.penjualan.findMany({
      where: search
        ? {
            tanggal_penjualan: {
              equals: new Date(search),
            },
          }
        : undefined,
      include: {
        users: {
          select: { nama_user: true },
        },
        pelanggan: {
          select: { nama: true },
        },
      },
      orderBy: { id: "asc" },
    });

    console.log("Kategori results:", penjualan);

    return NextResponse.json(penjualan, { status: 200 });
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
