"use server";

import prisma from "@/lib/db";

const UserRoles = ["ADMIN", "PETUGAS"] as const;
type UserRole = (typeof UserRoles)[number];

export async function createUser(formdata: FormData) {
  const userPriv = formdata.get("user_priv") as string;

  if (!UserRoles.includes(userPriv as UserRole)) {
    throw new Error("Invalid user_priv value");
  }

  const username = formdata.get("username") as string;

  const existingUser = await prisma.users.findUnique({
    where: { username },
  });

  if (existingUser) {
    throw new Error("Username already taken");
  }

  await prisma.users.create({
    data: {
      nama_user: formdata.get("nama_user") as string,
      username,
      password: formdata.get("password") as string,
      user_priv: userPriv as UserRole,
      alamat: formdata.get("alamat") as string,
      hp: formdata.get("hp") as string,
      status: formdata.get("status") as string,
    },
  });
}

export async function updateUser(formdata: FormData, id: number) {
  const userPriv = formdata.get("user_priv") as string;

  if (!UserRoles.includes(userPriv as UserRole)) {
    throw new Error("Invalid user_priv value");
  }

  await prisma.users.update({
    where: { id },
    data: {
      nama_user: formdata.get("nama_user") as string,
      username: formdata.get("username") as string,
      password: formdata.get("password") as string,
      user_priv: userPriv as UserRole,
      alamat: formdata.get("alamat") as string,
      hp: formdata.get("hp") as string,
      status: formdata.get("status") as string,
    },
  });
}

export async function deleteUser(id: number) {
  await prisma.users.delete({
    where: { id },
  });
}
