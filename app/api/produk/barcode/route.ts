import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await prisma.produk.findMany({
      select: {
        id: true,
        nama_produk: true,
        barcode: true,
        harga_jual: true,
      },
    });

    const formattedProducts = products.map((product) => ({
      ...product,
      harga_jual: product.harga_jual.toString(),
    }));

    return NextResponse.json(formattedProducts || []);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
