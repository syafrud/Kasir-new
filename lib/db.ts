import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  const prisma = new PrismaClient();

  prisma.$use(async (params, next) => {
    if (
      params.action === "findUnique" ||
      params.action === "findFirst" ||
      params.action === "findMany"
    ) {
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
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export async function softDelete<T>(model: any, id: number): Promise<T> {
  return await model.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}

export async function restoreSoftDelete<T>(model: any, id: number): Promise<T> {
  return await model.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
}

export function withSoftDeleted(includeSoftDeleted: boolean = false) {
  if (includeSoftDeleted) {
    return {};
  }
  return { isDeleted: false };
}

export function onlySoftDeleted() {
  return { isDeleted: true };
}

export default prisma;
