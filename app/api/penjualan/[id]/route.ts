// api/penjualan/[id]
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split("/").pop();

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid ID provided" },
        { status: 400 }
      );
    }

    const penjualan = await prisma.penjualan.findUnique({
      where: { id: Number(id) },
      include: {
        users: {
          select: {
            nama_user: true,
          },
        },
        pelanggan: {
          select: {
            nama: true,
            alamat: true,
          },
        },
        detail_penjualan: {
          where: {
            isDeleted: false,
          },
          include: {
            produk: {
              select: {
                nama_produk: true,
                harga_jual: true,
              },
            },
            event_produk: {
              include: {
                event: {
                  select: {
                    nama_event: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!penjualan) {
      return NextResponse.json(
        { error: "Penjualan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(penjualan);
  } catch (error) {
    console.error("Error fetching penjualan:", error);
    return NextResponse.json(
      { error: "Failed to fetch penjualan" },
      { status: 500 }
    );
  }
}
