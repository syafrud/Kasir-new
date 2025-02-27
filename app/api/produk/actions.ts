"use server";

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function createProduk(formdata: FormData) {
  const hargaBeli = formdata.get("harga_beli") as string;
  const hargaJual = formdata.get("harga_jual") as string;
  const barcode = formdata.get("barcode") as string;
  const file = formdata.get("image") as File | null;

  if (!file) {
    throw new Error("Gambar produk harus diunggah");
  }

  const uploadsDir = path.join(process.cwd(), "public/uploads");
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name}`;
  const filepath = path.join(process.cwd(), "public/uploads", filename);

  await writeFile(filepath, buffer);

  const existingBarcode = await prisma.produk.findUnique({
    where: { barcode },
  });

  if (existingBarcode) {
    throw new Error("Barcode already taken");
  }

  if (hargaBeli && hargaJual) {
    await prisma.produk.create({
      data: {
        id_kategori: Number(formdata.get("id_kategori")),
        nama_produk: formdata.get("nama_produk") as string,
        harga_beli: new Prisma.Decimal(hargaBeli),
        harga_jual: new Prisma.Decimal(hargaJual),
        stok: Number(formdata.get("stok")),
        barcode,
        image: `/uploads/${filename}`,
      },
    });
  }
}

export async function updateProduk(formdata: FormData, id: number) {
  const hargaBeli = formdata.get("harga_beli") as string;
  const hargaJual = formdata.get("harga_jual") as string;
  const barcode = formdata.get("barcode") as string;
  const file = formdata.get("image") as File | null;

  const existingProduk = await prisma.produk.findUnique({ where: { id } });

  if (!existingProduk) {
    throw new Error("Produk tidak ditemukan");
  }

  let imagePath = existingProduk.image;

  if (file) {
    if (imagePath) {
      try {
        const fullPath = path.join(process.cwd(), "public", imagePath);
        if (existsSync(fullPath)) {
          await unlink(fullPath);
        }
      } catch (error) {
        console.error("Error deleting previous image:", error);
      }
    }

    const uploadsDir = path.join(process.cwd(), "public/uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(process.cwd(), "public/uploads", filename);

    await writeFile(filepath, buffer);
    imagePath = `/uploads/${filename}`;
  }

  const existingBarcode = await prisma.produk.findFirst({
    where: { barcode, id: { not: id } },
  });

  if (existingBarcode) {
    throw new Error("Barcode already taken");
  }

  await prisma.produk.update({
    where: { id },
    data: {
      id_kategori: Number(formdata.get("id_kategori")),
      nama_produk: formdata.get("nama_produk") as string,
      harga_beli: new Prisma.Decimal(hargaBeli),
      harga_jual: new Prisma.Decimal(hargaJual),
      stok: Number(formdata.get("stok")),
      barcode,
      image: imagePath,
    },
  });
}

export async function deleteProduk(id: number) {
  const product = await prisma.produk.findUnique({ where: { id } });

  if (product && product.image) {
    try {
      const fullPath = path.join(process.cwd(), "public", product.image);
      if (existsSync(fullPath)) {
        await unlink(fullPath);
      }
    } catch (error) {
      console.error("Error deleting product image:", error);
    }
  }

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
