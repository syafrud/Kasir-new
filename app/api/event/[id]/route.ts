import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const newId = parseInt(id);
    const body = await request.json();
    const { nama_event, deskripsi, tanggal_mulai, tanggal_selesai } = body;

    if (!nama_event || !tanggal_mulai || !tanggal_selesai) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: newId },
      data: {
        nama_event,
        deskripsi,
        tanggal_mulai: new Date(tanggal_mulai),
        tanggal_selesai: new Date(tanggal_selesai),
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}
