import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const skip = (page - 1) * limit;

  try {
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where: {
          isDeleted: false,
          OR: [
            { nama_event: { contains: search } },
            { deskripsi: { contains: search } },
          ],
        },
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.event.count({
        where: {
          isDeleted: false,
          OR: [
            { nama_event: { contains: search } },
            { deskripsi: { contains: search } },
          ],
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      events,
      totalCount,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama_event, deskripsi, tanggal_mulai, tanggal_selesai } = body;

    if (!nama_event || !tanggal_mulai || !tanggal_selesai) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        nama_event,
        deskripsi,
        tanggal_mulai: new Date(tanggal_mulai),
        tanggal_selesai: new Date(tanggal_selesai),
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
