//app/api/produk
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [produk, totalCount] = await Promise.all([
      prisma.produk.findMany({
        where: {
          OR: [
            { nama_produk: { contains: search } },
            { kategori: { nama_kategori: { contains: search } } },
          ],
          isDeleted: false,
        },
        include: {
          kategori: {
            select: {
              nama_kategori: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.produk.count({
        where: {
          OR: [
            { nama_produk: { contains: search } },
            { kategori: { nama_kategori: { contains: search } } },
          ],
          isDeleted: false,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        produk,
        totalCount,
        totalPages,
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
      await prisma.produk.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });

      return NextResponse.json({ message: "Product restored successfully" });
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
