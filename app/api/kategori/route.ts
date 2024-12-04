import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    console.log("Raw search parameter:", search);

    const kategori = await prisma.kategori.findMany({
      where: search
        ? {
            nama_kategori: {
              contains: search.trim().toLowerCase(),
            },
          }
        : undefined,
      orderBy: { id: "asc" },
    });

    console.log("Kategori results:", kategori);

    // Ensure a successful response even if no results
    return NextResponse.json(kategori, { status: 200 });
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
