"use server";

import prisma from "@/lib/db";

export async function createPelanggan(formdata: FormData) {
  await prisma.pelanggan.create({
    data: {
      nama: formdata.get("nama") as string,
      alamat: formdata.get("alamat") as string,
      hp: formdata.get("hp") as string,
      status: formdata.get("status") as string,
    },
  });
}

export async function updatePelanggan(formdata: FormData, id: number) {
  await prisma.pelanggan.update({
    where: { id },
    data: {
      nama: formdata.get("nama") as string,
      alamat: formdata.get("alamat") as string,
      hp: formdata.get("hp") as string,
      status: formdata.get("status") as string,
    },
  });
}

export async function deletePelanggan(id: number) {
  await prisma.pelanggan.delete({ where: { id } });
}
