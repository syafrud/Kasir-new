"use server";

import prisma from "@/lib/db";

export async function createPelanggan(formdata: FormData) {
  const nama = formdata.get("nama") as string;
  const existingUser = await prisma.pelanggan.findUnique({
    where: { nama },
  });

  if (existingUser) {
    throw new Error("Username already taken");
  }
  await prisma.pelanggan.create({
    data: {
      nama,
      alamat: formdata.get("alamat") as string,
      hp: formdata.get("hp") as string,
      status: formdata.get("status") as string,
    },
  });
}

export async function updatePelanggan(formdata: FormData, id: number) {
  const nama = formdata.get("nama") as string;

  const existingUser = await prisma.pelanggan.findFirst({
    where: {
      nama,
      id: { not: id },
    },
  });

  if (existingUser) {
    throw new Error("Username already taken");
  }

  await prisma.pelanggan.update({
    where: { id },
    data: {
      nama,
      alamat: formdata.get("alamat") as string,
      hp: formdata.get("hp") as string,
      status: formdata.get("status") as string,
    },
  });
}

export async function deletePelanggan(id: number) {
  await prisma.pelanggan.delete({ where: { id } });
}
