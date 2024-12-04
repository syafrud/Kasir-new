/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/db";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { nama_user, username, password, alamat, hp, status } =
      await req.json();
    const hashed = await hash(password, 12);

    const user = await prisma.users.create({
      data: {
        nama_user,
        username,
        password: hashed,
        alamat,
        hp,
        status,
      },
    });

    return NextResponse.json({
      user: {
        username: user.username,
      },
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      return new NextResponse(
        JSON.stringify({
          error:
            "The username is already taken. Please choose another username.",
        }),
        { status: 400 }
      );
    }

    return new NextResponse(
      JSON.stringify({
        error: err.message,
      }),
      { status: 500 }
    );
  }
}
