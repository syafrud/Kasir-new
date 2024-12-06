"use server";

import prisma from "@/lib/db";

export async function createKategori(formdata: FormData) {
  await prisma.kategori.create({
    data: {
      nama_kategori: formdata.get("nama_kategori") as string,
    },
  });
}

export async function updateKategori(formdata: FormData, id: number) {
  await prisma.kategori.update({
    where: { id },
    data: {
      nama_kategori: formdata.get("nama_kategori") as string,
    },
  });
}

export async function deleteKategori(id: number) {
  await prisma.kategori.delete({ where: { id } });
}
