import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const skip = (page - 1) * limit;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const minTotal = searchParams.get("minTotal");
    const maxTotal = searchParams.get("maxTotal");
    const showDeleted = searchParams.get("showDeleted") === "true";

    let whereClause: any = {};

    // Base soft delete condition
    if (!showDeleted) {
      whereClause.isDeleted = false;
    }

    if (search) {
      whereClause.OR = [
        {
          users: {
            nama_user: {
              contains: search.trim(),
            },
          },
        },
      ];
    }

    if (startDate || endDate) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({
        tanggal_penjualan: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate + "T23:59:59.999Z") }),
        },
      });
    }

    if (minTotal || maxTotal) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({
        total_harga: {
          ...(minTotal && { gte: minTotal }),
          ...(maxTotal && { lte: maxTotal }),
        },
      });
    }

    console.log("Where clause:", JSON.stringify(whereClause, null, 2));

    const totalCount = await prisma.penjualan.count({
      where: whereClause,
    });

    const penjualan = await prisma.penjualan.findMany({
      where: whereClause,
      include: {
        users: {
          select: { nama_user: true },
        },
        pelanggan: {
          select: { nama: true },
        },
      },
      orderBy: { tanggal_penjualan: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json(
      {
        penjualan,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch penjualan data" },
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
      await prisma.penjualan.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });

      return NextResponse.json({
        message: "Sale record restored successfully",
      });
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
