// app/api/sales/route.ts
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
    const customer = searchParams.get("customer");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
      tanggal_penjualan: {
        gte: new Date(`${startDate}T00:00:00`),
        lte: new Date(`${endDate}T23:59:59`),
      },
    };

    if (customer && customer !== "Semua") {
      where.pelanggan = {
        nama: {
          equals: customer,
        },
      };
    }

    const totalItems = await prisma.penjualan.count({
      where,
    });

    const sales = await prisma.penjualan.findMany({
      where,
      include: {
        pelanggan: {
          select: {
            nama: true,
          },
        },
        detail_penjualan: {
          include: {
            produk: {
              select: {
                harga_beli: true,
                harga_jual: true,
              },
            },
          },
        },
      },
      orderBy: {
        tanggal_penjualan: "desc",
      },
      skip,
      take: limit,
    });

    const customers = await prisma.pelanggan.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        nama: true,
      },
      orderBy: {
        nama: "asc",
      },
    });

    const formattedSales = sales.map((sale) => {
      const profit = sale.detail_penjualan.reduce((sum, item) => {
        const itemProfit =
          item.qty *
          (item.harga_jual.toNumber() - item.produk.harga_beli.toNumber());
        return sum + itemProfit;
      }, 0);

      const remainingPayment = Math.max(
        0,
        sale.total_harga.toNumber() - sale.total_bayar.toNumber()
      );

      return {
        id: sale.id,
        no_invoice: `${sale.id.toString().padStart(4, "0")}/INV/IK/${format(
          sale.tanggal_penjualan,
          "yyyy"
        )}`,
        tgl_invoice: format(sale.tanggal_penjualan, "dd-MM-yyyy"),
        nama_customer: sale.pelanggan?.nama || "",
        sub_total: sale.total_harga.toNumber(),
        diskon: sale.diskon.toNumber(),
        neto: sale.total_harga.toNumber(),
        untung: profit,
        kurang_bayar: remainingPayment,
        status: remainingPayment > 0 ? "kurang_bayar" : "lunas",
      };
    });

    return NextResponse.json({
      sales: formattedSales,
      total: totalItems,
      customers: customers.map((c) => c.nama),
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
