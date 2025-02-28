"use server";

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

function formatPesanProdukTidakCukup(produkList: string[]): string {
  if (produkList.length === 1) {
    return `Stok produk ${produkList[0]} tidak mencukupi.`;
  } else if (produkList.length === 2) {
    return `Stok produk ${produkList.join(" dan ")} tidak mencukupi.`;
  } else {
    const terakhir = produkList.pop();
    return `Stok produk ${produkList.join(
      ", "
    )}, dan ${terakhir} tidak mencukupi.`;
  }
}

export async function createPenjualan(formdata: FormData) {
  const diskon = formdata.get("diskon") as string;
  const total_harga = formdata.get("total_harga") as string;
  const penyesuaian = (formdata.get("penyesuaian") as string) || "0";
  const total_bayar = formdata.get("total_bayar") as string;
  const kembalian = (formdata.get("kembalian") as string) || "0";
  const id_user = Number(formdata.get("id_user"));
  const id_pelanggan_raw = formdata.get("id_pelanggan") as string;
  const id_pelanggan = id_pelanggan_raw ? Number(id_pelanggan_raw) : null;
  const tanggal_penjualan = formdata.get("tanggal_penjualan") as string;
  const selectedProduk = JSON.parse(formdata.get("selectedProduk") as string);

  await prisma.$transaction(async (prisma) => {
    const penjualan = await prisma.penjualan.create({
      data: {
        id_user,
        id_pelanggan,
        diskon: new Prisma.Decimal(diskon),
        total_harga: new Prisma.Decimal(total_harga),
        penyesuaian: new Prisma.Decimal(penyesuaian),
        total_bayar: new Prisma.Decimal(total_bayar),
        kembalian: new Prisma.Decimal(kembalian),
        tanggal_penjualan: new Date(tanggal_penjualan),
      },
    });

    const produkTidakCukup: string[] = [];

    for (const item of selectedProduk) {
      const produk = await prisma.produk.findUnique({
        where: { id: item.id },
      });

      if (!produk) {
        throw new Error(`Produk dengan ID ${item.id} tidak ditemukan`);
      }

      if (produk.stok < item.quantity) {
        produkTidakCukup.push(produk.nama_produk);
      }
    }

    if (produkTidakCukup.length > 0) {
      throw new Error(formatPesanProdukTidakCukup(produkTidakCukup));
    }

    for (const item of selectedProduk) {
      const produk = await prisma.produk.findUnique({
        where: { id: item.id },
      });

      await prisma.detail_penjualan.create({
        data: {
          id_penjualan: penjualan.id,
          id_produk: item.id,
          harga_jual: produk!.harga_jual,
          qty: item.quantity,
          total_harga: new Prisma.Decimal(
            produk!.harga_jual.toNumber() * item.quantity
          ),
          tanggal_penjualan: new Date(tanggal_penjualan),
        },
      });

      await prisma.produk.update({
        where: { id: item.id },
        data: {
          stok: produk!.stok - item.quantity,
        },
      });

      await prisma.stok_management.create({
        data: {
          id_produk: item.id,
          stockIN: 0,
          stockOut: item.quantity,
        },
      });
    }
  });
}

export async function updatePenjualan(formdata: FormData, id: number) {
  const diskon = formdata.get("diskon") as string;
  const total_harga = formdata.get("total_harga") as string;
  const penyesuaian = (formdata.get("penyesuaian") as string) || "0";
  const total_bayar = formdata.get("total_bayar") as string;
  const kembalian = (formdata.get("kembalian") as string) || "0";
  const id_user = Number(formdata.get("id_user"));
  const id_pelanggan_raw = formdata.get("id_pelanggan") as string;
  const id_pelanggan = id_pelanggan_raw ? Number(id_pelanggan_raw) : null;
  const tanggal_penjualan = formdata.get("tanggal_penjualan") as string;
  const selectedProduk = JSON.parse(formdata.get("selectedProduk") as string);

  await prisma.$transaction(async (prisma) => {
    const oldDetails = await prisma.detail_penjualan.findMany({
      where: { id_penjualan: id },
    });

    for (const oldItem of oldDetails) {
      await prisma.produk.update({
        where: { id: oldItem.id_produk },
        data: {
          stok: { increment: oldItem.qty },
        },
      });
    }

    await prisma.detail_penjualan.deleteMany({
      where: { id_penjualan: id },
    });

    const produkTidakCukup: string[] = [];

    for (const item of selectedProduk) {
      const produk = await prisma.produk.findUnique({
        where: { id: item.id },
      });

      if (!produk) {
        throw new Error(`Produk dengan ID ${item.id} tidak ditemukan`);
      }

      if (produk.stok < item.quantity) {
        produkTidakCukup.push(produk.nama_produk);
      }
    }

    if (produkTidakCukup.length > 0) {
      throw new Error(formatPesanProdukTidakCukup(produkTidakCukup));
    }

    await prisma.penjualan.update({
      where: { id },
      data: {
        id_user,
        id_pelanggan,
        diskon: new Prisma.Decimal(diskon),
        total_harga: new Prisma.Decimal(total_harga),
        penyesuaian: new Prisma.Decimal(penyesuaian),
        total_bayar: new Prisma.Decimal(total_bayar),
        kembalian: new Prisma.Decimal(kembalian),
        tanggal_penjualan: new Date(tanggal_penjualan),
      },
    });

    for (const item of selectedProduk) {
      const produk = await prisma.produk.findUnique({
        where: { id: item.id },
      });

      await prisma.detail_penjualan.create({
        data: {
          id_penjualan: id,
          id_produk: item.id,
          harga_jual: produk!.harga_jual,
          qty: item.quantity,
          total_harga: new Prisma.Decimal(
            produk!.harga_jual.toNumber() * item.quantity
          ),
          tanggal_penjualan: new Date(tanggal_penjualan),
        },
      });

      await prisma.produk.update({
        where: { id: item.id },
        data: {
          stok: produk!.stok - item.quantity,
        },
      });

      await prisma.stok_management.create({
        data: {
          id_produk: item.id,
          stockIN: 0,
          stockOut: item.quantity,
        },
      });
    }
  });
}

export async function deletePenjualan(id: number) {
  await prisma.$transaction(async (prisma) => {
    const details = await prisma.detail_penjualan.findMany({
      where: { id_penjualan: id },
    });

    for (const detail of details) {
      await prisma.produk.update({
        where: { id: detail.id_produk },
        data: { stok: { increment: detail.qty } },
      });

      await prisma.stok_management.create({
        data: {
          id_produk: detail.id_produk,
          stockIN: detail.qty,
          stockOut: 0,
        },
      });
    }

    await prisma.detail_penjualan.deleteMany({
      where: { id_penjualan: id },
    });

    await prisma.penjualan.delete({
      where: { id },
    });
  });
}
