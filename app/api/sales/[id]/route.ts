// app/api/sales/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = Number((await params).id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid invoice ID" },
        { status: 400 }
      );
    }

    const sale = await prisma.penjualan.findUnique({
      where: { id },
      include: {
        detail_penjualan: {
          where: { isDeleted: false },
          include: {
            produk: {
              select: { id: true, nama_produk: true },
            },
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }

    const items =
      sale.detail_penjualan.map((item) => ({
        id: item.produk.id,
        produk_nama: item.produk.nama_produk,
        diskon: item.diskon,
        qty: item.qty,
        harga_jual: item.harga_jual,
        subtotal: item.qty * (Number(item.harga_jual) - Number(item.diskon)),
      })) || [];

    const totalSubtotal = items.reduce((acc, item) => acc + item.subtotal, 0);

    return NextResponse.json({ items, totalSubtotal });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
