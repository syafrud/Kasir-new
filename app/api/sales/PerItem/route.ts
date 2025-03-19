import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { log } from "console";

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
    const customerId = searchParams.get("customerId");
    const skip = (page - 1) * limit;

    const whereClause: any = {
      tanggal_penjualan: {
        gte: new Date(`${startDate}T00:00:00`),
        lte: new Date(`${endDate}T23:59:59`),
      },
      isDeleted: false,
    };

    const salesData = await prisma.detail_penjualan.findMany({
      where: whereClause,
      include: {
        produk: {
          select: {
            id: true,
            nama_produk: true,
          },
        },
        penjualan: {
          include: {
            pelanggan: true,
          },
        },
      },
    });

    const filteredSales =
      customerId && customerId !== "Semua"
        ? salesData.filter(
            (sale) => sale.penjualan.id_pelanggan?.toString() === customerId
          )
        : salesData;
    console.log(filteredSales);

    const groupedSales = filteredSales.reduce((acc, item) => {
      console.log(item.total_harga);

      const { id, nama_produk } = item.produk;
      const harga_jual = item.harga_jual;
      const harga_beli = item.harga_beli;
      const diskon = item.diskon;

      if (!acc[id]) {
        acc[id] = {
          nama_barang: nama_produk,
          harga_satuan_beli: Number(harga_beli),
          harga_satuan_jual: Number(harga_jual),
          diskon: Number(diskon),
          qty_terjual: 0,
          neto: 0,
          untung: 0,
          tgl_penjualan: item.tanggal_penjualan,
        };
      }
      acc[id].qty_terjual += Number(item.qty);
      acc[id].neto += Number(item.total_harga);
      log(Number(item.total_harga));
      acc[id].untung +=
        Number(item.qty) *
        (Number(harga_jual) - Number(diskon) - Number(harga_beli ?? 0));
      return acc;
    }, {} as Record<string, any>);

    const sales = Object.values(groupedSales)
      .sort((a, b) => b.qty_terjual - a.qty_terjual)
      .slice(skip, skip + limit)
      .map((item) => ({
        ...item,
        harga_satuan_beli: Number(item.harga_satuan_beli),
        harga_satuan_jual: Number(item.harga_satuan_jual),
        qty_terjual: Number(item.qty_terjual),
        diskon: Number(item.diskon),
        neto: Number(item.neto),
        untung: Number(item.untung),
        tgl_penjualan: format(new Date(item.tgl_penjualan), "dd-MM-yyyy"),
      }));

    const total = Object.keys(groupedSales).length;
    const summary = {
      total_penjualan: Object.values(groupedSales).reduce(
        (sum: number, item: any) => sum + item.neto,
        0
      ),
      total_untung: Object.values(groupedSales).reduce(
        (sum: number, item: any) => sum + item.untung,
        0
      ),
      total_qty: Object.values(groupedSales).reduce(
        (sum: number, item: any) => sum + item.qty_terjual,
        0
      ),
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
