import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || new Date().toISOString();

    const events = await prisma.event.findMany({
      where: {
        isDeleted: false,
        tanggal_mulai: { lte: new Date(date) },
        tanggal_selesai: { gte: new Date(date) },
      },
      include: {
        event_produk: {
          where: {
            isDeleted: false,
          },
          include: {
            produk: {
              select: {
                id: true,
                nama_produk: true,
                harga_jual: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching active events:", error);
    return NextResponse.json(
      { error: "Failed to fetch active events" },
      { status: 500 }
    );
  }
}
