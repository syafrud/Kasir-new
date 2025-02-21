"use server";

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { DateTime } from "next-auth/providers/kakao";

export async function createPenjualan(formdata: FormData) {
  const diskon = formdata.get("diskon") as string;
  const total_harga = formdata.get("total_harga") as string;
  const id_user = Number(formdata.get("id_user"));
  const id_pelanggan_raw = formdata.get("id_pelanggan") as string;
  const id_pelanggan = id_pelanggan_raw ? Number(id_pelanggan_raw) : null; // Jika kosong, ubah ke null
  const tanggal_penjualan = formdata.get("tanggal_penjualan") as string;
  const selectedProduk = JSON.parse(formdata.get("selectedProduk") as string);

  await prisma.$transaction(async (prisma) => {
    const penjualan = await prisma.penjualan.create({
      data: {
        id_user,
        id_pelanggan, // Bisa null
        diskon: new Prisma.Decimal(diskon),
        total_harga: new Prisma.Decimal(total_harga),
        tanggal_penjualan: new Date(tanggal_penjualan),
      },
    });

    for (const item of selectedProduk) {
      const produk = await prisma.produk.findUnique({
        where: { id: item.id },
      });

      if (!produk) {
        throw new Error(`Produk dengan ID ${item.id} tidak ditemukan`);
      }

      if (produk.stok < item.quantity) {
        throw new Error(`Stok produk ${produk.nama_produk} tidak mencukupi`);
      }

      await prisma.detail_penjualan.create({
        data: {
          id_penjualan: penjualan.id,
          id_produk: item.id,
          harga_jual: produk.harga_jual,
          qty: item.quantity,
          total_harga: new Prisma.Decimal(
            produk.harga_jual.toNumber() * item.quantity
          ),
          tanggal_penjualan: new Date(tanggal_penjualan),
        },
      });

      await prisma.produk.update({
        where: { id: item.id },
        data: {
          stok: produk.stok - item.quantity,
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
  await prisma.penjualan.update({
    where: { id },
    data: {
      id_user: Number(formdata.get("id_user")),
      id_pelanggan: Number(formdata.get("id_pelanggan")),
      diskon: new Prisma.Decimal(diskon),
      total_harga: new Prisma.Decimal(total_harga),
      tanggal_penjualan: formdata.get("tanggal_penjualan") as DateTime,
    },
  });
}

export async function deletePenjualan(id: number) {
  await prisma.penjualan.delete({ where: { id } });
}
