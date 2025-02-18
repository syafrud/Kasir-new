// app/api/penjualan/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching users...");

    const users = await prisma.users.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        username: true,
      },
    });

    console.log("Users found:", users);

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
