import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode } = await context.params;

    if (!barcode) {
      return NextResponse.json(
        { error: "Barcode is required" },
        { status: 400 }
      );
    }

    const produk = await prisma.produk.findFirst({
      where: {
        barcode: barcode,
        isDeleted: false,
      },
    });

    if (!produk) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan" },
        { status: 200 }
      );
    }

    return NextResponse.json({ produk }, { status: 200 });
  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data produk" },
      { status: 500 }
    );
  }
}
