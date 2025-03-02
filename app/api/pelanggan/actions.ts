"use server";

import prisma from "@/lib/db";

export async function createPelanggan(formdata: FormData) {
  const nama = formdata.get("nama") as string;
  const existingUser = await prisma.pelanggan.findFirst({
    where: {
      nama,
      isDeleted: false,
    },
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
      isDeleted: false,
    },
  });
}

export async function updatePelanggan(formdata: FormData, id: number) {
  const nama = formdata.get("nama") as string;

  const existingUser = await prisma.pelanggan.findFirst({
    where: {
      nama,
      id: { not: id },
      isDeleted: false,
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
  await prisma.pelanggan.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}

export async function restorePelanggan(id: number) {
  await prisma.pelanggan.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
}

export async function hardDeletePelanggan(id: number) {
  await prisma.pelanggan.delete({ where: { id } });
}
