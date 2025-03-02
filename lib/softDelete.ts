// Simpan file ini sebagai lib/softDelete.ts

import { PrismaClient } from "@prisma/client";

// Extend tipe Prisma
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaClient {
    interface SoftDeleteParams {
      id: number;
    }
  }
}

// Buat prisma client middleware untuk soft delete
export function setupSoftDelete(prisma: PrismaClient) {
  // Middleware untuk selalu memfilter soft-deleted records secara default
  prisma.$use(async (params, next) => {
    // Filter hanya untuk operasi find
    if (
      params.action === "findUnique" ||
      params.action === "findFirst" ||
      params.action === "findMany"
    ) {
      // Tambahkan filter isDeleted: false jika belum ada
      if (params.args.where) {
        if (params.args.where.isDeleted === undefined) {
          params.args.where.isDeleted = false;
        }
      } else {
        params.args.where = { isDeleted: false };
      }
    }

    return next(params);
  });

  return prisma;
}

// Helper function untuk soft delete
export async function softDelete<T>(model: any, id: number): Promise<T> {
  return await model.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}

// Helper function untuk restore soft deleted record
export async function restoreSoftDelete<T>(model: any, id: number): Promise<T> {
  return await model.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
}

// Helper function untuk memfilter (atau tidak) soft deleted records
export function withSoftDeleted(includeSoftDeleted: boolean = false) {
  if (includeSoftDeleted) {
    return {};
  }
  return { isDeleted: false };
}

// Helper function untuk mengambil hanya soft deleted records
export function onlySoftDeleted() {
  return { isDeleted: true };
}
