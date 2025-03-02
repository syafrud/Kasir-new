"use server";

import prisma from "@/lib/db";
import { hash } from "bcrypt";

const UserRoles = ["ADMIN", "PETUGAS"] as const;
type UserRole = (typeof UserRoles)[number];

export async function createUser(formdata: FormData) {
  const userPriv = formdata.get("user_priv") as string;

  if (!UserRoles.includes(userPriv as UserRole)) {
    throw new Error("Invalid user_priv value");
  }

  const username = formdata.get("username") as string;
  const password = formdata.get("password") as string;
  const hashed = await hash(password, 12);

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
      password: hashed,
      user_priv: userPriv as UserRole,
      alamat: formdata.get("alamat") as string,
      hp: formdata.get("hp") as string,
      status: formdata.get("status") as string,
      isDeleted: false,
    },
  });
}

export async function updateUser(formdata: FormData, id: number) {
  const userPriv = formdata.get("user_priv") as string;

  if (!UserRoles.includes(userPriv as UserRole)) {
    throw new Error("Invalid user_priv value");
  }

  const username = formdata.get("username") as string;
  const password = formdata.get("password") as string;
  const hashed = await hash(password, 12);

  // Check if user exists and is not deleted
  const user = await prisma.users.findUnique({
    where: { id, isDeleted: false },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if username is already taken by another user
  const existingUser = await prisma.users.findFirst({
    where: {
      username,
      id: { not: id },
      isDeleted: false,
    },
  });

  if (existingUser) {
    throw new Error("Username already taken");
  }

  await prisma.users.update({
    where: { id },
    data: {
      nama_user: formdata.get("nama_user") as string,
      username,
      password: hashed,
      user_priv: userPriv as UserRole,
      alamat: formdata.get("alamat") as string,
      hp: formdata.get("hp") as string,
      status: formdata.get("status") as string,
    },
  });
}

export async function deleteUser(id: number) {
  // Check if user exists and is not already deleted
  const user = await prisma.users.findUnique({
    where: { id, isDeleted: false },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Soft delete the user
  await prisma.users.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}

export async function restoreUser(id: number) {
  // Check if user exists and is deleted
  const user = await prisma.users.findUnique({
    where: { id, isDeleted: true },
  });

  if (!user) {
    throw new Error("Deleted user not found");
  }

  // Restore the user
  await prisma.users.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
}
