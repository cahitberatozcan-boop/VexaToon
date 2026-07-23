import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

const OWNER_EMAIL =
  "cahitberatozcan@gmail.com";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const {
      email,
      password,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          message:
            "Eksik bilgi",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    // Kullanıcıyı bul
    const user =
      await prisma.user.findUnique({
        where: {
          email:
            normalizedEmail,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          message:
            "Kullanıcı bulunamadı",
        },
        {
          status: 404,
        }
      );
    }

    // Şifre kontrolü
    const passwordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          message:
            "Şifre yanlış",
        },
        {
          status: 401,
        }
      );
    }

    /*
      OWNER KONTROLÜ SADECE EMAIL İLE YAPILIR.

      Kullanıcı adı "jippon" olsa bile
      owner olmaz.
    */

    let activeRole =
      user.role || "user";

    if (
      normalizedEmail ===
      OWNER_EMAIL
    ) {
      activeRole = "owner";

      // Veritabanındaki rolü de düzelt
      if (
        user.role !== "owner"
      ) {
        await prisma.user.update({
          where: {
            id:
              user.id,
          },

          data: {
            role:
              "owner",
          },
        });
      }
    }

    /*
      Eğer owner email'i olmayan bir
      kullanıcının veritabanında yanlışlıkla
      owner rolü varsa onu user yap.
    */

    if (
      normalizedEmail !==
        OWNER_EMAIL &&
      user.role === "owner"
    ) {
      activeRole = "user";

      await prisma.user.update({
        where: {
          id:
            user.id,
        },

        data: {
          role:
            "user",
        },
      });
    }

    return NextResponse.json(
      {
        message:
          "Giriş başarılı",

        user: {
          id:
            user.id,

          username:
            user.username,

          email:
            user.email,

          role:
            activeRole,
        },
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(
      "LOGIN ERROR:",
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