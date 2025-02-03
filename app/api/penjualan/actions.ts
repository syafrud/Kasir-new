"use server";

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { DateTime } from "next-auth/providers/kakao";

export async function createPenjualan(formdata: FormData) {
  const diskon = formdata.get("diskon") as string;
  const total_harga = formdata.get("total_harga") as string;
  await prisma.penjualan.create({
    data: {
      id_user: Number(formdata.get("id_user")),
      id_pelanggan: Number(formdata.get("id_pelanggan")),
      diskon: new Prisma.Decimal(diskon),
      total_harga: new Prisma.Decimal(total_harga),
      tanggal_penjualan: formdata.get("tanggal_penjualan") as DateTime,
    },
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
