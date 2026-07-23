import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

const OWNER_EMAIL = "cahitberatozcan@gmail.com";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Eksik bilgi" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {
      return NextResponse.json(
        { message: "Şifre yanlış" },
        { status: 401 }
      );
    }

    /*
    ==========================================
    OWNER KONTROLÜ
    ==========================================

    SADECE:
    cahitberatozcan@gmail.com

    OWNER olabilir.

    Kullanıcı adı "jippon" olsa bile
    owner OLAMAZ.
    */

    let activeRole = user.role || "user";

    if (
      user.email.trim().toLowerCase() ===
      OWNER_EMAIL.toLowerCase()
    ) {
      activeRole = "owner";

      if (user.role !== "owner") {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            role: "owner",
          },
        });
      }
    }

    return NextResponse.json({
      message: "Giriş başarılı",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: activeRole,
      },
    });

  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "Sunucu hatası",
      },
      {
        status: 500,
      }
    );
  }
}