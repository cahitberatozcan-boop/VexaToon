import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

const OWNER_EMAIL = "cahitberatozcan@gmail.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      username,
      email,
      password,
    } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        {
          message: "Eksik bilgi",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // Email daha önce kullanılmış mı?
    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          message:
            "Bu email zaten kayıtlı",
        },
        {
          status: 400,
        }
      );
    }

    // Şifreyi hashle
    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    /*
      SADECE BU EMAIL OWNER OLABİLİR

      Kullanıcı adının "jippon" olması
      artık hiçbir şey ifade etmez.
    */
    const assignedRole =
      normalizedEmail === OWNER_EMAIL
        ? "owner"
        : "user";

    // Kullanıcı oluştur
    const user =
      await prisma.user.create({
        data: {
          username:
            username.trim(),

          email:
            normalizedEmail,

          password:
            hashedPassword,

          role:
            assignedRole,
        },
      });

    return NextResponse.json(
      {
        message:
          "Kayıt başarılı",

        user: {
          id:
            user.id,

          username:
            user.username,

          email:
            user.email,

          role:
            user.role,
        },
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Sunucu hatası",
      },
      {
        status: 500,
      }
    );
  }
}