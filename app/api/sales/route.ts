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
          where: { isDeleted: false },
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
      const subTotal = sale.detail_penjualan.reduce((sum, item) => {
        return sum + item.qty * item.produk.harga_jual.toNumber();
      }, 0);

      return {
        id: sale.id,
        no_invoice: `${sale.id.toString().padStart(4, "0")}/INV/${format(
          sale.tanggal_penjualan,
          "yyyy"
        )}`,
        tgl_invoice: format(sale.tanggal_penjualan, "dd-MM-yyyy"),
        nama_customer: sale.pelanggan?.nama || "",
        sub_total: subTotal,
        diskon: sale.diskon.toNumber(),
        neto: sale.total_harga.toNumber(),
        bayar: sale.total_bayar.toNumber(),
        kembalian: sale.kembalian.toNumber(),
        penyesuaian: sale.penyesuaian.toNumber(),
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
