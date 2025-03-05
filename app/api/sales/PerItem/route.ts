import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const startDate =
      searchParams.get("startDate") || format(new Date(), "yyyy-MM-dd");
    const endDate =
      searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const salesData = await prisma.detail_penjualan.findMany({
      where: {
        tanggal_penjualan: {
          gte: new Date(`${startDate}T00:00:00`),
          lte: new Date(`${endDate}T23:59:59`),
        },
        isDeleted: false,
      },
      include: {
        produk: true,
      },
    });

    const groupedSales = salesData.reduce((acc, item) => {
      const { id, nama_produk, harga_jual, harga_beli } = item.produk;
      if (!acc[id]) {
        acc[id] = {
          nama_barang: nama_produk,
          harga_satuan: Number(harga_jual),
          qty_terjual: 0,
          neto: 0,
          untung: 0,
          tgl_penjualan: item.tanggal_penjualan,
        };
      }
      acc[id].qty_terjual += Number(item.qty);
      acc[id].neto += Number(item.total_harga);
      acc[id].untung +=
        Number(item.qty) * (Number(item.harga_jual) - Number(harga_beli ?? 0));
      return acc;
    }, {} as Record<string, any>);

    const sales = Object.values(groupedSales)
      .sort((a, b) => b.qty_terjual - a.qty_terjual)
      .slice(skip, skip + limit)
      .map((item) => ({
        ...item,
        harga_satuan: Number(item.harga_satuan),
        qty_terjual: Number(item.qty_terjual),
        neto: Number(item.neto),
        untung: Number(item.untung),
        tgl_penjualan: format(new Date(item.tgl_penjualan), "dd-MM-yyyy"),
      }));

    const total = Object.keys(groupedSales).length;
    const summary = {
      total_penjualan: sales.reduce((sum, item) => sum + item.neto, 0),
      total_untung: sales.reduce((sum, item) => sum + item.untung, 0),
      total_qty: sales.reduce((sum, item) => sum + item.qty_terjual, 0),
    };

    return NextResponse.json({ sales, total, summary });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
