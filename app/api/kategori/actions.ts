"use server";

import prisma from "@/lib/db";

export async function createKategori(formdata: FormData) {
  await prisma.kategori.create({
    data: {
      nama_kategori: formdata.get("nama_kategori") as string,
      isDeleted: false,
    },
  });
}

export async function updateKategori(formdata: FormData, id: number) {
  await prisma.kategori.update({
    where: { id },
    data: {
      nama_kategori: formdata.get("nama_kategori") as string,
      isDeleted: false,
    },
  });
}

export async function deleteKategori(id: number) {
  await prisma.kategori.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}
export async function restoreKategori(id: number) {
  await prisma.kategori.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
}

export async function hardDeleteKategori(id: number) {
  await prisma.kategori.delete({ where: { id } });
}
