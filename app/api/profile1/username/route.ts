import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    // ==========================================
    // İSTEK VERİLERİNİ AL
    // ==========================================

    const body = await request.json();

    const userId = Number(body.userId);
    const username = String(body.username || "").trim();

    // ==========================================
    // TEMEL KONTROLLER
    // ==========================================

    if (!userId) {
      return NextResponse.json(
        {
          message: "Geçersiz kullanıcı ID.",
        },
        {
          status: 400,
        }
      );
    }

    if (!username) {
      return NextResponse.json(
        {
          message: "Kullanıcı adı gerekli.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // KULLANICI ADI UZUNLUĞU
    // ==========================================

    if (username.length < 3) {
      return NextResponse.json(
        {
          message:
            "Kullanıcı adı en az 3 karakter olmalıdır.",
        },
        {
          status: 400,
        }
      );
    }

    if (username.length > 30) {
      return NextResponse.json(
        {
          message:
            "Kullanıcı adı en fazla 30 karakter olabilir.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // KULLANICI ADI KARAKTER KONTROLÜ
    // ==========================================

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        {
          message:
            "Kullanıcı adında sadece harf, rakam ve alt çizgi kullanılabilir.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // KÜÇÜK / BÜYÜK HARF KONTROLÜ
    // ==========================================

    const normalizedUsername = username.toLowerCase();

    // ==========================================
    // KULLANICIYI BUL
    // ==========================================

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "Kullanıcı bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // AYNI KULLANICI ADI VAR MI?
    // ==========================================

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
      },
    });

    const usernameTaken = users.some(
      (existingUser) => {
        // Kendi mevcut kullanıcı adını değiştirmeye
        // çalışıyorsa sorun oluşturma
        if (existingUser.id === user.id) {
          return false;
        }

        return (
          existingUser.username.trim().toLowerCase() ===
          normalizedUsername
        );
      }
    );

    if (usernameTaken) {
      return NextResponse.json(
        {
          message:
            "Bu kullanıcı adı zaten kullanılıyor.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================
    // SADECE KULLANICI ADINI GÜNCELLE
    //
    // DİKKAT:
    // BURADA "role" YOK.
    //
    // Kullanıcı adı değiştirmek:
    // - owner yapmaz
    // - admin yapmaz
    // - manager yapmaz
    // - translator yapmaz
    // - editor yapmaz
    // - mevcut rolü değiştirmez
    //
    // Kullanıcının mevcut rolü aynen korunur.
    // ==========================================

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        username: username,
      },

      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    // ==========================================
    // SONUCU DÖNDÜR
    // ==========================================

    return NextResponse.json(
      {
        message:
          "Kullanıcı adı başarıyla değiştirildi.",

        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      },
      {
        status: 200,
      }
    );

  } catch (error: any) {
    console.error(
      "USERNAME CHANGE ERROR:",
      error
    );

    // ==========================================
    // PRISMA UNIQUE HATASI
    // ==========================================

    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          message:
            "Bu kullanıcı adı zaten kullanılıyor.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================
    // GENEL HATA
    // ==========================================

    return NextResponse.json(
      {
        message:
          "Kullanıcı adı değiştirilemedi.",
      },
      {
        status: 500,
      }
    );
  }
}