import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Search } from "lucide-react";

export async function GET(request: NextRequest) {
  try {
    const kategori = await prisma.kategori.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(kategori, { status: 200 });
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
