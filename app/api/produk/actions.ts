"use server";

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function createProduk(formdata: FormData) {
  const hargaBeli = formdata.get("harga_beli") as string;
  const hargaJual = formdata.get("harga_jual") as string;

  if (hargaBeli && hargaJual) {
    await prisma.produk.create({
      data: {
        id_kategori: Number(formdata.get("id_kategori")),
        nama_produk: formdata.get("nama_produk") as string,
        harga_beli: new Prisma.Decimal(hargaBeli),
        harga_jual: new Prisma.Decimal(hargaJual),
        stok: Number(formdata.get("stok")),
        barcode: formdata.get("barcode") as string,
      },
    });
  }
}

export async function updateProduk(formdata: FormData, id: number) {
  const hargaBeli = formdata.get("harga_beli") as string;
  const hargaJual = formdata.get("harga_jual") as string;

  if (hargaBeli && hargaJual) {
    await prisma.produk.update({
      where: { id },
      data: {
        id_kategori: Number(formdata.get("id_kategori")),
        nama_produk: formdata.get("nama_produk") as string,
        harga_beli: new Prisma.Decimal(hargaBeli),
        harga_jual: new Prisma.Decimal(hargaJual),
        stok: Number(formdata.get("stok")),
        barcode: formdata.get("barcode") as string,
      },
    });
  }
}

export async function deleteProduk(id: number) {
  await prisma.produk.delete({
    where: { id },
  });
}
