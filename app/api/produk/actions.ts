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

export async function adjustStock({
  productId,
  amount,
  type,
}: {
  productId: number;
  amount: number;
  type: "in" | "out";
}) {
  const product = await prisma.produk.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  await prisma.$transaction(async (tx) => {
    const newStock =
      type === "in" ? product.stok + amount : product.stok - amount;

    if (type === "out" && newStock < 0) {
      throw new Error("Insufficient stock");
    }

    await tx.produk.update({
      where: { id: productId },
      data: { stok: newStock },
    });

    await tx.stok_management.create({
      data: {
        id_produk: productId,
        stockIN: type === "in" ? amount : 0,
        stockOut: type === "out" ? amount : 0,
      },
    });
  });
}
