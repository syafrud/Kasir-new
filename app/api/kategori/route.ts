import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const skip = (page - 1) * limit;

    const totalCount = await prisma.kategori.count({
      where: search
        ? {
            nama_kategori: {
              contains: search.trim().toLowerCase(),
            },
          }
        : undefined,
    });

    const kategori = await prisma.kategori.findMany({
      where: search
        ? {
            nama_kategori: {
              contains: search.trim().toLowerCase(),
            },
          }
        : undefined,
      orderBy: { id: "asc" },
      skip,
      take: limit,
    });

    return NextResponse.json(
      {
        kategori,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
