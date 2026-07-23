import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const messages = await prisma.chatMessage.findMany({
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("CHAT GET ERROR:", error);

    return NextResponse.json(
      { message: "Mesajlar alınamadı." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log("POST /api/chat çalıştı");

  try {
    const body = await request.json();

    console.log("Gelen veri:", body);

    const userId = Number(body.userId);
    const content = String(body.content || "").trim();

    if (!userId) {
      return NextResponse.json(
        { message: "Kullanıcı ID bulunamadı." },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { message: "Mesaj boş olamaz." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: content,
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    console.log("Mesaj başarıyla oluşturuldu:", message.id);

    return NextResponse.json(
      { message },
      { status: 201 }
    );
  } catch (error) {
    console.error("CHAT POST ERROR:", error);

    return NextResponse.json(
      {
        message: "Mesaj gönderilirken sunucu hatası oluştu.",
        error: String(error),
      },
      { status: 500 }
    );
  }
}