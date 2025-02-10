"use server";

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { DateTime } from "next-auth/providers/kakao";

export async function createDetail(formdata: FormData) {
  const harga_jual = formdata.get("harga_jual") as string;
  const total_harga = formdata.get("total_harga") as string;
  const id_penjualan = Number(formdata.get("id_penjualan"));
  const penjualan = await prisma.penjualan.findUnique({
    where: { id: id_penjualan },
  });

  if (!penjualan) {
    throw new Error("Penjualan ID not found");
  }
  await prisma.detail_penjualan.create({
    data: {
      id_penjualan,
      id_produk: Number(formdata.get("id_produk")),
      harga_jual: new Prisma.Decimal(harga_jual),
      qty: Number(formdata.get("qty")),
      total_harga: new Prisma.Decimal(total_harga),
      tanggal_penjualan: formdata.get("tanggal_penjualan") as DateTime,
    },
  });
}

export async function updateDetail(formdata: FormData, id: number) {
  const harga_jual = formdata.get("harga_jual") as string;
  const total_harga = formdata.get("total_harga") as string;

  await prisma.detail_penjualan.update({
    where: { id },
    data: {
      id_penjualan: Number(formdata.get("id_penjualan")),
      id_produk: Number(formdata.get("id_produk")),
      harga_jual: new Prisma.Decimal(harga_jual),
      qty: Number(formdata.get("qty")),
      total_harga: new Prisma.Decimal(total_harga),
      tanggal_penjualan: formdata.get("tanggal_penjualan") as DateTime,
    },
  });
}

export async function deleteDetail(id: number) {
  await prisma.detail_penjualan.delete({ where: { id } });
}
