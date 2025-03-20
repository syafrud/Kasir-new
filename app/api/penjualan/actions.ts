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

function convertDecimalToNumber(obj: any) {
  const convertedObj = { ...obj };

  const decimalFields = [
    "diskon",
    "total_harga",
    "penyesuaian",
    "total_bayar",
    "kembalian",
    "harga_jual",
    "total_harga",
  ];

  decimalFields.forEach((field) => {
    if (
      convertedObj[field] &&
      typeof convertedObj[field].toNumber === "function"
    ) {
      convertedObj[field] = convertedObj[field].toNumber();
    }
  });

  return convertedObj;
}

export async function createPenjualan(formdata: FormData) {
  return await prisma.$transaction(async (prisma) => {
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
        isDeleted: false,
      },
    });

    const produkTidakCukup: string[] = [];

    for (const item of selectedProduk) {
      const produk = await prisma.produk.findUnique({
        where: { id: item.id },
      });

      if (!produk || produk.isDeleted) {
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

      if (!produk) continue;

      const itemDiscount = Number(item.discount || item.diskon || 0);
      const itemQuantity = Number(item.quantity);
      const itemPrice = produk.harga_jual.toNumber();
      const itemTotalPrice = (itemPrice - itemDiscount) * itemQuantity;

      let event_produkId = null;
      if (item.eventId) {
        const eventProduk = await prisma.event_produk.findUnique({
          where: {
            id_event_id_produk: {
              id_event: item.eventId,
              id_produk: item.id,
            },
          },
        });

        if (eventProduk) {
          event_produkId = eventProduk.id;
        }
      }

      await prisma.detail_penjualan.create({
        data: {
          id_penjualan: penjualan.id,
          id_produk: item.id,
          diskon: new Prisma.Decimal(itemDiscount),
          harga_beli: produk.harga_beli,
          harga_jual: produk.harga_jual,
          qty: itemQuantity,
          event_produkId: event_produkId,
          total_harga: new Prisma.Decimal(itemTotalPrice),
          tanggal_penjualan: new Date(tanggal_penjualan),
          isDeleted: false,
        },
      });

      await prisma.produk.update({
        where: { id: item.id },
        data: {
          stok: produk.stok - itemQuantity,
        },
      });

      await prisma.stok_management.create({
        data: {
          id_produk: item.id,
          stockIN: 0,
          stockOut: itemQuantity,
          isDeleted: false,
        },
      });
    }

    return convertDecimalToNumber(penjualan);
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
    const existingPenjualan = await prisma.penjualan.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existingPenjualan) {
      throw new Error(`Penjualan dengan ID ${id} tidak ditemukan`);
    }

    const oldDetails = await prisma.detail_penjualan.findMany({
      where: { id_penjualan: id, isDeleted: false },
    });

    const updateTimestamp = new Date();

    for (const oldItem of oldDetails) {
      const stockManagementEntries = await prisma.stok_management.findMany({
        where: {
          id_produk: oldItem.id_produk,
          isDeleted: false,
          created_at: {
            gte: new Date(
              existingPenjualan.tanggal_penjualan.getTime() - 60000
            ),
            lte: new Date(
              existingPenjualan.tanggal_penjualan.getTime() + 60000
            ),
          },
          stockOut: { gt: 0 },
        },
        orderBy: {
          created_at: "desc",
        },
        take: 1,
      });

      if (stockManagementEntries.length > 0) {
        await prisma.stok_management.update({
          where: { id: stockManagementEntries[0].id },
          data: {
            isDeleted: true,
            deletedAt: updateTimestamp,
          },
        });
      }

      await prisma.produk.update({
        where: { id: oldItem.id_produk },
        data: {
          stok: { increment: oldItem.qty },
        },
      });
    }

    await prisma.detail_penjualan.updateMany({
      where: { id_penjualan: id, isDeleted: false },
      data: {
        isDeleted: true,
        deletedAt: updateTimestamp,
      },
    });

    const produkTidakCukup: string[] = [];

    for (const item of selectedProduk) {
      const produk = await prisma.produk.findUnique({
        where: { id: item.id, isDeleted: false },
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

    const tanggalPenjualan = new Date(tanggal_penjualan);

    for (const item of selectedProduk) {
      const produk = await prisma.produk.findUnique({
        where: { id: item.id },
      });

      if (!produk) continue;

      const itemDiscount = Number(item.discount || item.diskon || 0);
      const itemQuantity = Number(item.quantity);
      const itemPrice = produk.harga_jual.toNumber();
      const itemTotalPrice = (itemPrice - itemDiscount) * itemQuantity;

      let event_produkId = null;
      if (item.eventId) {
        const eventProduk = await prisma.event_produk.findUnique({
          where: {
            id_event_id_produk: {
              id_event: item.eventId,
              id_produk: item.id,
            },
          },
        });

        if (eventProduk) {
          event_produkId = eventProduk.id;
        }
      }

      await prisma.detail_penjualan.create({
        data: {
          id_penjualan: id,
          id_produk: item.id,
          diskon: new Prisma.Decimal(itemDiscount),
          harga_beli: produk.harga_beli,
          harga_jual: produk.harga_jual,
          qty: itemQuantity,
          event_produkId: event_produkId,
          total_harga: new Prisma.Decimal(itemTotalPrice),
          tanggal_penjualan: tanggalPenjualan,
          isDeleted: false,
        },
      });

      await prisma.produk.update({
        where: { id: item.id },
        data: {
          stok: produk.stok - itemQuantity,
        },
      });

      await prisma.stok_management.create({
        data: {
          id_produk: item.id,
          stockIN: 0,
          stockOut: itemQuantity,
          created_at: tanggalPenjualan,
          isDeleted: false,
        },
      });
    }
  });
}

export async function deletePenjualan(id: number) {
  await prisma.$transaction(async (prisma) => {
    const existingPenjualan = await prisma.penjualan.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existingPenjualan) {
      throw new Error(`Penjualan dengan ID ${id} tidak ditemukan`);
    }

    const details = await prisma.detail_penjualan.findMany({
      where: { id_penjualan: id, isDeleted: false },
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
          isDeleted: false,
        },
      });

      await prisma.detail_penjualan.update({
        where: { id: detail.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    }

    await prisma.penjualan.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  });
}

export async function restorePenjualan(id: number) {
  await prisma.$transaction(async (prisma) => {
    const existingPenjualan = await prisma.penjualan.findUnique({
      where: { id, isDeleted: true },
    });

    if (!existingPenjualan) {
      throw new Error(`Penjualan dengan ID ${id} tidak ditemukan`);
    }

    await prisma.penjualan.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    await prisma.detail_penjualan.updateMany({
      where: { id_penjualan: id, isDeleted: true },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    const details = await prisma.detail_penjualan.findMany({
      where: { id_penjualan: id },
    });

    for (const detail of details) {
      await prisma.produk.update({
        where: { id: detail.id_produk },
        data: { stok: { decrement: detail.qty } },
      });
    }
  });
}
