import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const skip = (page - 1) * limit;
    const showDeleted = searchParams.get("showDeleted") === "true";

    const baseCondition = search
      ? {
          username: {
            contains: search.trim().toLowerCase(),
          },
        }
      : {};

    const whereCondition = {
      ...baseCondition,
      ...(showDeleted ? {} : { isDeleted: false }),
    };

    const totalCount = await prisma.users.count({
      where: whereCondition,
    });

    const users = await prisma.users.findMany({
      where: whereCondition,
      orderBy: { id: "asc" },
      skip,
      take: limit,
    });

    return NextResponse.json(
      {
        users,
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

export async function PATCH(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { id, action } = requestData;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (action === "restore") {
      await prisma.users.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });

      return NextResponse.json({ message: "User restored successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
