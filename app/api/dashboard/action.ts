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
  total_bayar: number;
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

  const incomeResult = await prisma.penjualan.aggregate({
    _sum: {
      total_bayar: true,
    },
    where: {
      isDeleted: false,
      tanggal_penjualan: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

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
    totalIncome: Number(incomeResult._sum.total_bayar || 0),
    activeCustomers,
  };
}

export async function getTopProducts(year: number): Promise<TopProductData[]> {
  noStore();

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const productSales = await prisma.$queryRaw<any[]>`
    SELECT 
      p.id,
      p.nama_produk,
      AVG(dp.harga_jual) as harga_jual,
      SUM(dp.qty) as qty,
      SUM(dp.total_harga) as total
    FROM detail_penjualan dp
    JOIN produk p ON dp.id_produk = p.id
    WHERE dp.isDeleted = false
    AND dp.tanggal_penjualan >= ${startDate}
    AND dp.tanggal_penjualan <= ${endDate}
    GROUP BY p.id, p.nama_produk
    ORDER BY total DESC
    LIMIT 30
  `;

  const totalSales = productSales.reduce(
    (sum, product) => sum + Number(product.total),
    0
  );

  return productSales.map((product) => ({
    id: product.id,
    nama_produk: product.nama_produk,
    harga_jual: Number(product.harga_jual),
    qty: Number(product.qty),
    total: Number(product.total),
    kontribusi: totalSales
      ? Math.round((Number(product.total) / totalSales) * 100)
      : 0,
  }));
}

export async function getCategoryData(year: number): Promise<CategoryData[]> {
  noStore();

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const categorySales = await prisma.$queryRaw<any[]>`
    SELECT 
      k.nama_kategori as name,
      SUM(dp.total_harga) as value
    FROM detail_penjualan dp
    JOIN produk p ON dp.id_produk = p.id
    JOIN kategori k ON p.id_kategori = k.id
    WHERE dp.isDeleted = false
    AND dp.tanggal_penjualan >= ${startDate}
    AND dp.tanggal_penjualan <= ${endDate}
    GROUP BY k.nama_kategori
    ORDER BY value DESC
    LIMIT 5
  `;

  return categorySales.map((category) => ({
    name: category.name,
    value: Number(category.value),
  }));
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
      created_at: true, // Tambahkan ini
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

  const customerData = await prisma.$queryRaw<any[]>`
    SELECT 
      p.nama,
      SUM(pj.total_bayar) as total
    FROM penjualan pj
    LEFT JOIN pelanggan p ON pj.id_pelanggan = p.id
    WHERE pj.isDeleted = false
    AND pj.tanggal_penjualan >= ${startDate}
    AND pj.tanggal_penjualan <= ${endDate}
    GROUP BY p.nama
    ORDER BY total DESC
    LIMIT 3
  `;

  return customerData.map((customer) => ({
    nama: customer.nama,
    total: Number(customer.total),
  }));
}

export async function getRecentSales(year: number): Promise<RecentSaleData[]> {
  noStore();

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const salesWithDetails = await prisma.$queryRaw<any[]>`
    SELECT 
      p.id,
      pl.nama as nama_pembeli,
      (SELECT COUNT(*) FROM detail_penjualan dp WHERE dp.id_penjualan = p.id AND dp.isDeleted = false) as item_count,
      (SELECT SUM(dp.qty) FROM detail_penjualan dp WHERE dp.id_penjualan = p.id AND dp.isDeleted = false) as total_items,
      p.total_bayar,
      p.tanggal_penjualan
    FROM penjualan p
    LEFT JOIN pelanggan pl ON p.id_pelanggan = pl.id
    WHERE p.isDeleted = false
    AND p.tanggal_penjualan >= ${startDate}
    AND p.tanggal_penjualan <= ${endDate}
    ORDER BY p.tanggal_penjualan DESC
    LIMIT 30
  `;

  return salesWithDetails.map((sale) => ({
    id: sale.id,
    nama_pembeli: sale.nama_pembeli || "Umum",
    item_count: Number(sale.total_items) || 0,
    total_bayar: Number(sale.total_bayar),
    tanggal_penjualan: sale.tanggal_penjualan,
  }));
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

  // Get the earliest and latest transaction years
  const earliestTransaction = await prisma.penjualan.findFirst({
    where: {
      isDeleted: false,
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
    },
    orderBy: {
      tanggal_penjualan: "desc",
    },
    select: {
      tanggal_penjualan: true,
    },
  });

  // If no transactions, return current year
  if (!earliestTransaction || !latestTransaction) {
    return [new Date().getFullYear()];
  }

  const startYear = earliestTransaction.tanggal_penjualan.getFullYear();
  const endYear = latestTransaction.tanggal_penjualan.getFullYear();

  // Generate array of years from latest to earliest
  const years: number[] = [];
  for (let year = endYear; year >= startYear; year--) {
    years.push(year);
  }

  return years;
}
