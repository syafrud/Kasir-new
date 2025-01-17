import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    console.log("Raw search parameter:", search);

    const pelanggan = await prisma.pelanggan.findMany({
      where: search
        ? {
            nama: {
              contains: search.trim().toLowerCase(),
            },
          }
        : undefined,
      orderBy: { id: "asc" },
    });

    console.log("Kategori results:", pelanggan);

    return NextResponse.json(pelanggan, { status: 200 });
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
