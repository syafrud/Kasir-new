// app/api/penjualan/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const users = await prisma.users.findMany({
      where: {
        OR: [
          {
            username: {
              contains: search.trim(),
            },
          },
          {
            nama_user: {
              contains: search.trim(),
            },
          },
        ],
        isDeleted: false,
      },
      orderBy: { username: "asc" },
      select: {
        id: true,
        username: true,
        nama_user: true,
      },
      take: 10,
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users data" },
      { status: 500 }
    );
  }
}
