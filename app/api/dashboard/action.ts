"use server";

import prisma from "@/lib/db";
import { format } from "date-fns";
import { unstable_noStore as noStore } from "next/cache";

export type StatsData = {
  totalItemsSold: number;
  totalTransactions: number;
  totalIncome: number;
  activeCustomers: number;
};

export type TopProductData = {
  id: number;
  nama_produk: string;
  harga_jual: number;
  qty: number;
  total: number;
  kontribusi: number;
};

export type CategoryData = {
  name: string;
  value: number;
};

export type NewestItemData = {
  id: number;
  nama_produk: string;
  harga_jual: number;
  createdAt: string;
};

export type TopCustomerData = {
  nama: string | null;
  total: number;
};

export type RecentSaleData = {
  id: number;
  nama_pembeli: string | null;
  item_count: number;
  total_setelah_diskon: number;
  total_harga: number;
  diskon: number;
  penyesuaian: number;
  tanggal_penjualan: Date;
};

export async function getStats(year: number): Promise<StatsData> {
  noStore();

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const itemSoldResult = await prisma.detail_penjualan.aggregate({
    _sum: {
      qty: true,
    },
    where: {
      isDeleted: false,
      tanggal_penjualan: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalItemsSold = Number(itemSoldResult._sum.qty || 0);

  const totalTransactions = await prisma.penjualan.count({
    where: {
      isDeleted: false,
      tanggal_penjualan: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const PenjualanResult = await prisma.penjualan.aggregate({
    _sum: {
      total_harga: true,
    },
    where: {
      isDeleted: false,
      tanggal_penjualan: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalHarga = Number(PenjualanResult._sum.total_harga || 0);

  const totalIncome = totalHarga;

  const activeCustomers = await prisma.pelanggan.count({
    where: {
      isDeleted: false,
      status: "aktif",
      penjualan: {
        some: {
          isDeleted: false,
          tanggal_penjualan: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  });

  return {
    totalItemsSold,
    totalTransactions,
    totalIncome,
    activeCustomers,
  };
}

export async function getTopProducts(year: number): Promise<TopProductData[]> {
  noStore();

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const detailPenjualan = await prisma.detail_penjualan.findMany({
    where: {
      isDeleted: false,
      tanggal_penjualan: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id_produk: true,
      qty: true,
      harga_jual: true,
      total_harga: true,
      produk: {
        select: {
          id: true,
          nama_produk: true,
        },
      },
    },
  });

  const productMap = new Map();

  detailPenjualan.forEach((item) => {
    const id = item.produk.id;
    if (!productMap.has(id)) {
      productMap.set(id, {
        id: id,
        nama_produk: item.produk.nama_produk,
        harga_jual: 0,
        qty: 0,
        total: 0,
        count: 0,
      });
    }

    const product = productMap.get(id);
    product.harga_jual += Number(item.harga_jual);
    product.qty += Number(item.qty);
    product.total += Number(item.total_harga);
    product.count += 1;
  });

  let productSales = Array.from(productMap.values()).map((product) => ({
    id: product.id,
    nama_produk: product.nama_produk,
    harga_jual: product.count ? Number(product.harga_jual) / product.count : 0,
    qty: Number(product.qty),
    total: Number(product.total),
  }));

  productSales = productSales.sort((a, b) => b.total - a.total).slice(0, 5);

  const totalSales = productSales.reduce(
    (sum, product) => sum + product.total,
    0
  );

  return productSales.map((product) => ({
    ...product,
    kontribusi: totalSales ? Math.round((product.total / totalSales) * 100) : 0,
  }));
}

export async function getCategoryData(year: number): Promise<CategoryData[]> {
  noStore();

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const detailPenjualan = await prisma.detail_penjualan.findMany({
    where: {
      isDeleted: false,
      tanggal_penjualan: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      total_harga: true,
      produk: {
        select: {
          kategori: {
            select: {
              id: true,
              nama_kategori: true,
            },
          },
        },
      },
    },
  });

  const categoryMap = new Map();

  detailPenjualan.forEach((item) => {
    if (!item.produk?.kategori) return;

    const categoryName = item.produk.kategori.nama_kategori;
    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, 0);
    }

    categoryMap.set(
      categoryName,
      categoryMap.get(categoryName) + Number(item.total_harga)
    );
  });

  const categories = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return categories;
}

export async function getNewestItems(): Promise<NewestItemData[]> {
  noStore();

  const newestItems = await prisma.produk.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      created_at: "desc",
    },
    take: 5,
    select: {
      id: true,
      nama_produk: true,
      harga_jual: true,
      created_at: true,
    },
  });

  return newestItems.map((item) => ({
    id: item.id,
    nama_produk: item.nama_produk,
    harga_jual: Number(item.harga_jual),
    createdAt: format(item.created_at, "HH:mm:ss - yyyy-MM-dd"),
  }));
}

export async function getTopCustomers(
  year: number
): Promise<TopCustomerData[]> {
  noStore();

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const customerData = await prisma.penjualan.groupBy({
    by: ["id_pelanggan"],
    where: {
      isDeleted: false,
      tanggal_penjualan: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      total_harga: true,
    },
    orderBy: {
      _sum: {
        total_harga: "desc",
      },
    },
    take: 3,
  });

  const customerResults = await Promise.all(
    customerData.map(async (data) => {
      if (!data.id_pelanggan) {
        return {
          nama: "Umum",
          total: Number(data._sum.total_harga || 0),
        };
      }

      const customer = await prisma.pelanggan.findUnique({
        where: {
          id: data.id_pelanggan,
        },
        select: {
          nama: true,
        },
      });

      return {
        nama: customer?.nama || "Umum",
        total: Number(data._sum.total_harga || 0),
      };
    })
  );

  return customerResults;
}

export async function getRecentSales(year: number): Promise<RecentSaleData[]> {
  noStore();

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const sales = await prisma.penjualan.findMany({
    where: {
      isDeleted: false,
      tanggal_penjualan: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      tanggal_penjualan: "desc",
    },
    take: 30,
    select: {
      id: true,
      total_harga: true,
      diskon: true,
      penyesuaian: true,
      tanggal_penjualan: true,
      pelanggan: {
        select: {
          nama: true,
        },
      },
      detail_penjualan: {
        where: {
          isDeleted: false,
        },
        select: {
          qty: true,
          total_harga: true,
        },
      },
    },
  });

  return sales.map((sale) => {
    const itemCount = sale.detail_penjualan.reduce(
      (sum, detail) => sum + Number(detail.qty),
      0
    );
    const totalHarga = Number(sale.total_harga);
    const totalAfterDiscounts =
      totalHarga - Number(sale.diskon || 0) + Number(sale.penyesuaian || 0);

    return {
      id: sale.id,
      nama_pembeli: sale.pelanggan?.nama || "Umum",
      item_count: itemCount,
      total_harga: totalHarga,
      total_setelah_diskon: totalAfterDiscounts,
      diskon: Number(sale.diskon || 0),
      penyesuaian: Number(sale.penyesuaian || 0),
      tanggal_penjualan: sale.tanggal_penjualan,
    };
  });
}

export type GrowthStats = {
  itemsSoldGrowth: number;
  transactionsGrowth: number;
  incomeGrowth: number;
  customersGrowth: number;
};

export async function getGrowthStats(year: number): Promise<GrowthStats> {
  noStore();

  const currentYearStats = await getStats(year);

  const previousYearStats = await getStats(year - 1);

  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    itemsSoldGrowth: calculateGrowth(
      currentYearStats.totalItemsSold,
      previousYearStats.totalItemsSold
    ),
    transactionsGrowth: calculateGrowth(
      currentYearStats.totalTransactions,
      previousYearStats.totalTransactions
    ),
    incomeGrowth: calculateGrowth(
      currentYearStats.totalIncome,
      previousYearStats.totalIncome
    ),
    customersGrowth: calculateGrowth(
      currentYearStats.activeCustomers,
      previousYearStats.activeCustomers
    ),
  };
}
export async function getAvailableYears(): Promise<number[]> {
  noStore();

  try {
    const earliestTransaction = await prisma.penjualan.findFirst({
      where: {
        isDeleted: false,
        tanggal_penjualan: {
          not: null,
        },
      },
      orderBy: {
        tanggal_penjualan: "asc",
      },
      select: {
        tanggal_penjualan: true,
      },
    });

    const latestTransaction = await prisma.penjualan.findFirst({
      where: {
        isDeleted: false,
        tanggal_penjualan: {
          not: null,
        },
      },
      orderBy: {
        tanggal_penjualan: "desc",
      },
      select: {
        tanggal_penjualan: true,
      },
    });

    if (!earliestTransaction || !latestTransaction) {
      return [new Date().getFullYear()];
    }

    const isValidDate = (date: Date) => {
      return (
        date instanceof Date &&
        !isNaN(date.getTime()) &&
        date.getMonth() > 0 &&
        date.getDate() > 0
      );
    };

    if (
      !isValidDate(earliestTransaction.tanggal_penjualan) ||
      !isValidDate(latestTransaction.tanggal_penjualan)
    ) {
      return [new Date().getFullYear()];
    }

    const startYear = earliestTransaction.tanggal_penjualan.getFullYear();
    const endYear = latestTransaction.tanggal_penjualan.getFullYear();

    const years: number[] = [];
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }

    return years;
  } catch (error) {
    console.error("Error getting available years:", error);
    return [new Date().getFullYear()];
  }
}
